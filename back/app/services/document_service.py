from concurrent.futures import ThreadPoolExecutor, as_completed

from pydantic import ValidationError

from ..clients.pastell.exeptions import ApiError, ApiPastellHttpForbidden
from ..schemas.flux_action import FluxAction
from ..services.flux_action_service import FluxActionService
from . import BaseService
from ..exceptions.custom_exceptions import EntiteIdException, ErrorCode, MegActeException
from ..schemas.document_schemas import ActionDocument, ActionPossible, DocumentDetail, DocumentInfo
import logging
from app.dependencies import get_settings


logger = logging.getLogger(__name__)

# Pool de threads partagé pour les appels Pastell parallélisés de ce module
_EXECUTOR = ThreadPoolExecutor(max_workers=32)


class DocumentService(BaseService):
    """Service sur les documents

    Args:
        BaseService
    """

    def __init__(self, api=None, flux_action_service: FluxActionService = FluxActionService()):
        super().__init__(api)
        self.flux_action_service = flux_action_service

    def get_single_document(self, entite_id: int, document_id: str, type_flux: str | None = None):
        """Récupère les infos d'un document dans Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document à récupérer.
            user (UserPastell): L'utilisateur pour lequel le document doit être récupéré.
            external_data_to_retrieve (list[str]) : liste des external Data a récupérer
            type_flux (str | None) : type de flux déjà connu du front, pour lancer flux_action
                en parallèle du fetch du document (revérifié après coup, ignoré si erroné)

        Returns:
            dict: Les détails du document récupéré.
        """
        external_data_to_retrieve = get_settings().document.external_data_to_retrieve
        if external_data_to_retrieve is None:
            external_data_to_retrieve = []

        document_future = _EXECUTOR.submit(self.api_pastell.perform_get, f"/entite/{entite_id}/document/{document_id}")
        hinted_flux_action_future = (
            _EXECUTOR.submit(self.flux_action_service.get_action_on_flux, type_flux) if type_flux else None
        )

        document = document_future.result()

        # Les fichiers external_data et les actions du flux sont indépendants entre eux : on les
        # récupère en parallèle plutôt que séquentiellement, pour ne payer qu'un seul
        # aller-retour Pastell au lieu de jusqu'à 3 (2 external_data + 1 flux_action)
        keys_to_fetch = [key for key in external_data_to_retrieve if key in document["data"]]

        external_data_futures = {
            key: _EXECUTOR.submit(
                self.api_pastell.perform_get,
                f"/entite/{entite_id}/document/{document_id}/file/{key}",
            )
            for key in keys_to_fetch
        }
        # Indice front valide : on garde le fetch déjà en vol, sinon on relance avec le vrai type
        if type_flux == document["info"]["type"] and hinted_flux_action_future is not None:
            flux_action_future = hinted_flux_action_future
        else:
            flux_action_future = _EXECUTOR.submit(self.flux_action_service.get_action_on_flux, document["info"]["type"])

        for key, future in external_data_futures.items():
            logger.debug(f"Récupération des informations de {key} pour le document {document_id}")
            document["data"][key] = future.result().json()

        try:
            flux_action = flux_action_future.result()
        except (ApiError, ValidationError):
            # Type de flux obsolète/supprimé côté Pastell, ou réponse Pastell mal formée pour
            # ce flux : on continue sans enrichissement plutôt que de faire échouer le détail
            logger.warning(
                "Impossible de récupérer les actions du flux '%s' (document %s), flux probablement obsolète ou réponse invalide",
                document["info"]["type"],
                document_id,
            )
            flux_action = None

        document = DocumentDetail(**document)

        if flux_action:
            for action in document.action_possible:
                if action.action in flux_action.actions:
                    action.message = flux_action.actions[action.action].name_action

        return document

    def get_document_journal(self, entite_id: int, document_id: str) -> list:
        raw = self.api_pastell.perform_get(
            "journal",
            query_params={"id_e": entite_id, "id_d": document_id, "limit": 300},
        )
        entries = sorted(
            [e for e in raw if e.get("type") == "1"],
            key=lambda e: e.get("date", ""),
        )
        deduped = [e for i, e in enumerate(entries) if i == len(entries) - 1 or e["action"] != entries[i + 1]["action"]]
        return deduped[-13:]

    def create_document(self, id_e: int, flux: str):
        try:
            return self.api_pastell.perform_post(f"/entite/{id_e}/document", data={"type": flux})
        except ApiPastellHttpForbidden as e:
            raise MegActeException(
                e.status_code, detail="Can not create document", code=ErrorCode.MEGACTE_CREATE_DOCUMENT_NO_RIGHT
            )

    def list_documents_paginate(
        self,
        id_e: int,
        doc_type=None,
        offset=0,
        limit=100,
        search: str | None = None,
        **kwargs,
    ) -> list[DocumentInfo]:
        """Retourne la liste des documents paginer

        Args:
            client_api (ApiPastell): Client Pastell
            id_e (int): l'id de l'entitite
            doc_type (str | None) : le type de flux
            offset (int, optional): Décalage à partir duquel récupérer les documents (par défaut est 0).
            limit (int, optional): Nombre maximum de documents à récupérer par page (par défaut est 100).
            search (str | None) : filtre sur l'objet du document (paramètre Pastell "search")
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
        if search:
            query_param["search"] = search

        query_param.update(kwargs)

        list_documents = self.api_pastell.perform_get(f"entite/{id_e}/document", query_params=query_param)
        final_state = get_settings().document.final_state

        documents: list[DocumentInfo] = [DocumentInfo(**doc) for doc in list_documents]

        def _needs_enrichment(document_info: DocumentInfo) -> bool:
            return document_info.last_action not in final_state and not document_info.action_possible

        def _fetch_flux_action(type_flux: str) -> FluxAction | None:
            try:
                return self.flux_action_service.get_action_on_flux(type_flux)
            except (ApiError, ValidationError):
                # Flux obsolète ou réponse invalide : on continue sans enrichissement
                logger.warning(
                    "Impossible de récupérer les actions du flux '%s', flux probablement obsolète ou réponse invalide",
                    type_flux,
                )
                return None

        # Cache des FluxAction par type de flux, récupérés en parallèle. On ne le fait que pour
        # les types dont au moins un document a réellement besoin de l'enrichissement (état non
        # final) : inutile d'aller chercher /flux/{type}/action pour des documents déjà clos.
        unique_types = {d.type for d in documents if d.type and _needs_enrichment(d)}
        flux_action_cache: dict[str, FluxAction | None] = {}
        if unique_types:
            futures = {_EXECUTOR.submit(_fetch_flux_action, type_flux): type_flux for type_flux in unique_types}
            for future in as_completed(futures):
                flux_action_cache[futures[future]] = future.result()

        for document_info in documents:
            flux_action = flux_action_cache.get(document_info.type)
            if (
                document_info.last_action not in final_state  # si l'état courant n'est pas un état finale
                and flux_action  # si le flux est non vide
                and not document_info.action_possible  # si les action possible du document ne sont pas renseigné
                and document_info.last_action
                in flux_action.actions  # si l'état courant est bien dans la liste des flux actions
            ):
                document_info.action_possible = self._get_action_possible(flux_action, document_info.last_action)
                document_info.last_action_message = flux_action.actions[document_info.last_action].name

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
