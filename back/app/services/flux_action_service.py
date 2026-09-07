from ..schemas.flux_action import FluxAction
from . import BaseService, get_or_make_api_pastell_for_admin


class FluxActionService(BaseService):
    """
    Service permettant de récupérer les actions possibles sur les flux
    Besoin de l'api en mode admin

    Args:
        BaseService (_type_):
    """

    def __init__(self) -> None:
        self.api_pastell = get_or_make_api_pastell_for_admin()
        # Les actions possibles d'un type de flux. On les met en cache en mémoire pour
        # éviter de refaire l'appel Pastell à chaque page de la liste de documents.
        self._cache: dict[str, FluxAction] = {}

    def get_action_on_flux(self, type_flux: str) -> FluxAction:
        """Recupère les actions possibles sur un flux

        Args:
            type (str): le type de flux

        Returns:
            _type_: _description_
        """
        if type_flux not in self._cache:
            actions = self.api_pastell.perform_get(f"flux/{type_flux}/action")
            self._cache[type_flux] = FluxAction(actions=actions)
        return self._cache[type_flux]
