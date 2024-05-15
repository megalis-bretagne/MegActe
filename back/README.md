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
pip install -r requirements.txt
```

## Configuration

* Dans le dossier config, dupliquer le fichier "config_template.yml" en "config.yml"
* Editer le fichier avec les bonnes valeurs

## Lancement du back

Dans le dossier back.
``` 
uvicorn app.main:app --host <HOST> --port <PORT> --reload
```

## Accès au swagger :
Dans le navigateur : 
```
http://HOST:PORT/docs 
```

