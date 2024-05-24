from fastapi import HTTPException


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


class UserNotFoundException(HTTPException):
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


class UserRegistrationException(HTTPException):
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
