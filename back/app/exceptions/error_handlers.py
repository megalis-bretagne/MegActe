from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from .custom_exceptions import (
    PastellException,
    DecryptionException,
    UserNotFoundException,
    UserRegistrationException,
    UserPasswordNullException,
)


def add_exception_handlers(app: FastAPI):
    @app.exception_handler(PastellException)
    async def pastell_exception_handler(request: Request, exc: PastellException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(DecryptionException)
    async def decryption_exception_handler(request: Request, exc: DecryptionException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(UserNotFoundException)
    async def user_not_found_exception_handler(
        request: Request, exc: UserNotFoundException
    ):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(UserRegistrationException)
    async def user_registration_exception_handler(
        request: Request, exc: UserRegistrationException
    ):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(UserPasswordNullException)
    async def user_password_null_exception_handler(
        request: Request, exc: UserPasswordNullException
    ):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
