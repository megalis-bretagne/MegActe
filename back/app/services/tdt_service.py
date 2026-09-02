from ..schemas.document_schemas import DocumentDetail
from ..services.connecteur_service import ConnecteurTdtService
from . import get_or_make_api_s2low
import logging
from requests.auth import HTTPBasicAuth


class TdtService:
    """
    Service pour le Tdt
    """

    def __init__(self) -> None:
        self.api_s2low = get_or_make_api_s2low()
        self.connecteur_service = ConnecteurTdtService()

    def teletransmission(self, doc: DocumentDetail, id_e: int) -> str:
        """Retourne l'url de télétransmission

        Args:
            doc (DocumentDetail): le document à télétransmettre
            id_e (int): l'entité

        Returns:
            str: l'url de télétransmission
        """
        logging.debug("Demande de teletransmission")

        # Avoir en paramètre le Document (id,e, flux, id tedetis_transaction_id)
        co = self.connecteur_service.get_connecteur(doc.info.type, id_e)
        logging.debug("Récupératoin du connecteur")
        # Récupérer le connecteur associé avec le login_tech et le password
        # Faire appel à GetNoune de s2low pour récupérer un nounce
        #
        # Appel au service td2t pour construire l'url
        return self.api_s2low.get_url_post_confirm(
            HTTPBasicAuth(co.login_tech_tdt, co.get_decrypt_password()),
            doc.data["tedetis_transaction_id"],
        )

    def teletransmission_multi(self, docs: list[DocumentDetail], id_e: int) -> str:
        """Retourne l'url de télétransmission pour plusieurs documents

        Args:
            docs (DocumentDetail[]): les documents à télétransmettre
            id_e (int): l'entité
        Returns:
            str: l'url de télétransmission
        """
        # Avoir en paramètre le Document (id,e, flux, id tedetis_transaction_id)
        co = self.connecteur_service.get_connecteur(docs[0].info.type, id_e)
        list_tedetis = [d.data["tedetis_transaction_id"] for d in docs]

        return self.api_s2low.get_url_post_confirm_multi(
            HTTPBasicAuth(co.login_tech_tdt, co.get_decrypt_password()),
            list_tedetis,
        )
