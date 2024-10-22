import ssl

from requests.adapters import HTTPAdapter


class SSLAdapter(HTTPAdapter):
    """
    SSL Adapter pour la connexion à s2low

    Args:
        HTTPAdapter (_type_): _description_
    """

    def __init__(self, certfile, certificate_key):
        self.context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
        self.context.load_cert_chain(certfile=certfile, keyfile=certificate_key, password="U6(p67#E4@Fbbd")

        super().__init__()

    def init_poolmanager(self, *args, **kwargs):
        kwargs["ssl_context"] = self.context
        return super().init_poolmanager(*args, **kwargs)
