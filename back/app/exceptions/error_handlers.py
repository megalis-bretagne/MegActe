from fastapi import Request, FastAPI
from ..clients.pastell.exeptions import ApiHttp40XError, ApiHttp50XError, ApiHttpForbidden

from .custom_exceptions import MegActeException, ErrorCode, MegacteErrorResponse


def add_exception_handlers(app: FastAPI):

    @app.exception_handler(ApiHttp40XError)
    async def api_pastell_exception(request: Request, exc: ApiHttp40XError):
        return MegacteErrorResponse(exc.errors, ErrorCode.PASTELL_ERROR, exc.status_code)

    @app.exception_handler(ApiHttpForbidden)
    async def api_pastell_exception(request: Request, exc: ApiHttpForbidden):
        return MegacteErrorResponse(exc.errors, ErrorCode.NO_RIGHT, exc.status_code)

    @app.exception_handler(ApiHttp50XError)
    async def api_pastell_exception(request: Request, exc: ApiHttp50XError):
        return MegacteErrorResponse(exc.errors, ErrorCode.PASTELL_UNAVAILABLE, exc.status_code)

    @app.exception_handler(MegActeException)
    async def megacte_exception_handler(request: Request, exc: MegActeException):
        return MegacteErrorResponse(exc.detail, exc.code, exc.status_code)
