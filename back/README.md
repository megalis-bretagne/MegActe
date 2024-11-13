# Backend de MegActe

## Pre-requis

* Installer Python3.11+
* Installer Pip

## Installation

Dans le dossier "back".
* Créer un venv
```
python3 -m venv .venv
```
* Activer le venv

```
source .venv/bin/activate
```

* installer les dépendances

```
pip install pip-tools
```


* Pour mettre à jour les dépendances épinglées
```
pip-compile --resolver=backtracking && pip-compile --resolver=backtracking requirements_dev.in
pip install -r requirements.txt -r requirements_dev.txt
```

## Configuration

* Dans le dossier config, dupliquer le fichier "config_template.yml" en "config.yml"
* Editer le fichier avec les bonnes valeurs

## Lancement des TU

Commande pour lancer les TU
```
python -m pytest
```

## Mise en place de la base de donnée

La base de données est versionné grâce à Alembic.

* Pour avoir la dernière version schéma
Dans le dossier back :
```
alembic upgrade head
```


## Lancement du back

Dans le dossier back :
``` 
fastapi run app/maing.py --port <PORT>
```

## Accès au swagger
Dans le navigateur :
```
http://HOST:PORT/docs 
```

