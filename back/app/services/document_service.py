from ..schemas.flux_action import FluxAction
from ..services.flux_action_service import FluxActionService
from . import BaseService
from ..exceptions.custom_exceptions import EntiteIdException
from ..schemas.document_schemas import ActionDocument, ActionPossible, DocumentDetail, DocumentInfo
import logging
from app.dependencies import get_settings


logger = logging.getLogger(__name__)


class DocumentService(BaseService):
    """Service sur les documents

    Args:
        BaseService
    """

    def __init__(self, api=None, flux_action_service: FluxActionService = FluxActionService()):
        super().__init__(api)
        self.flux_action_service = flux_action_service

    def get_single_document(self, entite_id: int, document_id: str):
        """Récupère les infos d'un document dans Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document à récupérer.
            user (UserPastell): L'utilisateur pour lequel le document doit être récupéré.
            external_data_to_retrieve (list[str]) : liste des external Data a récupérer

        Returns:
            dict: Les détails du document récupéré.
        """
        external_data_to_retrieve = get_settings().document.external_data_to_retrieve
        if external_data_to_retrieve is None:
            external_data_to_retrieve = []

        document = self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}")

        for external_data in external_data_to_retrieve:
            if external_data in document["data"]:
                logger.debug(f"Récupération des informations de {external_data} pour le document {document_id}")
                info = self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}/file/{external_data}")
                document["data"][external_data] = info.json()

        document = DocumentDetail(**document)
        flux_action = self.flux_action_service.get_action_on_flux(document.info.type)

        for action in document.action_possible:
            if action.action in flux_action.actions:
                action.message = flux_action.actions[action.action].name_action

        return document

    def list_documents_paginate(self, id_e: int, doc_type=None, offset=0, limit=100, **kwargs) -> list[DocumentInfo]:
        """Retourne la liste des documents paginer

        Args:
            client_api (ApiPastell): Client Pastell
            id_e (int): l'id de l'entitite
            doc_type (str | None) : le type de flux
            offset (int, optional): Décalage à partir duquel récupérer les documents (par défaut est 0).
            limit (int, optional): Nombre maximum de documents à récupérer par page (par défaut est 100).
            **kwargs: Autres paramètres de requête facultatifs à passer à l'API.

        Returns:
            dict: Liste de DocumentInfo
        """

        if id_e is None or id_e < 0:
            raise EntiteIdException()

        query_param = {"offset": offset, "limit": limit}
        # Dictionnaire pour renommer les clés
        if doc_type:
            query_param["type"] = doc_type

        query_param.update(kwargs)
        documents = []

        list_documents = self.api_pastell.perform_get(f"entite/{id_e}/document", query_params=query_param)
        flux_action = None
        final_state = get_settings().document.final_state
        if doc_type is not None:
            flux_action = self.flux_action_service.get_action_on_flux(doc_type)

        for doc in list_documents:
            document_info = DocumentInfo(**doc)
            if (
                document_info.last_action not in final_state  # si l'état courant n'est pas un état finale
                and flux_action  # si le flux est non vide
                and not document_info.action_possible  # si les action possible du document ne sont pas renseigné
                and document_info.last_action
                in flux_action.actions  # si l'état courant est bien dans la liste des flux actions
            ):
                document_info.action_possible = self._get_action_possible(flux_action, document_info.last_action)
                document_info.last_action_message = flux_action.actions[document_info.last_action].name
            documents.append(document_info)

        return documents

    def _get_action_possible(self, flux_action: FluxAction, last_action: ActionDocument | str) -> list[ActionPossible]:
        """A partir d'un status de document (champ last_action, retourne les action possibles)

        Args:
            flux_action (str): les actions du flux
            last_action (str): la last_action du document
        """
        if flux_action is None:
            return []
        action_possible = []
        for action_name, action_details in flux_action.actions.items():
            if last_action in action_details.rule.last_action and action_details.name_action:
                action_possible.append(ActionPossible(action=action_name, message=action_details.name_action))
        return action_possible
