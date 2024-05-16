from fastapi import FastAPI, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.middleware.cors import CORSMiddleware
from . import read_config
from .routers import users, health


config = read_config("config/config.yml")
oauth_2_scheme = OAuth2AuthorizationCodeBearer(
    tokenUrl=config["KEYCLOAK"]["token_url"],
    authorizationUrl=config["KEYCLOAK"]["auth_url"],
    refreshUrl=config["KEYCLOAK"]["refresh_url"]
)

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,   
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, dependencies=[Depends(oauth_2_scheme)])
app.include_router(health.router)
