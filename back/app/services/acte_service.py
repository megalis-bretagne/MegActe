from http import HTTPStatus
from ..schemas.flux_action import ActionResult
from ..services.tdt_service import TdtService
from ..services.document_service import _EXECUTOR
from ..schemas.document_schemas import ActionDocument, DocumentDetail
from . import BaseService
from ..exceptions.custom_exceptions import ErrorCode, MegActeException, PastellException
import logging

logger = logging.getLogger(__name__)


class ActeService(BaseService):
    """Service pour les Acte

    Args:
        BaseService (_type_): _description_
    """

    def __init__(self, api=None):
        super().__init__(api)
        self.tdt_service = TdtService()

    def check_and_perform_action(self, entite_id: int, document_id: str, action: ActionDocument) -> ActionResult:
        """Vérifie si une action est possible et l'exécute pour un document donné.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            action (str): L'action à vérifier et à exécuter.

        Raises:
            PastellException: Si l'action n'est pas possible ou ne peut pas être exécutée dans Pastell.

        Returns:
            ActionResult: Les détails de l'action exécutée.
        """

        response = self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}")

        actions = response.get("action_possible", [])
        if action not in actions:
            # 409 (et non 403) : le frontend traite tout 403 comme un token expiré et
            # retente automatiquement avec un refresh, ce qui masque ce message métier.
            raise MegActeException(
                status_code=HTTPStatus.CONFLICT,
                code=ErrorCode.PASTELL_NO_RIGHT,
                detail=f"Action '{action}' impossible pour le document {document_id}",
            )

        if action == ActionDocument.teletransmission_tdt:
            logger.info(f"Génération de l'url pour teletransmission  au TDT doc {document_id} entite {entite_id}")
            document = DocumentDetail(**response)
            url = self.tdt_service.teletransmission(document, entite_id)
            logger.debug(f"Url généré : {url}")
            return ActionResult(
                result=True,
                message="",
                data={"url": url},
            )
        response = self.api_pastell.perform_post(f"/entite/{entite_id}/document/{document_id}/action/{action}")
        action_result = ActionResult(**response)

        if not action_result.result:
            raise MegActeException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=action_result.message or "Action impossible",
                code=ErrorCode.PASTELL_ERROR,
            )

        return action_result

    def perform_action_on_documents(
        self, entite_id: int, documents_id: list[str], action: ActionDocument
    ) -> ActionResult:
        """Lance une action multiple pour plusieurs documents

        Args:
            entite_id (int): L'ID de l'entité.
            documents_id (list[str]): L'ID du document.
            action (ActionDocument): L'action  à exécuter.

        Returns:
            ActionResult: Les détails de l'action exécutée.
        """

        if action == ActionDocument.teletransmission_tdt:
            logger.info(
                f"Génération de l'url pour teletransmission au TDT des documents {documents_id} entite {entite_id}"
            )

            def _fetch_doc(doc_id):
                return self.api_pastell.perform_get(f"/entite/{entite_id}/document/{doc_id}")

            # Pastell n'a pas d'endpoint pour récupérer plusieurs documents d'un coup : on lance
            # un GET par document en parallèle plutôt qu'en boucle séquentielle.
            futures = [_EXECUTOR.submit(_fetch_doc, doc_id) for doc_id in documents_id]
            documents = [DocumentDetail(**future.result()) for future in futures]
            url = self.tdt_service.teletransmission_multi(documents, entite_id)
            logger.debug(f"Url généré : {url}")

            return ActionResult(
                result=True,
                message="",
                data={"url": url},
            )

        def _run_action(doc_id):
            self.check_and_perform_action(entite_id, doc_id, action)

        # Revérifie chaque document avant exécution (action_possible en liste n'est qu'une estimation).
        # Idem : pas d'endpoint Pastell pour agir sur plusieurs documents à la fois, donc un appel
        # par document, mais en parallèle. Contrairement à une boucle séquentielle qui s'arrêterait
        # net au premier échec (documents suivants jamais traités), tous les documents sont traités
        # ici avant que la première erreur rencontrée ne soit levée.
        futures = [_EXECUTOR.submit(_run_action, doc_id) for doc_id in documents_id]
        for future in futures:
            future.result()

        return ActionResult(result=True, message="")
