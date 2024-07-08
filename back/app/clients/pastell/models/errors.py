from dataclasses import dataclass


@dataclass
class ApiErrorResponse:
    """
    Objet permettant de mapper les erreurs d'api Pastell

    Returns:
        _type_: _description_
    """

    status: str
    error_message: str

    @classmethod
    def from_json(cls, data: dict):
        # Renommage des clés pour correspondre aux attributs de la classe
        if "error-message" in data:
            data["error_message"] = data.pop("error-message")
        return cls(**data)
