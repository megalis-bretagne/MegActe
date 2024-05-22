import yaml


def read_config(config_file):
    """
    Lis la config du fichier yaml

    Args:
        config_file (str): Le fichier de config

    Returns:
        dict: la liste des configurations
    """
    try:
        with open(config_file) as yamlfile:
            config_data = yaml.safe_load(yamlfile)
    except Exception:
        config_data = {}
    return config_data
