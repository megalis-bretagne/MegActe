#!/usr/bin/env bash

usage() {
  echo "$0 [--dev]"
  exit 1
}

if [ $# -gt 1 ]; then
  echo "$0 takes 0 or 1 argument"
  usage
fi

mode=${1:---prod}

if [ $mode = "--dev" ]; then
  alembic upgrade head && fastapi run app/main.py --reload --port 8080
else
  fastapi run app/main.py --port 8080
fi
