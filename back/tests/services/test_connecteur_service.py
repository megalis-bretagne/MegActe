from unittest.mock import MagicMock
import pytest
from app.services.connecteur_service import ConnecteurTdtService
from app.schemas.connecteur_schemas import ConnecteurCreateAuthTdt
from app.exceptions.custom_exceptions import ConnecteurExistException
from app.models.connecteur_auth_tdt import ConnecteurAuthTdt
from ..conftest import TestDatabase


class TesterConnecteurService(TestDatabase):
    """Test du service connecteur"""

    connecteur_fake = ConnecteurCreateAuthTdt(
        flux="deliberation-studio", id_e=1, login_tech_tdt="tech", pwd_tech_tdt="fake"
    )

    def setUp(self):
        super().setUp()
        self.client_api = MagicMock()
        self._insert_one_fake_connecteur(
            ConnecteurAuthTdt(
                flux="deliberation-studio",
                id_e=1,
                login_tech_tdt="tech",
                pwd_tech_tdt="fake",
                pwd_key="fake_key",
            )
        )

    def test_should_return_error_add_exist_connecteur(self):
        # Given
        connecteur_exit = ConnecteurCreateAuthTdt(
            id_e=self.connecteur_fake.id_e,
            flux=self.connecteur_fake.flux,
            pwd_tech_tdt="fake",
            login_tech_tdt="fake",
        )
        # Assert
        with pytest.raises(ConnecteurExistException):
            ConnecteurTdtService().create(connecteur_exit, self._sessionLocal)

    def test_should_add_new_connecteur(self):
        # Given
        new_connecteur = ConnecteurCreateAuthTdt(
            flux="deliberation-studio",
            id_e=111,
            login_tech_tdt="tech",
            pwd_tech_tdt="fake",
        )

        # assert
        insert_connecteur = ConnecteurTdtService().create(new_connecteur, self._sessionLocal)

        self.assertEqual(insert_connecteur.flux, new_connecteur.flux)
        self.assertEqual(insert_connecteur.login_tech_tdt, new_connecteur.login_tech_tdt)
        self.assertEqual(insert_connecteur.id_e, new_connecteur.id_e)

    def _insert_one_fake_connecteur(self, co: ConnecteurAuthTdt):
        with self._sessionLocal() as db:
            db.add(co)
            db.commit()
