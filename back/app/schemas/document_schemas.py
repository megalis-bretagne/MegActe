from enum import Enum
from pydantic import BaseModel, Field, AliasPath, model_validator
from typing import Dict, Any
from fastapi import UploadFile
from typing import List, Optional, Union

from .pagination import ResponsePagination


class DocumentActionRequest(BaseModel):
    """
    Modèle pour envoyer une action sur plusieurs documents

    Args:
        BaseModel (_type_): _description_
    """

    document_ids: Union[str, List[str]]
    action: str


class DocUpdateInfo(BaseModel):
    """
    Modèle pour la mise à jour d'un document.

    Attributes:
        doc_info (Dict[str, Any]): Les informations mises à jour du document.
    """

    doc_info: Dict[str, Any]


class DocCreateInfo(BaseModel):
    """
    Modèle pour la création d'un nouveau document.

    Attributes:
        flux_type (str): Le type de flux du document.
        doc_info (Dict[str, Any]): Les informations initiales du document.
    """

    flux_type: str
    doc_info: Dict[str, Any]


class DeleteFileFromDoc(BaseModel):
    """
    Modèle pour la suppression d'un fichier d'un document.

    Attributes:
        entite_id (int): L'ID de l'entité à laquelle le document est associé.
        file_name (str): Le nom du fichier à supprimer.
    """

    file_name: str


class AddFileToDoc(BaseModel):
    """
    Modèle pour l'ajout d'un fichier à un document.

    Attributes:
        entite_id (int): L'ID de l'entité à laquelle le document est associé.
        file (UploadFile): Le fichier à ajouter.
    """

    entite_id: int
    file: UploadFile


class AddFilesToDoc(BaseModel):
    """
    Modèle pour l'ajout de plusieurs fichiers à un document.

    Attributes:
        entite_id (int): L'ID de l'entité à laquelle le document est associé.
        files (List[UploadFile]): La liste des fichiers à ajouter.
    """

    entite_id: int
    files: List[UploadFile]


class ActionDocument(str, Enum):
    """Liste non définitive des Action possible sur un document

    Args:
        str (_type_): _description_
        Enum (_type_): _description_
    """

    teletransmission_tdt = "teletransmission-tdt"
    verif_tdt = "verif-tdt"
    creation = "creation"
    modification = "modification"
    document_transmis_tdt = "document-transmis-tdt"
    accepter_sae = "accepter-sae"
    acquitter_tdt = "acquiter-tdt"
    ar_recu_sae = "ar-recu-sae"
    erreur_envoie_sae = "erreur-envoie-sae"
    erreur_verif_tdt = "erreur-verif-tdt"
    pre_send_tdt = "pre-send-tdt"
    send_tdt = "send_tdt"
    preparation_send_ged = "preparation-send-ged"
    preparation_send_sae = "preparation-send-sae"
    return_teletransmission_tdt = "return-teletransmission-tdt"
    send_tdt_erreur = "send-tdt-erreur"
    termine = "termine"
    supression = "supression"
    orientation = "orientation"


class LastActionDocument(BaseModel):
    """Dernière action effectué sur un document"""

    action: ActionDocument | str
    message: Optional[str] = None
    date: Optional[str] = None


class ActionPossible(BaseModel):
    """
        Action Possible sur les documents

    Args:
        BaseModel (_type_): _description_
    """

    action: ActionDocument | str
    message: Optional[str] = None


class BaseModelDocument(BaseModel):
    """Les informations de base d'un document

    Args:
        id_d (str): L'identifiant unique du document.
        type (str): Le type actuel du document.
        titre (str): Le titre ou le nom du document.
        creation (str): La date de création du document (format attendu : YYYY-MM-DD hh:mm:ss).
        modification (str): La date de la dernière modification du document (format attendu : YYYY-MM-DD hh:mm:ss).
    """

    id_d: str
    type: str
    titre: str
    creation: str
    modification: str


class DocumentInfo(BaseModelDocument):
    """Les informations d'un document.
        L'objet ne contient pas les détails de tous le document

    Attributes:
        id_d (str): L'identifiant unique du document.
        id_e (int): L'identifiant unique de l'entité associée au document.
        role (str): Le rôle ou la fonction liée à ce document.
        siren (str): Le numéro SIREN de l'entité associée au document.
        last_action_date (str) : la date de la dernière action   (format attendu : YYYY-MM-DD hh:mm:ss).
        last_action (Optional[ActionDocument]): La dernière action effectuée sur le document
        last_action_message (Optional[str]) : le message de la dernière action
        action_possible (list[ActionDocument]): La liste des actions manuels possibles pour le document
    """

    id_e: int
    role: str
    siren: str
    last_action_date: str
    last_action: Optional[ActionDocument | str] = None
    last_action_message: Optional[str] = None
    action_possible: list[ActionPossible] = []

    def model_post_init(self, __context: Any):
        """Complète la creation du documentInfo après l'init

        Args:
            __context (Any): _description_
        """
        if self.last_action is None:
            self.last_action = ActionDocument.creation

        self._complete_next_action()

    def _complete_next_action(self):
        """
        complete les action_possible manuels possibles
        """
        # si creation, on ne peut faire que de la modif ou supression
        if self.last_action == ActionDocument.creation:
            self.action_possible = [
                ActionPossible(action=ActionDocument.modification, message="modifier"),
                ActionPossible(action=ActionDocument.supression, message="supprimer"),
            ]

        # Si modification, on peut envoyer (orientation) ou supprimer ou continuer à modifier
        if self.last_action == ActionDocument.modification:
            self.action_possible = [
                ActionPossible(action=ActionDocument.modification, message="modifier"),
                ActionPossible(action=ActionDocument.supression, message="supprimer"),
                ActionPossible(action=ActionDocument.orientation, message="Envoyer Document"),
            ]


class DocumentPaginate(BaseModel):
    """
    Modèle contenant la liste des documents, ainsi que les informations de pagination

    Args:
        BaseModel (_type_): _description_
    """

    documents: list[DocumentInfo]
    pagination: ResponsePagination


class DocumentDetail(BaseModel):
    """Le detail d'un document

    Args:
        BaseModel (_type_): _description_

    Returns:
        _type_: _description_
    """

    info: BaseModelDocument
    data: Dict[str, Any]

    last_action: str = Field(validation_alias=AliasPath("last_action", "action"))
    last_action_message: str = Field(validation_alias=AliasPath("last_action", "message"))
    last_action_date: str = Field(validation_alias=AliasPath("last_action", "date"))
    action_possible: list[ActionPossible] = []

    @model_validator(mode="before")
    def convert_action_possible(cls, values):
        # Si la clé 'action_possible' existe et contient une liste de chaînes de caractères
        if "action_possible" in values and isinstance(values["action_possible"], list):
            values["action_possible"] = [ActionPossible(action=item) for item in values["action_possible"]]
        return values
