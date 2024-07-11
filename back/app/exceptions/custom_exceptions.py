from fastapi import HTTPException


class MegActeException(HTTPException):
    """Exception pour les erreurs de l'application.

    Args:
        HTTPException (HTTPException):  Classe de base pour les exceptions HTTP
    """

    detail: str
    status_code: int

    def __init__(self, status_code: int = 400, detail: str = "Megacte Exception"):
        """Initialise une MegActeException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "Decryption failed".
        """
        super().__init__(status_code=status_code, detail=detail)


class PastellException(HTTPException):
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

    def __init__(self, detail: str = "User not found"):
        """Initialise une UserNotFoundException.

        Args:
            detail (str, optional): Le message détaillé de l'erreur. Defaults to "User not found".
        """
        super().__init__(status_code=404, detail=detail)


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
