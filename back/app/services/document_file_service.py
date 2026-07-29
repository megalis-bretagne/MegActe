from . import BaseService
from ..exceptions.custom_exceptions import PastellException
from ..schemas.document_schemas import (
    DeleteFileFromDoc,
    AddFilesToDoc,
    AddFileToDoc,
)
from ..clients.pastell.exeptions import ApiPastellHttpForbidden, ApiPastellHttp40XError
from fastapi import HTTPException
from io import BytesIO
from fastapi.responses import StreamingResponse
import logging

logger = logging.getLogger(__name__)

# Cache mémoire : (entite_id, flux_type, element_id) → données externalData
_external_data_cache: dict[tuple, dict] = {}


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
        replace: bool = False,
    ):
        results = []
        for file in files_data.files:
            file_data = AddFileToDoc(entite_id=files_data.entite_id, file=file)
            result = self.add_file(document_id, element_id, file_data, replace=replace)
            results.append(result)
        return results

    def add_file(
        self,
        document_id: str,
        element_id: str,
        file_data: AddFileToDoc,
        replace: bool = False,
    ):
        existing_files = self.get_existing_files(file_data.entite_id, document_id, element_id)
        next_file_number = 0 if replace else len(existing_files)

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

    def get_external_data_by_flux_type(
        self,
        entite_id: int,
        flux_type: str,
        element_id: str,
    ) -> dict:
        """Retourne les options externalData pour un type de flux, sans avoir besoin d'un document_id.
        Les options sont identiques pour tous les documents d'un même flux, donc on met le résultat en cache.
        """
        cache_key = (entite_id, flux_type, element_id)
        if cache_key in _external_data_cache:
            logger.debug(f"Cache hit externalData ({entite_id}, {flux_type}, {element_id})")
            return _external_data_cache[cache_key]

        # Trouver n'importe quel doc du même type pour emprunter son ID
        docs = self.api_pastell.perform_get(
            f"entite/{entite_id}/document",
            query_params={"type": flux_type, "limit": 1},
        )
        borrowed = bool(docs)
        if docs:
            doc_id = docs[0]["id_d"]
        else:
            # Aucun doc existant : on en crée un vide temporaire
            response = self.api_pastell.perform_post(
                f"/entite/{entite_id}/document", data={"type": flux_type}
            )
            doc_id = response["info"]["id_d"]

        try:
            result = self.get_external_data(entite_id, doc_id, element_id, _allow_fallback=False)
        except (ApiPastellHttpForbidden, ApiPastellHttp40XError):
            # Le doc trouvé est inaccessible → créer un nouveau doc temporaire et réessayer
            logger.warning(f"externalData 403 sur doc {doc_id}, création d'un doc temporaire")
            response = self.api_pastell.perform_post(
                f"/entite/{entite_id}/document", data={"type": flux_type}
            )
            doc_id = response["info"]["id_d"]
            borrowed = False
            result = self.get_external_data(entite_id, doc_id, element_id, _allow_fallback=False)

        if borrowed and element_id == "type_piece" and isinstance(result, dict) and "pieces" in result:
            # `pieces` provient d'un document emprunté, sans rapport avec le document
            # qu'on est en train de créer : on ne renvoie pas ce champ ici pour éviter
            # que les appelants ne s'en servent comme s'il reflétait leurs propres fichiers.
            result = {**result, "pieces": []}

        _external_data_cache[cache_key] = result
        return result

    def get_external_data(
        self,
        entite_id: int,
        document_id: str,
        element_id: str,
        _allow_fallback: bool = True,
    ) -> dict:
        """Récupère les valeurs possibles pour un champ externalData dans Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément externalData.
            _allow_fallback: False quand appelé depuis get_external_data_by_flux_type pour éviter la récursion.
        Returns:
            dict: Les valeurs possibles pour l'élément externalData.
        """
        try:
            return self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}/externalData/{element_id}")
        except (ApiPastellHttpForbidden, ApiPastellHttp40XError):
            if not _allow_fallback:
                raise
            # Pastell refuse l'accès à ce document précis → on récupère son type
            # et on bascule sur la logique by_flux_type (qui crée un doc temporaire si nécessaire)
            logger.warning(f"externalData 403 sur doc {document_id}, tentative via flux_type")
            doc = self.api_pastell.perform_get(f"/entite/{entite_id}/document/{document_id}")
            flux_type = doc.get("info", {}).get("type")
            if not flux_type:
                raise
            return self.get_external_data_by_flux_type(entite_id, flux_type, element_id)

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
            detail = f"Le nombre de type_pj fourni «{len(file_types)}» ne correspond pas au nombre de documents «{len(existing_files)}»"
            raise HTTPException(
                status_code=400,
                detail=detail,
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
        file_index: int | None = None,
    ):
        """Récupère un fichier spécifique par son nom depuis Pastell.

        Args:
            entite_id (int): L'ID de l'entité.
            document_id (str): L'ID du document.
            element_id (str): L'ID de l'élément auquel le fichier est associé.
            file_name (str): Le nom du fichier à récupérer.
            file_index (int | None): Position déjà connue du fichier, pour éviter un fetch en plus.

        Returns:
            Response: La réponse de l'API Pastell contenant le fichier.
        """
        if file_index is None:
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
