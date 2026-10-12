# README.md

Megacte est un outil permettant de faciliter la visualisation et la publication d'actes via les API Pastell.

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

## Keycloak

a client "megacte-sync" of type client-grant credentials must be created. client-id and client-secret must be written in configuration file.
It will automatically create a user "service-account-megacte-sync".

Then the client (I did it with the client) or the user must have the role "megacte-admin".
And in order to have the correct "aud"" in the access token (the "aud" is checked in the code, it must be either "megacte" or "megacte-admin"), a mapper of type "Audience mapper" must be created. Otherwise by defaut the "aud" is set to "account" and the "azp" to "megacte-sync". This is also accepted by the back but it is preferable to have the correct aud thanks to this "Audience mapper".

## Docker compose

docker compose -f ./docker-compose.nuxt.yml up --build --no-deps frontend
