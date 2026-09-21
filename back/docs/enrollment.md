# Enrôlement des utilisateurs Pastell (auto-provisioning)

## Vue d'ensemble

```mermaid
flowchart TB
    subgraph S1["Utilisateur"]
        A["Agent territorial"]
    end

    subgraph S2["Connexion SSO"]
        K["Compte habituel de la collectivité"]
    end

    subgraph S3["MegActe"]
        DB[("Base des profils agents")]
        SYNC["Rafraîchissement automatique<br/>toutes les 24 heures"]
        R{"Agent déjà enregistré ?"}
        ENROL["Enregistrement automatique<br/>au premier accès"]
        TOKEN["Jeton d'accès dédié créé<br/>pour l'agent"]
        OK["Accès aux documents"]
    end

    subgraph S4["Pastell"]
        SRC[("Liste officielle des agents")]
    end

    A -->|"1. Connexion"| K -->|"2. Identité vérifiée"| R
    R -- "Oui" --> OK
    R -- "Non" --> ENROL --> TOKEN --> OK
    SYNC -->|"interroge la liste des agents"| SRC
    SRC -->|"retourne la liste, mise à jour automatique"| SYNC
    SYNC --> DB
    DB --> R
```

### Points importants

Un agent se connecte à MegActe avec **son compte habituel** (SSO).
MegActe gère l'autoprovisionning, sans intervention / configuration supplémentaire :

- **En arrière-plan, MegActe rafraîchit automatiquement** (toutes les 24 h) la liste
  des agents depuis Pastell. Pas de saisie manuelle.
- **Au premier accès**, le profil de l'agent est créé automatiquement dans MegActe
  et un jeton d'accès dédié lui est attribué. Pas de nouveau mot de passe à retenir.
- Ensuite, l'agent **accède directement à ses documents**.

## Algorithme d'enrollment détaillé (premier login)

Flux déclenché à chaque appel authentifié : le JWT Keycloak est validé, `preferred_username` sert de login Pastell, puis `get_user_from_db` (`app/database.py`) résout l'utilisateur local avec enrôlement progressif si nécessaire.

```mermaid
flowchart TD
    A[Requête HTTP + JWT OIDC validé<br/>login = preferred_username] --> B[get_user_from_db: SELECT pastell_users<br/>WHERE login = ?] --> C{User en BDD ET actif ?}

    C -- Oui --> D[Sortir login du cache négatif] --> E[ensure_user_has_token]

    C -- Non / désactivé --> F{Cache négatif<br/>contient le login ?}
    F -- Oui (TTL 5 min) --> G[UserNotFoundException]
    F -- Non --> H[_try_enroll: scan Pastell<br/>entites x utilisateurs vers login ?] --> I{Login trouvé dans Pastell ?}
    I -- Non --> J[Login ajouté au cache négatif 5 min] --> G
    I -- Oui --> K[_upsert_user: créer ligne locale<br/>clé Fernet générée / réactiver] --> E

    E --> L{Token valide en BDD ?}
    L -- Oui --> M[Utilisateur enrollé + auth prêt]

    L -- Non / absent / expiré --> N["PATCH /utilisateur/{id_u}<br/>via compte technique password=aléatoire<br/>sur 10 caractères"] --> O["POST /utilisateur/token<br/>Basic Auth login / mot de passe temporaire"] --> P{Création OK ?}
    P -- Oui --> Q["Token chiffré Fernet (pwd_key)<br/>stocké en BDD, sans expiration.<br/>Le mot de passe temporaire n'est pas conservé"] --> M
    P -- Non --> R["UserRegistrationException<br/>(réessaie à la connexion suivante)"]
```

## Synchronisation de fond

La synchro (démarrage + job périodique `settings.sync.interval_minutes`, + endpoint `POST /users/refresh` réservé à l'admin) remplit la table `pastell_users` à l'avance : pour chaque entité, liste des utilisateurs → upsert des lignes locales + désactivation des absents. L'enrollment lazy ne sert donc que de filet de sécurité pour les logins non encore synchronisés.

## Points clés

- **Token prioritaire** : `build_user_auth` utilise le Bearer token ; le login/mot de passe n'intervient plus que pour un éventuel utilisateur ajouté manuellement (jamais pour les utilisateurs enrollés).
- **Réinitialisation du mot de passe** : à la première connexion (aucun token configuré), le mot de passe Pastell est réinitialisé via le compte technique (`PATCH /v2/utilisateur/{id_u}`). Le mot de passe temporaire ne sert qu'à la création du token et **n'est pas stocké en base**.
- **Création du token par l'utilisateur** : le token est créé via l'endpoint self-service `POST /v2/utilisateur/token` en Basic Auth avec le login / mot de passe temporaire (la création par le compte admin `POST /utilisateur/{id_u}/token` ne fonctionne pas pour les utilisateurs qui ne sont pas de type `api`).
- **Cache négatif** : un login absent (ni en BDD, ni dans Pastell) n'est re-scanné que toutes les 5 minutes max (TTL), sinon le scan Pastell serait trop coûteux.
- **Clé Fernet** : le token est chiffré avec `pwd_key` du user (générée à l'enrôlement si absente).
- **Sanity check sync** : si une entité échoue pendant le scan, la synchro est abandonnée (pas de commit) pour ne pas désactiver à tort des utilisateurs d'entités non scannées.

