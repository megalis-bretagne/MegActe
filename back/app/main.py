import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import settings, validate_token
from .exceptions.error_handlers import add_exception_handlers
from .routers import connecteurs, documents, entite, flux, health, users
from .services.sync_service import run_sync_users_job

logger = logging.getLogger(__name__)


async def _periodic_sync() -> None:
    """Boucle de synchronisation périodique des utilisateurs Pastell."""
    interval = settings.sync.interval_minutes * 60
    while True:
        await asyncio.sleep(interval)
        await asyncio.to_thread(run_sync_users_job)


@asynccontextmanager
async def lifespan(app: FastAPI):
    sync_task = None
    if settings.sync.enabled:
        await asyncio.to_thread(run_sync_users_job)
        sync_task = asyncio.create_task(_periodic_sync())
        logger.info(
            f"Synchronisation périodique des utilisateurs activée (toutes les {settings.sync.interval_minutes} min)"
        )
    else:
        logger.info("Synchronisation des utilisateurs désactivée (settings.sync.enabled = False)")
    yield
    if sync_task:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)
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
app.include_router(entite.router, dependencies=[Depends(validate_token)])
app.include_router(connecteurs.router, dependencies=[Depends(validate_token)])
app.include_router(health.router)
