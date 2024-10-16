from unittest.mock import MagicMock
from app.services.flux_action_service import FluxActionService
from app.schemas.flux_action import FluxAction
from ..conftest import engine
from app.models.users import Base


def setUpModule():
    Base.metadata.create_all(bind=engine)


def tearDownModule():
    Base.metadata.drop_all(bind=engine)


class FluxActionServiceMock(FluxActionService):

    def __init__(self) -> None:
        self.api_pastell = MagicMock()

    def get_action_on_flux(self, type):
        actions = {
            "creation": {
                "name-action": "Créer",
                "name": "Créé",
                "rule": {"no-last-action": ""},
            }
        }
        return FluxAction(actions=actions)
