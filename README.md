# README.md

MegActes est un outil permettant de faciliter la visualisation et la publication d'actes via les API Pastell.

## Préambule

**Pour les utilisateurs Linux** si vous utilisez une clé physique chambersign pour vos certificats individuels RGS**, nous vous recommandons d'utiliser une distribution compatible debian (debian, ubuntu, mint..). Chambersign fournit son pilote sous forme d'un .deb uniquement.

La procédure d'installation Chambersign a été testée avec un ubuntu 24.04 et un firefox 157.0.1

## Installation des pilotes Chambersign

Quand un acte est envoyé au contrôle de légalité via le tdt S2low, le certificat de l'utilisateur est demandé. Si le certificat réside sur une clé physique, les pilotes doivent être installés.
Les pilotes doivent être récupérés depuis le site de chambersign: <https://support.chambersign.fr/pilotes/>

### Installation sur linux

Une fois le pilote récupéré avec le lien ci-dessus, on procède à l'installation:

```
$ sudo apt-get update
$ sudo apt-get install pcscd libccid
$ sudo dpkg -i <path vers le fichier .deb téléchargé>
e.g.
$ dpkg -i ~/Téléchargements/6.23.44.0-scmiddleware-user_idopte_6.23.44.0_ubun22_amd64.deb
```

### Paramétrage du certificat dans Firefox

Le certificat s'il réside sur un support physique, ne sera pas reconnu par Firefox sans une petite configuration détaillée ici:
<https://support.chambersign.fr/wp-content/uploads/2026/08/GUI.HOT_.11.00-Parametrer-le-certificat-pour-Mozilla-Firefox.pdf>

**Pour les utilisateurs Linux** une fois dans Paramètres -> Vie privée et sécurité -> Certificats -> Gérer les périphériques de sécurité -> Charger

Le fichier à récupérer est /usr/lib/SCMiddleware/libidop11.so

**Pour les utisateurs Linux** si le firefox a été installé via un snap, cela ne fonctionnera pas. Le snap est un environnement conteneurisé autosuffisant, et donc sans possibilité d'accès au système de fichier du host.
Le cas échéant il faudra donc désinstaller le firefox snap et installer firefox via un repo apt.

Vous pouvez suivre les instructions ici <https://support.mozilla.org/en-US/kb/install-firefox-linux#w_install-firefox-deb-package-for-debian-based-and-ubuntu-based-distributions-recommended> pour désinstaller le firefox snap et installer le firefox depuis le repo apt de Mozilla.

Il est recommandé de configurer le fichier /etc/apt/preferences.d/mozilla comme ceci pour donner priorité au package mozilla:

```
Package: *
Pin: origin packages.mozilla.org
Pin-Priority: 1000

Package: firefox
Pin: release o=Ubuntu
Pin-Priority: -1
```

## Configuration Keycloak

### Audiences autorisées

Un claim *audience* est présent par défaut dans l'access token d'un utilisateur. L'audience véhicule les clients oidc autorisés à utiliser le service. Pour MegActes, il faut que le claim *audience* contienne les valeurs *megacte* ou *megacte-sync*. Sinon le token sera refusé par le backend.

### Siren

Le siren (ou le siret) doit être présent dans l'access token de l'utilisateur. Sans le siren, MegActes est en incapacité de récupérer l'entité s2low de l'utilisateur.

### Synchronisation et ajout d'utilisateurs

Un endpoint de synchronisation (*POST /user/refresh*) a été créé pour pouvoir déclencher une mise à jour de la base utilisateurs Pastell dans MegActes.
De même un endpoint spécifique (*POST /user*) permet l'ajout d'utilisateurs à MegActes.
Pour ces 2 endpoints un rôle *megacte-admin* est nécessaire.

Un client oidc *megacte_sync* de type *client-grant credentials* doit ainsi être créé et être utilisé pour réaliser ces opérations de synchronisation qui nécessitent ce rôle admin. La création de ce client dans keycloak va créer automatiquement un utilisateur *service-account-megacte-sync*. Ensuite on peut configurer le rôle *megacte-admin* au niveau du client oidc ou de l'utilisateur *service-account*.

## Démarrage en local

Le service peut être démarré en local grâce à un docker compose.

## Docker compose

```bash
docker compose up --build
```

Si vos images docker sont déjà buildées, un ```docker compose up``` suffit

```bash
docker compose up -f docker-compose.bind.yml up
```

## Build des images docker

Si le build est fait en dehors des docker compose.

### Build du front Linux

```bash
docker build \
  -f nuxt-web-app/Dockerfile \
  -t megacte-frontend:0.3.0 \
  .
```
