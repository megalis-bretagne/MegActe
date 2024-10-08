from . import BaseService
from ..exceptions.custom_exceptions import EntiteIdException, PastellException
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


class DocumentService(BaseService):
    """Service sur les documents

    Args:
        BaseService
    """

    def get_document_info_service(
        self,
        entite_id: int,
        document_id: str,
        external_data_to_retrieve: list[str] = [],
    ):
        """Récupère les infos d'un document dans Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document à récupérer.
            user (UserPastell): L'utilisateur pour lequel le document doit être récupéré.
            external_data_to_retrieve (list[str]) : liste des external Data a récupérer

        Returns:
            dict: Les détails du document récupéré.
        """
        document = self.api_pastell.perform_get(
            f"/entite/{entite_id}/document/{document_id}"
        )

        for external_data in external_data_to_retrieve:
            if external_data in document["data"]:
                logger.debug(
                    f"Récupération des informations de {external_data} pour le document {document_id}"
                )
                info = self.api_pastell.perform_get(
                    f"/entite/{entite_id}/document/{document_id}/file/{external_data}"
                )
                document["data"][external_data] = info.json()
        return document

    def add_multiple_files_to_document_service(
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
            result = self.add_file_to_document_service(
                document_id, element_id, file_data
            )
            results.append(result)

        return results

    def add_file_to_document_service(
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
        existing_files = self.get_existing_files(
            file_data.entite_id, document_id, element_id
        )
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

    def delete_file_from_document_service(
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
        response = self.api_pastell.perform_get(
            f"/entite/{entite_id}/document/{document_id}"
        )
        document_data = response.get("data", {})
        return document_data.get(element_id, [])

    def get_external_data_service(
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

        return self.api_pastell.perform_get(
            f"/entite/{entite_id}/document/{document_id}/externalData/{element_id}"
        )

    def assign_file_typologie_service(
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

        response = self.get_external_data_service(entite_id, document_id, element_id)

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

    def list_documents_paginate(
        self, id_e: int, type=None, offset=0, limit=100, **kwargs
    ) -> dict:
        """Retourne la liste des documents paginer

        Args:
            client_api (ApiPastell): Client Pastell
            id_e (int): l'id de l'entitite
            type (str | None) : le type de flux
            offset (int, optional): Décalage à partir duquel récupérer les documents (par défaut est 0).
            limit (int, optional): Nombre maximum de documents à récupérer par page (par défaut est 100).
            **kwargs: Autres paramètres de requête facultatifs à passer à l'API.

        Returns:
            dict: _description_
        """

        if id_e is None or id_e < 0:
            raise EntiteIdException()

        url = f"entite/{id_e}/document"
        query_param = {"offset": offset, "limit": limit}
        # Dictionnaire pour renommer les clés
        if type:
            query_param["type"] = type

        query_param.update(kwargs)

        response = self.api_pastell.perform_get(url, query_params=query_param)
        return response

    def get_file_by_name_service(
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
