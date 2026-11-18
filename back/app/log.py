def safe_log_value(value: object) -> str:
    """Neutralise les retours à la ligne dans les valeurs écrites dans les logs."""
    return str(value).replace("\r", r"\r").replace("\n", r"\n")
