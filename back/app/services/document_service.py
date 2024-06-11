import requests
from app.configuration import read_config
from ..exceptions.custom_exceptions import PastellException

from .user_service import get_pastell_auth
from ..models.users import UserPastell
from ..schemas.document_schemas import DocUpdateInfo, DocCreateInfo


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
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")

    create_document_url = f"{config['PASTELL']['URL']}/entite/{entite_id}/document"

    response = requests.post(
        create_document_url,
        data={"type": flux_type},
        auth=get_pastell_auth(user),
        timeout=timeout,
    )

    if response.status_code != 201:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to create document in Pastell",
        )

    return response.json()


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
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")

    update_document_url = f"{config['PASTELL']['URL']}/entite/{document_data.entite_id}/document/{document_id}"
    response = requests.patch(
        update_document_url,
        data=document_data.doc_info,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to update document in Pastell",
        )

    return response.json()


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
    config = read_config("config/config.yml")
    timeout = config.get("TIMEOUT")

    get_document_url = (
        f"{config['PASTELL']['URL']}/entite/{entite_id}/document/{document_id}"
    )

    response = requests.get(
        get_document_url,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to retrieve document information from Pastell",
        )

    return response.json()
