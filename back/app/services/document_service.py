import requests
from app.configuration import read_config
from ..exceptions.custom_exceptions import PastellException

from .user_service import get_pastell_auth
from ..models.users import UserPastell
from ..schemas.document_schemas import DocCreateEmpty, DocUpdateInfo


def create_empty_document(doc: DocCreateEmpty, user: UserPastell):
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

    create_document_url = f"{config['PASTELL']['URL']}/entite/{doc.entite_id}/document"

    response = requests.post(
        create_document_url,
        data={"type": doc.flux_type},
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
        data=document_data.acte_info,
        auth=get_pastell_auth(user),
        timeout=timeout,
    )

    if response.status_code != 200:
        raise PastellException(
            status_code=response.status_code,
            detail="Failed to update document in Pastell",
        )

    return response.json()
