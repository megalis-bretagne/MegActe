from ..clients.pastell.api.entite_api import EntiteApi
from ..clients.pastell.api import ApiPastell


class BaseService:
    """
    Service megActe
    """

    api_pastell: ApiPastell | EntiteApi

    def __init__(self, api: ApiPastell = None) -> None:
        self.api_pastell = api
