from dataclasses import dataclass


@dataclass
class Config:
    """
    Config du client pastell
    """

    base_url: str
    timeout: int = 5  # Timeout par défaut
