from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import validate_token
from .routers import users, health, flux, documents
from .exceptions.error_handlers import add_exception_handlers
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d : %(levelname)s : %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True,
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

add_exception_handlers(app)

app.include_router(users.router, dependencies=[Depends(validate_token)])
app.include_router(flux.router, dependencies=[Depends(validate_token)])
app.include_router(documents.router, dependencies=[Depends(validate_token)])


app.include_router(health.router)
