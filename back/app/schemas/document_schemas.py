from pydantic import BaseModel
from typing import Dict, Any
from fastapi import UploadFile
from typing import List


class DocUpdateInfo(BaseModel):
    """
    Modèle pour la mise à jour d'un document.

    Attributes:
        entite_id (int): L'ID de l'entité à laquelle le document est associé.
        doc_info (Dict[str, Any]): Les informations mises à jour du document.
    """

    entite_id: int
    doc_info: Dict[str, Any]


class DocCreateInfo(BaseModel):
    """
    Modèle pour la création d'un nouveau document.

    Attributes:
        entite_id (int): L'ID de l'entité à laquelle le document sera associé.
        flux_type (str): Le type de flux du document.
        doc_info (Dict[str, Any]): Les informations initiales du document.
    """

    entite_id: int
    flux_type: str
    doc_info: Dict[str, Any]


class DeleteFileFromDoc(BaseModel):
    """
    Modèle pour la suppression d'un fichier d'un document.

    Attributes:
        entite_id (int): L'ID de l'entité à laquelle le document est associé.
        file_name (str): Le nom du fichier à supprimer.
    """

    entite_id: int
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
