from . import BaseService
from ..exceptions.custom_exceptions import PastellException
from ..schemas.document_schemas import (
    DeleteFileFromDoc,
    AddFilesToDoc,
    AddFileToDoc,
)
from fastapi import HTTPException
from io import BytesIO
from fastapi.responses import StreamingResponse
import logging

logger = logging.getLogger(__name__)


class DocumentFileService(BaseService):
    """Service sur la gestion des fichiers dans les documents

    Args:
        BaseService
    """

    def add_multiple_files(
        self,
        document_id: str,
        element_id: str,
        files_data: AddFilesToDoc,
    ):
        """Ajoute plusieurs fichiers à un document en appelant le service add_file_to_document_service.

        Args:
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément auquel les fichiers sont associés.
            files_data (AddFilesToDoc): Les informations nécessaires pour ajouter les fichiers.
            user (UserPastell): L'utilisateur pour lequel l'opération doit être effectuée.

        Returns:
            dict: Les détails de l'ajout des fichiers.
        """
        results = []

        for file in files_data.files:
            file_data = AddFileToDoc(entite_id=files_data.entite_id, file=file)
            result = self.add_file(document_id, element_id, file_data)
            results.append(result)

        return results

    def add_file(
        self,
        document_id: str,
        element_id: str,
        file_data: AddFileToDoc,
    ):
        """Ajoute un fichier à un document spécifique dans Pastell.

        Args:
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément auquel le fichier est associé.
            file_data (AddFileToDoc): Les informations nécessaires pour ajouter un fichier.
            user (UserPastell): L'utilisateur pour lequel l'opération doit être effectuée.

        Raises:
            PastellException: Si le fichier ne peut pas être ajouté à Pastell.

        Returns:
            dict: Les détails de l'ajout du fichier.
        """
        existing_files = self.get_existing_files(file_data.entite_id, document_id, element_id)
        next_file_number = len(existing_files)

        file_content = file_data.file.file.read()

        files = {
            "file_name": (None, file_data.file.filename),
            "file_content": (
                file_data.file.filename,
                file_content,
                file_data.file.content_type,
            ),
        }

        return self.api_pastell.perform_post(
            f"/entite/{file_data.entite_id}/document/{document_id}/file/{element_id}/{next_file_number}",
            files=files,
        )

    def delete_file(
        self,
        entite_id: int,
        document_id: str,
        element_id: str,
        file_data: DeleteFileFromDoc,
    ):
        """Supprime un fichier lié à un document spécifique dans Pastell.

        Args:
            entite_id (int) : L'id de l'entite
            document_id (str): L'ID du document auquel le fichier est associé.
            element_id (str): L'ID du champ auquel le fichier est associé.
            file_data (DeleteFileFromDoc): Les informations nécessaires pour supprimer un fichier.
        Raises:
            PastellException: Si le fichier ne peut pas être supprimé de Pastell.

        Returns:
            dict: Les détails de la suppression du fichier.
        """
        existing_files = self.get_existing_files(entite_id, document_id, element_id)

        try:
            file_index = existing_files.index(file_data.file_name)
        except ValueError:
            raise PastellException(
                status_code=404,
                detail="File not found",
            )

        return self.api_pastell.perform_delete(
            f"/entite/{entite_id}/document/{document_id}/file/{element_id}/{file_index}"
        )

    def get_external_data(
        self,
        entite_id: int,
        document_id: str,
        element_id: str,
    ) -> dict:
        """Récupère les valeurs possibles pour un champ externalData dans Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément externalData.
        Returns:
            dict: Les valeurs possibles pour l'élément externalData.
        """

        return self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}/externalData/{element_id}")

    def assign_file_typologie(
        self,
        entite_id: int,
        document_id: str,
        element_id: str,
        file_types: list[str],
    ):
        """Attribue des types à plusieurs fichiers uploadés dans Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément.
            file_types (List[str]): Les types à attribuer aux fichiers.

        Raises:
            PastellException: Si les fichiers ne peuvent pas être trouvés ou si l'attribution échoue.

        Returns:
            dict: Les détails de l'opération d'attribution de type.
        """

        response = self.get_external_data(entite_id, document_id, element_id)

        existing_files = response["pieces"]

        # Vérifier que le nombre de types de fichiers correspond au nombre de fichiers existants
        if len(file_types) != len(existing_files):
            raise HTTPException(
                status_code=400,
                detail=f"Le nombre de type_pj fourni «{len(file_types)}» ne correspond pas au nombre de documents (acte et annexes) «{len(existing_files)}»",
            )

        data = {f"type_pj[{i}]": file_type for i, file_type in enumerate(file_types)}

        return self.api_pastell.perform_patch(
            f"/entite/{entite_id}/document/{document_id}/externalData/{element_id}",
            data=data,
        )

    def get_existing_files(
        self,
        entite_id: int,
        document_id: str,
        element_id: str,
    ) -> list:
        """Récupère la liste des fichiers existants pour un document et un élément donnés.

        Args:
            entite_id (int): id de l'entité
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément.
            client_api (ApiPastell): client api
        Returns:
            list: Une liste des fichiers existants.
        """
        response = self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}")
        document_data = response.get("data", {})
        return document_data.get(element_id, [])

    def get_file_by_name(
        self,
        entite_id: int,
        document_id: str,
        element_id: str,
        file_name: str,
    ):
        """Récupère un fichier spécifique par son nom depuis Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément auquel le fichier est associé.
            file_name (str): Le nom du fichier à récupérer.

        Returns:
            Response: La réponse de l'API Pastell contenant le fichier.
        """
        existing_files = self.get_existing_files(entite_id, document_id, element_id)

        try:
            file_index = existing_files.index(file_name)
        except ValueError:
            raise HTTPException(status_code=404, detail="File not found")

        response = self.api_pastell.perform_get(
            f"/entite/{entite_id}/document/{document_id}/file/{element_id}/{file_index}"
        )

        if response is None or response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error retrieving file")

        file_content = BytesIO(response.content)

        return StreamingResponse(
            file_content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={file_name}"},
        )
