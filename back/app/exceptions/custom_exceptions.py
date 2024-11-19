from enum import Enum
from fastapi import HTTPException
import logging
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class ErrorCode(str, Enum):
    """Liste des code d'erreurs

    Args:
        Enum (_type_): _description_
    """

    PASTELL_UNAVAILABLE = "PASTELL_UNAVAILABLE"
    PASTELL_NO_RIGHT = "PASTELL_NO_RIGHT"
    PASTELL_ERROR = "PASTELL_ERROR"
    MEGACTE_ERROR = "MEGACTE_ERROR"
    MEGACTE_CREATE_DOCUMENT_NO_RIGHT = "MEGACTE_CREATE_DOCUMENT_NO_RIGHT"
    USER_NOT_REGISTER = "USER_NOT_REGISTER"


class MegActeException(Exception):
    """Exception pour les erreurs de l'application."""

    detail: str
    code: ErrorCode
    status_code: int

    def __init__(
        self, status_code: int = 400, detail: str = "Megacte Exception", code: ErrorCode = ErrorCode.MEGACTE_ERROR
    ):
        """Initialise une MegActeException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "Decryption failed".
        """
        logging.error(f"{self.__class__.__name__} : {detail}")
        self.code = code
        self.status_code = status_code
        self.detail = detail


class PastellException(MegActeException):
    """Exception pour les erreurs liées à Pastell.

    Args:
        HTTPException (HTTPException):  Classe de base pour les exceptions HTTP
    """

    def __init__(self, status_code: int, detail: str):
        """Initialise une PastellException

        Args:
            status_code (int): Le code de statut HTTP de l'erreur.
            detail (str): Le message détaillé de l'erreur.
        """
        super().__init__(status_code=status_code, detail=detail)


class DecryptionException(HTTPException):
    """Exception pour les erreurs de déchiffrement.

    Args:
        HTTPException (HTTPException): Classe de base pour les exceptions HTTP.
    """

    def __init__(self, detail: str = "Decryption failed"):
        """Initialise une DecryptionException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "Decryption failed".
        """
        super().__init__(status_code=400, detail=detail)


class EntiteIdException(MegActeException):
    """Exception pour les identifiants id_e."""

    def __init__(
        self,
        detail="L'identifiant de l'entite ne doit pas être Null ou inférieur à zéro",
    ):
        """Initialise une UserExistException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User already exist".
        """
        super().__init__(detail)


class ConnecteurNotFound(MegActeException):
    """Exception si le connecteur non trouvé

    Args:
        MegActeException (_type_): _description_
    """

    def __init__(self, id_e: str, flux: str):
        """Initialise une ConnecteurNotFound.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User already exist".
        """
        super().__init__(
            status_code=400,
            detail=f"Connecteur pour le flux {flux} et l'entité {id_e} introuvable",
        )


class ConnecteurExistException(MegActeException):
    """Exception pour les erreurs de connecteur déjà créé
    HTTPException (HTTPException): Classe de base pour les exceptions HTTP.
    """

    def __init__(self, id_e: str, flux: str):
        """Initialise une UserExistException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User already exist".
        """
        super().__init__(status_code=400, detail=f"Connecteur on {flux} / id_e {id_e} already exist")


class UserExistException(MegActeException):
    """Exception pour les erreurs de d'utilisateur déjà existant.

    Args:
        HTTPException (HTTPException): Classe de base pour les exceptions HTTP.
    """

    def __init__(self, login: str):
        """Initialise une UserExistException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User already exist".
        """
        super().__init__(status_code=400, detail=f"User {login} already exist")


class UserNotFoundException(MegActeException):
    """Exception pour les erreurs de non-trouvabilité du user dans la BD.

    Args:
        HTTPException (HTTPException): Classe de base pour les exceptions HTTP.
    """

    def __init__(self):
        """Initialise une UserNotFoundException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User not found".
        """
        super().__init__(status_code=404, detail="User not found", code=ErrorCode.USER_NOT_REGISTER)


class UserRegistrationException(MegActeException):
    """Exception pour les erreurs d'enregistrement du user dans la BD.

    Args:
        HTTPException (HTTPException): Classe de base pour les exceptions HTTP.
    """

    def __init__(self, detail: str = "User registration failed"):
        """Initialise une UserRegistrationException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User registration failed".
        """
        super().__init__(status_code=500, detail=detail)


class UserPasswordNullException(MegActeException):
    """Exception pour les erreurs lorsque le mdp du user est null.

    Args:
        HTTPException (HTTPException): Classe de base pour les exceptions HTTP.
    """

    def __init__(self, detail: str = "User password is null"):
        """Initialise une UserPasswordNullException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User password is null".
        """
        super().__init__(status_code=400, detail=detail)


class MegacteErrorResponse(JSONResponse):
    """Modele de response en cas d'erreur

    Args:
        JSONResponse (_type_): _description_
    """

    def __init__(self, detail: str, code: ErrorCode, status_code: int):
        super().__init__(status_code=status_code, content={"detail": detail, "code": code})
