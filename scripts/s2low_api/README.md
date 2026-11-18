# Client Python S2low ACTES

## Installation

Depuis ce répertoire :

```bash
uv sync
```

Le client utilise un certificat client TLS PEM. `S2LOW_CERT_PATH` peut pointer vers un PEM contenant le certificat et la clé privée. Si la clé est dans un fichier séparé, utiliser `S2LOW_KEY_PATH`.
Il faut que la clé soit déchiffrée. Si le PEM de la clé privée contient une clé chiffrée, la déchiffrer pour un créer un PEM avec une clé déchiffrée.

```bash
export S2LOW_BASE_URL="https://s2low.example.fr"
export S2LOW_CERT_PATH="/chemin/client-cert-et-cle.pem"
```

Pour une authentification par certificat seul, aucune variable `S2LOW_LOGIN` ou
`S2LOW_PASSWORD` n'est nécessaire. Le certificat doit identifier un compte S2low
unique et ce compte doit disposer des droits requis.

Pour activer l'authentification complémentaire par login / mot de passe :

```bash
export S2LOW_LOGIN="mon-login"
export S2LOW_PASSWORD="mon-mot-de-passe"
```

Pour une clé séparée :

```bash
export S2LOW_CERT_PATH="/chemin/client.crt.pem"
export S2LOW_KEY_PATH="/chemin/client.key.pem"
```

`S2LOW_CA_BUNDLE` permet d'utiliser un bundle CA spécifique (chaine de certificats permettant de vérifier le certificat serveur).
Si `S2LOW_CA_BUNDLE` n'est pas défini, `S2LOW_VERIFY` doit être défini à false.
`S2LOW_VERIFY=false` doit être utilisé avec précaution, uniquement avec des serveurs de confiance.

`S2LOW_TIMEOUT` vaut 30 secondes par défaut.

Le bundle doit contenir les certificats des autorités qui signent le certificat du
serveur S2low, et non le certificat client utilisé pour vous authentifier.

## Utilisation

```bash
uv run s2low-actes status
uv run s2low-actes count 4
uv run s2low-actes list 4 --offset 0 --limit 100
uv run s2low-actes transaction-status 12345
uv run s2low-actes transaction-files 12345
uv run s2low-actes create \
  --nature-code 1 \
  --number DELIB-2026-01 \
  --decision-date 2026-09-28 \
  --file ./deliberation.pdf \
  --subject "Objet de la délibération" \
  --en-attente
```

## Administration

Les appels d'administration nécessitent un compte administrateur S2low :

Ils n'utilisent pas `/api/get-nounce.php`. Le certificat TLS est présenté directement
et, si le certificat est partagé entre plusieurs comptes, `S2LOW_LOGIN` et
`S2LOW_PASSWORD` sont envoyés en HTTP Basic pour sélectionner le compte.

```bash
uv run s2low-actes admin-groups
uv run s2low-actes admin-authority-types
uv run s2low-actes admin-authorities
uv run s2low-actes admin-authorities --name "Rennes" --type 1 --group 3 --siren 123456789
uv run s2low-actes admin-modules
uv run s2low-actes admin-authority-detail 12
uv run s2low-actes admin-authority-sirens --group-id 3
uv run s2low-actes admin-authority-sirets --authority-id 12
uv run s2low-actes admin-user-roles
uv run s2low-actes admin-users
uv run s2low-actes admin-users --name "Dupont" --role USER --group 3 --authority 12
uv run s2low-actes admin-user-detail 42
uv run s2low-actes admin-user-logins
```

Les méthodes Python `edit_authority()` et `edit_user()` exposent les POST d'édition. La première envoie uniquement les champs obligatoires de collectivité. La seconde envoie les champs obligatoires d'utilisateur et accepte en plus `login`, `password` et `authority_group_id`. `authority_group_id` est obligatoire pour le rôle `GADM`. Lors d'une création d'utilisateur, `certificate_path` est nécessaire côté S2low pour fournir le certificat de l'utilisateur.

Si `S2LOW_LOGIN` et `S2LOW_PASSWORD` sont définis, le client appelle automatiquement
`/api/get-nounce.php` en HTTP Basic, calcule `sha256(password:nounce)`, puis ajoute
`login`, `nounce` et `hash` aux appels API. Sinon, les appels utilisent uniquement le
certificat client TLS.
