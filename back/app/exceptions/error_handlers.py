from fastapi import HTTPException, Request, FastAPI
from fastapi.responses import JSONResponse
import logging
from ..clients.pastell.exeptions import ApiHttp40XError

from .custom_exceptions import MegActeException


def add_exception_handlers(app: FastAPI):

    @app.exception_handler(ApiHttp40XError)
    async def api_pastell_exception(request: Request, exc: ApiHttp40XError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.errors},
        )

    @app.exception_handler(MegActeException)
    async def megacte_exception_handler(request: Request, exc: MegActeException):
        logging.error(exc)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
