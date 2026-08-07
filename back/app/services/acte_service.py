from http import HTTPStatus
from ..schemas.flux_action import ActionResult
from ..services.tdt_service import TdtService
from ..services.document_service import _EXECUTOR
from ..schemas.document_schemas import ActionDocument, DocumentDetail
from . import BaseService
from ..exceptions.custom_exceptions import ErrorCode, MegActeException, PastellException
import logging
import time

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

        batch_start = time.monotonic()

        if action == ActionDocument.teletransmission_tdt:
            logger.info(
                f"Génération de l'url pour teletransmission au TDT des documents {documents_id} entite {entite_id}"
            )

            def _fetch_doc(doc_id):
                t0 = time.monotonic()
                logger.info(f"[batch] GET document {doc_id} : démarré (+{t0 - batch_start:.3f}s)")
                result = self.api_pastell.perform_get(f"/entite/{entite_id}/document/{doc_id}")
                logger.info(
                    f"[batch] GET document {doc_id} : terminé (+{time.monotonic() - batch_start:.3f}s, "
                    f"durée {time.monotonic() - t0:.3f}s)"
                )
                return result

            # Pastell n'a pas d'endpoint pour récupérer plusieurs documents d'un coup : on lance
            # un GET par document en parallèle plutôt qu'en boucle séquentielle.
            futures = [_EXECUTOR.submit(_fetch_doc, doc_id) for doc_id in documents_id]
            documents = [DocumentDetail(**future.result()) for future in futures]
            logger.info(f"[batch] {len(documents_id)} GET documents terminés en {time.monotonic() - batch_start:.3f}s au total")
            url = self.tdt_service.teletransmission_multi(documents, entite_id)
            logger.debug(f"Url généré : {url}")

            return ActionResult(
                result=True,
                message="",
                data={"url": url},
            )

        def _run_action(doc_id):
            t0 = time.monotonic()
            logger.info(f"[batch] Action {action} sur {doc_id} : démarrée (+{t0 - batch_start:.3f}s)")
            self.check_and_perform_action(entite_id, doc_id, action)
            logger.info(
                f"[batch] Action {action} sur {doc_id} : terminée (+{time.monotonic() - batch_start:.3f}s, "
                f"durée {time.monotonic() - t0:.3f}s)"
            )

        # Revérifie chaque document avant exécution (action_possible en liste n'est qu'une estimation).
        # Idem : pas d'endpoint Pastell pour agir sur plusieurs documents à la fois, donc un appel
        # par document, mais en parallèle. Contrairement à une boucle séquentielle qui s'arrêterait
        # net au premier échec (documents suivants jamais traités), tous les documents sont traités
        # ici avant que la première erreur rencontrée ne soit levée.
        futures = [_EXECUTOR.submit(_run_action, doc_id) for doc_id in documents_id]
        for future in futures:
            future.result()
        logger.info(f"[batch] {len(documents_id)} actions '{action}' terminées en {time.monotonic() - batch_start:.3f}s au total")

        return ActionResult(result=True, message="")
