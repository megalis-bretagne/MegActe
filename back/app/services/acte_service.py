from ..schemas.flux_action import ActionResult
from ..services.tdt_service import TdtService
from ..schemas.document_schemas import ActionDocument, DocumentDetail
from . import BaseService
from ..exceptions.custom_exceptions import PastellException
import logging

logger = logging.getLogger(__name__)


class ActeService(BaseService):

    def __init__(self, api=None):
        super().__init__(api)
        self.tdt_service = TdtService()

    def check_and_perform_action_service(
        self, entite_id: int, document_id: str, action: ActionDocument
    ) -> ActionResult:
        """Vérifie si une action est possible et l'exécute pour un document donné.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            action (str): L'action à vérifier et à exécuter.

        Raises:
            PastellException: Si l'action n'est pas possible ou ne peut pas être exécutée dans Pastell.

        Returns:
            dict: Les détails de l'action exécutée.
        """

        response = self.api_pastell.perform_get(
            f"/entite/{entite_id}/document/{document_id}"
        )

        actions = response.get("action_possible", [])
        if action not in actions:
            raise PastellException(
                status_code=400,
                detail=f"Action '{action}' not possible for document {document_id}",
            )

        if action == ActionDocument.teletransmission_tdt:
            logger.info(
                f"Génération de l'url pour teletransmission au TDT doc {document_id} entite {entite_id}"
            )
            document = DocumentDetail(**response)
            url = self.tdt_service.teletransmission(document, entite_id)
            logger.debug(f"Url généré : {url}")
            return ActionResult(
                result=True,
                message="",
                data={"url": url},
            )

        return self.api_pastell.perform_post(
            f"/entite/{entite_id}/document/{document_id}/action/{action}"
        )
