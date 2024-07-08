from ..clients.pastell.api import ApiPastell

from ..exceptions.custom_exceptions import PastellException
from ..models.users import UserPastell
from ..schemas.document_schemas import (
    DocUpdateInfo,
    DocCreateInfo,
    DeleteFileFromDoc,
    AddFilesToDoc,
    AddFileToDoc,
)


def create_empty_document(entite_id: int, flux_type: str, client_api: ApiPastell):
    """Crée un document vide dans Pastell pour un type de flux.

    Args:
        doc (DocCreateEmpty):Les informations nécessaires pour créer le document.
        client_api (ApiPastell): client api.

    Returns:
        dict: Les détails du document créé.
    """
    return client_api.perform_post(
        f"/entite/{entite_id}/document", data={"type": flux_type}
    )


def update_document_service(
    document_id: int,
    document_data: DocUpdateInfo,
    client_api: ApiPastell,
):
    """Met à jour un document dans Pastell avec les données fournies.

    Args:
        document_id (int): L'ID du document à mettre à jour.
        document_data (DocUpdateInfo): Les données à mettre à jour dans le document.
        client_api (ApiPastell): client api

    Raises:
        PastellException: Si le document ne peut pas être mis à jour dans Pastell.

    Returns:
        dict: Les détails du document mis à jour.
    """
    return client_api.perform_patch(
        f"/entite/{document_data.entite_id}/document/{document_id}",
        data=document_data.doc_info,
    )


def create_document_service(
    doc_data: DocCreateInfo,
    client_api: ApiPastell,
):
    """Crée un document vide et le met à jour avec les infos fournies.

    Args:
        doc_create (DocCreateInfo): Les informations nécessaires pour créer le document.
        client_api (ApiPastell): client api

    Returns:
        dict: Les détails du document créé et mis à jour.
    """
    # Création du doc vide
    created_document = create_empty_document(
        doc_data.entite_id, doc_data.flux_type, client_api
    )

    document_id = created_document.get("id_d")

    doc_update_info = DocUpdateInfo(
        entite_id=doc_data.entite_id, doc_info=doc_data.doc_info
    )

    # Mettre à jour le doc vc les infos fournies
    return update_document_service(document_id, doc_update_info, client_api)


def get_document_info_service(
    entite_id: int,
    document_id: str,
    client_api: ApiPastell,
):
    """Récupère les infos d'un document dans Pastell.

    Args:
        entite_id (int): L'ID de l'entité.
        document_id (str): L'ID du document à récupérer.
        user (UserPastell): L'utilisateur pour lequel le document doit être récupéré.
        client_api (ApiPastell): client api

    Returns:
        dict: Les détails du document récupéré.
    """
    return client_api.perform_get(f"/entite/{entite_id}/document/{document_id}")


def add_multiple_files_to_document_service(
    document_id: str,
    element_id: str,
    files_data: AddFilesToDoc,
    client_api: ApiPastell,
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
        result = add_file_to_document_service(
            document_id, element_id, file_data, client_api
        )
        results.append(result)

    return results


def add_file_to_document_service(
    document_id: str,
    element_id: str,
    file_data: AddFileToDoc,
    client_api: ApiPastell,
):
    """Ajoute un fichier à un document spécifique dans Pastell.

    Args:
        document_id (str): L'ID du document.
        element_id (str): L'ID de l'élément auquel le fichier est associé.
        file_data (AddFileToDoc): Les informations nécessaires pour ajouter un fichier.
        user (UserPastell): L'utilisateur pour lequel l'opération doit être effectuée.
        client_api (ApiPastell): client api

    Raises:
        PastellException: Si le fichier ne peut pas être ajouté à Pastell.

    Returns:
        dict: Les détails de l'ajout du fichier.
    """
    existing_files = get_existing_files(
        file_data.entite_id, document_id, element_id, client_api
    )
    next_file_number = len(existing_files)

    file_content = file_data.file.file.read()

    files = {
        "file_name": (None, file_data.file.filename),
        "file": (file_data.file.filename, file_content, file_data.file.content_type),
    }

    return client_api.perform_post(
        f"/entite/{file_data.entite_id}/document/{document_id}/file/{element_id}/{next_file_number}",
        files=files,
    )


def delete_file_from_document_service(
    document_id: str,
    element_id: str,
    file_data: DeleteFileFromDoc,
    client_api: ApiPastell,
):
    """Supprime un fichier lié à un document spécifique dans Pastell.

    Args:
        document_id (str): L'ID du document auquel le fichier est associé.
        element_id (str): L'ID du champ auquel le fichier est associé.
        file_data (DeleteFileFromDoc): Les informations nécessaires pour supprimer un fichier.
        client_api (ApiPastell): client api
    Raises:
        PastellException: Si le fichier ne peut pas être supprimé de Pastell.

    Returns:
        dict: Les détails de la suppression du fichier.
    """
    existing_files = get_existing_files(
        file_data.entite_id, document_id, element_id, client_api
    )

    try:
        file_index = existing_files.index(file_data.file_name)
    except ValueError:
        raise PastellException(
            status_code=404,
            detail="File not found",
        )

    return client_api.perform_delete(
        f"/entite/{file_data.entite_id}/document/{document_id}/file/{element_id}/{file_index}"
    )


def get_existing_files(
    entite_id: int,
    document_id: str,
    element_id: str,
    client_api: ApiPastell,
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
    response = client_api.perform_get(f"/entite/{entite_id}/document/{document_id}")
    document_data = response.get("data", {})
    return document_data.get(element_id, [])


def get_external_data_service(
    entite_id: int,
    document_id: str,
    element_id: str,
    client_api: ApiPastell,
) -> dict:
    """Récupère les valeurs possibles pour un champ externalData dans Pastell.

    Args:
        entite_id (int): L'ID de l'entité.
        document_id (str): L'ID du document.
        element_id (str): L'ID de l'élément externalData.
        client_api (ApiPastell): client api

    Returns:
        dict: Les valeurs possibles pour l'élément externalData.
    """

    return client_api.perform_get(
        f"/entite/{entite_id}/document/{document_id}/externalData/{element_id}"
    )
