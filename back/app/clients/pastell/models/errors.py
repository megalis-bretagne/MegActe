from dataclasses import dataclass


@dataclass
class ApiErrorResponse:
    status: str
    error_message: str

    @classmethod
    def from_json(cls, data: dict):
        # Renommage des clés pour correspondre aux attributs de la classe
        if "error-message" in data:
            data["error_message"] = data.pop("error-message")
        return cls(**data)
