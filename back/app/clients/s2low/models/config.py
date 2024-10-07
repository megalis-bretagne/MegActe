from dataclasses import dataclass


@dataclass
class Config:
    """
    Config du client s2low
    """

    base_url: str
    certificate_path: str | None = None
    key_path: str | None = None
    verify_host: bool | None = None
    proxy_host: str | None = None
    timeout: int = 5  # Timeout par défaut
