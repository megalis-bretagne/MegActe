from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import validate_token
from .routers import users, health


app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users.router, dependencies=[Depends(validate_token)])
app.include_router(health.router)
