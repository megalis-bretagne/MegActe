from ..schemas.flux_action import FluxAction
from . import get_or_make_api_pastell_for_admin
from . import BaseService


class FluxActionService(BaseService):
    """
    Service permettant de récupérer les actions possibles sur les flux
    Besoin de l'api en mode admin

    Args:
        BaseService (_type_):
    """

    def __init__(self) -> None:
        self.api_pastell = get_or_make_api_pastell_for_admin()

    def get_action_on_flux(self, type: str) -> FluxAction:
        """Recupère les actions possibles sur un flux

        Args:
            type (str): le type de flux

        Returns:
            _type_: _description_
        """
        actions = self.api_pastell.perform_get(f"flux/{type}/action")
        return FluxAction(actions=actions)
