from fastapi import FastAPI, Request

from ..clients.pastell.exeptions import (
    ApiPastellHttp40XError,
    ApiPastellHttp50XError,
    ApiPastellHttpForbidden,
    ApiPastellHttpNotAuthorized,
)
from .custom_exceptions import ErrorCode, MegacteErrorResponse, MegActeException


def add_exception_handlers(app: FastAPI):

    @app.exception_handler(ApiPastellHttp40XError)
    async def api_pastell_exception(request: Request, exc: ApiPastellHttp40XError):
        return MegacteErrorResponse(exc.errors, ErrorCode.PASTELL_ERROR, exc.status_code)

    @app.exception_handler(ApiPastellHttpForbidden)
    @app.exception_handler(ApiPastellHttpNotAuthorized)
    async def api_pastell_exception_(request: Request, exc: ApiPastellHttpForbidden | ApiPastellHttpNotAuthorized):
        return MegacteErrorResponse(exc.errors, ErrorCode.PASTELL_NO_RIGHT, exc.status_code)

    @app.exception_handler(ApiPastellHttp50XError)
    async def api_pastell_exception__(request: Request, exc: ApiPastellHttp50XError):
        return MegacteErrorResponse(exc.errors, ErrorCode.PASTELL_UNAVAILABLE, exc.status_code)

    @app.exception_handler(MegActeException)
    async def megacte_exception_handler(request: Request, exc: MegActeException):
        return MegacteErrorResponse(exc.detail, exc.code, exc.status_code)
