import requests

from ..dependencies import settings
from ..exceptions.custom_exceptions import PastellException
from .user_service import get_pastell_auth
from ..models.users import UserPastell
from ..schemas.document_schemas import (
    DocUpdateInfo,
    DocCreateInfo,
    DeleteFileFromDoc,
    AddFilesToDoc,
    AddFileToDoc,
)
from ..decorators import log_exceptions


@log_exceptions
def create_empty_document(entite_id: int, flux_type: str, user: UserPastell):
    """Crée un document vide dans Pastell pour un type de flux.

    Args:
        doc (DocCreateEmpty):Les informations nécessaires pour créer le document.
        user (UserPastell): L'utilisateur pour lequel le document doit être créé.

    Raises:
        PastellException: Si le document ne peut pas être créé dans Pastell.

    Returns:
        dict: Les détails du document créé.
    """
    create_document_url = f"{settings.pastell.url}/entite/{entite_id}/document"

    response = requests.post(
        create_document_url,
        data={"type": flux_type},
        auth=get_pastell_auth(user),
        timeout=settings.request_timeout,
    )

    if response.status_code != 201:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to create document in Pastell",
        )

    return response.json()


@log_exceptions
def update_document_service(
    document_id: int, document_data: DocUpdateInfo, user: UserPastell
):
    """Met à jour un document dans Pastell avec les données fournies.

    Args:
        document_id (int): L'ID du document à mettre à jour.
        document_data (DocUpdateInfo): Les données à mettre à jour dans le document.
        user (UserPastell): L'utilisateur pour lequel le document doit être mis à jour.

    Raises:
        PastellException: Si le document ne peut pas être mis à jour dans Pastell.

    Returns:
        dict: Les détails du document mis à jour.
    """
    update_document_url = f"{settings.pastell.url}/entite/{document_data.entite_id}/document/{document_id}"
    response = requests.patch(
        update_document_url,
        data=document_data.doc_info,
        auth=get_pastell_auth(user),
        timeout=settings.request_timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to update document in Pastell",
        )

    return response.json()


@log_exceptions
def create_document_service(doc_data: DocCreateInfo, user: UserPastell):
    """Crée un document vide et le met à jour avec les infos fournies.

    Args:
        doc_create (DocCreateInfo): Les informations nécessaires pour créer le document.
        user (UserPastell): L'utilisateur pour lequel le document doit être créé et mis à jour.

    Raises:
        PastellException: Si le document ne peut pas être créé ou mis à jour dans Pastell.

    Returns:
        dict: Les détails du document créé et mis à jour.
    """
    # Création du doc vide
    created_document = create_empty_document(
        doc_data.entite_id, doc_data.flux_type, user
    )

    document_id = created_document.get("id_d")

    doc_update_info = DocUpdateInfo(
        entite_id=doc_data.entite_id, doc_info=doc_data.doc_info
    )

    # Mettre à jour le doc vc les infos fournies
    updated_document = update_document_service(document_id, doc_update_info, user)

    return updated_document


@log_exceptions
def get_document_info_service(entite_id: int, document_id: str, user: UserPastell):
    """Récupère les infos d'un document dans Pastell.

    Args:
        entite_id (int): L'ID de l'entité.
        document_id (str): L'ID du document à récupérer.
        user (UserPastell): L'utilisateur pour lequel le document doit être récupéré.

    Raises:
        PastellException: Si les informations du document ne peuvent pas être récupérées dans Pastell.

    Returns:
        dict: Les détails du document récupéré.
    """

    get_document_url = (
        f"{settings.pastell.url}/entite/{entite_id}/document/{document_id}"
    )

    response = requests.get(
        get_document_url,
        auth=get_pastell_auth(user),
        timeout=settings.request_timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to retrieve document information from Pastell",
        )

    return response.json()


@log_exceptions
def add_multiple_files_to_document_service(
    document_id: str,
    element_id: str,
    files_data: AddFilesToDoc,
    user: UserPastell,
):
    """Ajoute plusieurs fichiers à un document en appelant le service add_file_to_document_service.

    Args:
        document_id (str): L'ID du document.
        element_id (str): L'ID de l'élément auquel les fichiers sont associés.
        files_data (AddFilesToDoc): Les informations nécessaires pour ajouter les fichiers.
        user (UserPastell): L'utilisateur pour lequel l'opération doit être effectuée.

    Raises:
        PastellException: Si un fichier ne peut pas être ajouté à Pastell.

    Returns:
        dict: Les détails de l'ajout des fichiers.
    """
    results = []

    for file in files_data.files:
        file_data = AddFileToDoc(entite_id=files_data.entite_id, file=file)
        result = add_file_to_document_service(document_id, element_id, file_data, user)
        results.append(result)

    return results


@log_exceptions
def add_file_to_document_service(
    document_id: str,
    element_id: str,
    file_data: AddFileToDoc,
    user: UserPastell,
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
    existing_files = get_existing_files(
        file_data.entite_id, document_id, element_id, user
    )
    next_file_number = len(existing_files)

    add_file_url = f"{settings.pastell.url}/entite/{file_data.entite_id}/document/{document_id}/file/{element_id}/{next_file_number}"

    file_content = file_data.file.file.read()

    files = {
        "file_name": (None, file_data.file.filename),
        "file": (file_data.file.filename, file_content, file_data.file.content_type),
    }

    response = requests.post(
        add_file_url,
        auth=get_pastell_auth(user),
        files=files,
        timeout=settings.request_timeout,
    )

    if response.status_code != 201:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to add file to Pastell",
        )

    return response.json()


@log_exceptions
def delete_file_from_document_service(
    document_id: str, element_id: str, file_data: DeleteFileFromDoc, user: UserPastell
):
    """Supprime un fichier lié à un document spécifique dans Pastell.

    Args:
        document_id (str): L'ID du document auquel le fichier est associé.
        element_id (str): L'ID du champ auquel le fichier est associé.
        file_data (DeleteFileFromDoc): Les informations nécessaires pour supprimer un fichier.
        user (UserPastell): L'utilisateur pour lequel l'opération doit être effectuée.

    Raises:
        PastellException: Si le fichier ne peut pas être supprimé de Pastell.

    Returns:
        dict: Les détails de la suppression du fichier.
    """
    existing_files = get_existing_files(
        file_data.entite_id, document_id, element_id, user
    )

    try:
        file_index = existing_files.index(file_data.file_name)
    except ValueError:
        raise PastellException(
            status_code=404,
            detail="File not found",
        )

    delete_file_url = f"{settings.pastell.url}/entite/{file_data.entite_id}/document/{document_id}/file/{element_id}/{file_index}"

    response = requests.delete(
        delete_file_url,
        auth=get_pastell_auth(user),
        timeout=settings.request_timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to delete file from Pastell",
        )

    return response.json()


@log_exceptions
def get_existing_files(
    entite_id: int, document_id: str, element_id: str, user: UserPastell
) -> list:
    """Récupère la liste des fichiers existants pour un document et un élément donnés.

    Args:
        document_id (str): L'ID du document.
        element_id (str): L'ID de l'élément.

    Returns:
        list: Une liste des fichiers existants.
    """
    get_files_url = f"{settings.pastell.url}/entite/{entite_id}/document/{document_id}"
    response = requests.get(
        get_files_url,
        auth=get_pastell_auth(user),
        timeout=settings.request_timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to retrieve existing files from Pastell",
        )

    document_data = response.json().get("data", {})
    return document_data.get(element_id, [])
