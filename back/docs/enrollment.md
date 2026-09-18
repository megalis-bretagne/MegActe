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

    L -- Non / absent / expiré --> N["POST /utilisateur/{id_u}/token<br/>via client admin nom=megacte_login"] --> O{Création OK ?}
    O -- Oui --> P["Token chiffré Fernet (pwd_key)<br/>stocké en BDD, sans expiration"] --> M
    O -- Non --> Q{pwd_pastell existe ?}
    Q -- Oui --> R[Fallback: auth Basic login/mdp] --> M
    Q -- Non --> S[UserRegistrationException]

    M --> T[build_user_auth: Bearer token préféré,<br/>sinon Basic login/mdp]
```

## Synchronisation de fond

La synchro (démarrage + job périodique `settings.sync.interval_minutes`, + endpoint `POST /users/refresh` réservé à l'admin) remplit la table `pastell_users` à l'avance : pour chaque entité, liste des utilisateurs → upsert des lignes locales + désactivation des absents. L'enrollment lazy ne sert donc que de filet de sécurité pour les logins non encore synchronisés.

## Points clés

- **Token prioritaire** : `build_user_auth` privilégie le Bearer token ; le login/mot de passe n'est qu'un fallback (si la création de token échoue et qu'un mot de passe existe).
- **Cache négatif** : un login absent (ni en BDD, ni dans Pastell) n'est re-scanné que toutes les 5 minutes max (TTL), sinon le scan Pastell serait trop coûteux.
- **Clé Fernet** : le token est chiffré avec `pwd_key` du user (générée à l'enrôlement si absente) ; `pwd_key` sert aussi au mot de passe.
- **Sanity check sync** : si une entité échoue pendant le scan, la synchro est abandonnée (pas de commit) pour ne pas désactiver à tort des utilisateurs d'entités non scannées.

