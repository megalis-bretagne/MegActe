from . import BaseService
from ..exceptions.custom_exceptions import PastellException


class ActeService(BaseService):

    def check_and_perform_action_service(
        self, entite_id: int, document_id: str, action: str
    ) -> dict:
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

        return self.api_pastell.perform_post(
            f"/entite/{entite_id}/document/{document_id}/action/{action}"
        )
