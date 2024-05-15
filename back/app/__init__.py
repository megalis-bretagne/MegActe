from functools import wraps
from flask import request, g
from jwt import decode, exceptions
import json
import logging

import yaml
from .routers import users, health
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.middleware.cors import CORSMiddleware


def login_required(f):

    @wraps(f)
    def wrap(*args, **kwargs):
        authorization = request.headers.get("authorization", None)
        if not authorization:
            return (
                json.dumps({"error": "no authorization token provided"}),
                401,
                {"Content-type": "application/json"},
            )

        try:
            token = authorization.split(" ")[1]
            resp = decode(token, None, verify=False, algorithms=["HS256"])
            g.user = resp["name"]
            g.username = resp["preferred_username"]
            g.email = resp["email"]
            g.uid = resp["uid"]

        except exceptions.DecodeError:
            return (
                json.dumps({"error": "invalid authorization token"}),
                401,
                {"Content-type": "application/json"},
            )

        return f(*args, **kwargs)

    return wrap


def read_config(config_file):
    try:
        with open(config_file) as yamlfile:
            config_data = yaml.load(yamlfile, Loader=yaml.FullLoader)
    except Exception:
        config_data = {}
    # Load common settings
    return config_data



