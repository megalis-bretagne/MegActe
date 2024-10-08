from pydantic import BaseModel
from typing import Dict, Any
from fastapi import UploadFile
from typing import List

from .pagination import ResponsePagination


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


class DocumentPaginate(BaseModel):
    """
    Modèle contenant la liste des documents, ainsi que les informations de pagination

    Args:
        BaseModel (_type_): _description_
    """

    documents: dict | list
    pagination: ResponsePagination
