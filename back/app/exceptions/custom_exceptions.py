from fastapi import HTTPException


class PastellException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class DecryptionException(HTTPException):
    def __init__(self, detail: str = "Decryption failed"):
        super().__init__(status_code=400, detail=detail)


class UserNotFoundException(HTTPException):
    def __init__(self, detail: str = "User not found"):
        super().__init__(status_code=404, detail=detail)
