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

        # Les fichiers external_data et les actions du flux sont indépendants entre eux
        # (les actions ne dépendent que du type de flux, déjà connu à ce stade) : on les
        # récupère en parallèle plutôt que séquentiellement, pour ne payer qu'un seul
        # aller-retour Pastell au lieu de jusqu'à 3 (2 external_data + 1 flux_action)
        keys_to_fetch = [key for key in external_data_to_retrieve if key in document["data"]]

        with ThreadPoolExecutor(max_workers=len(keys_to_fetch) + 1) as executor:
            external_data_futures = {
                key: executor.submit(
                    self.api_pastell.perform_get,
                    f"/entite/{entite_id}/document/{document_id}/file/{key}",
                )
                for key in keys_to_fetch
            }
            flux_action_future = executor.submit(self.flux_action_service.get_action_on_flux, document["info"]["type"])

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
        # Cache des FluxAction déjà récupérés sur Pastell, par type de flux, pour éviter de
        # refaire un appel identique pour chaque document du même type. Alimenté au fil de la
        # boucle ci-dessous plutôt qu'une seule fois pour doc_type : en mode "tous les documents"
        # (doc_type=None), la liste mélange plusieurs types de flux, donc un seul appel global ne
        # suffit pas plus bas (cf. to_refresh)
        flux_action_cache: dict[str, FluxAction] = {}

        documents: list[DocumentInfo] = []
        # Documents pour lesquels Pastell n'a rien renvoyé comme action_possible sur cet
        # endpoint liste : notre estimation (state -> actions) peut être fausse (ex. un envoi
        # pas vraiment disponible), donc on ira chercher la vraie donnée via le détail du document
        to_refresh: list[str] = []

        for doc in list_documents:
            document_info = DocumentInfo(**doc)
            if document_info.type not in flux_action_cache:
                try:
                    flux_action_cache[document_info.type] = self.flux_action_service.get_action_on_flux(
                        document_info.type
                    )
                except (ApiError, ValidationError):
                    # Type de flux obsolète/supprimé côté Pastell (document ancien), ou réponse
                    # Pastell mal formée pour ce flux (ex. champ dont la forme varie selon les
                    # actions) : on continue sans enrichissement pour ce document plutôt que de
                    # faire échouer toute la liste
                    logger.warning(
                        "Impossible de récupérer les actions du flux '%s' (document %s), flux probablement obsolète ou réponse invalide",
                        document_info.type,
                        document_info.id_d,
                    )
                    flux_action_cache[document_info.type] = None
            flux_action = flux_action_cache[document_info.type]
            if (
                document_info.last_action not in final_state  # si l'état courant n'est pas un état finale
                and flux_action  # si le flux est non vide
                and not document_info.action_possible  # si les action possible du document ne sont pas renseigné
                and document_info.last_action
                in flux_action.actions  # si l'état courant est bien dans la liste des flux actions
            ):
                document_info.action_possible = self._get_action_possible(flux_action, document_info.last_action)
                document_info.last_action_message = flux_action.actions[document_info.last_action].name
            if not doc.get("action_possible") and document_info.last_action not in final_state:
                to_refresh.append(document_info.id_d)
            documents.append(document_info)

        if to_refresh:
            # flux_action_cache contient déjà tous les types de flux présents dans la liste
            # (rempli par la boucle ci-dessus), donc pas besoin de le regarnir ici
            by_id_d = {d.id_d: d for d in documents}

            with ThreadPoolExecutor(max_workers=8) as executor:
                futures = {
                    executor.submit(
                        self._get_real_action_possible,
                        id_e,
                        id_d,
                        flux_action_cache[by_id_d[id_d].type],
                    ): id_d
                    for id_d in to_refresh
                }
                for future in as_completed(futures):
                    id_d = futures[future]
                    try:
                        by_id_d[id_d].action_possible = future.result()
                    except Exception:
                        logger.warning(
                            "Impossible de récupérer les vraies actions possibles du document %s, "
                            "on garde l'estimation par défaut",
                            id_d,
                        )

        return documents

    def _get_real_action_possible(
        self, id_e: int, id_d: str, flux_action: FluxAction | None
    ) -> list[ActionPossible]:
        """Récupère les vraies actions possibles d'un document via son détail Pastell.

        L'endpoint liste ne fournit pas toujours action_possible de façon fiable
        (cf. DocumentInfo._complete_next_action, qui n'est qu'une estimation par état).

        flux_action est fourni par l'appelant (déjà récupéré/caché par type de flux)
        plutôt que refetché ici, pour éviter un appel Pastell redondant par document
        quand plusieurs documents à rafraîchir partagent le même type de flux.
        """
        raw = self.api_pastell.perform_get(f"/entite/{id_e}/document/{id_d}")
        detail = DocumentDetail(**raw)
        if flux_action:
            for action in detail.action_possible:
                if action.action in flux_action.actions:
                    action.message = flux_action.actions[action.action].name_action
        return detail.action_possible

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
