from unittest.mock import MagicMock

from app.models.connecteur_auth_tdt import ConnecteurAuthTdt
from app.services.connecteur_service import ConnecteurTdtService

from ..conftest import TestDatabase


class TestS2lowEnrollment(TestDatabase):
    def test_creates_one_account_for_an_entity(self):
        user = MagicMock(id_pastell=12, login="user")
        pastell = MagicMock()
        pastell.get_user_by_id_u.return_value.id_e = 42
        s2low = MagicMock()
        s2low.get_authority_by_siren.return_value = [{"id": 99}]
        s2low._config.password_salt = "test-salt"
        s2low.get_users.return_value = []

        account = ConnecteurTdtService().ensure_s2low_account(
            user, "123456789", "12345678901234", self.session, pastell, s2low
        )

        assert account.id_e == 42
        assert account.s2low_authority_id == 99
        assert account.login_tech_tdt == "megacte_99"
        assert account.get_decrypt_password()
        s2low.create_technical_user.assert_called_once()
        s2low.get_authority_by_siret.assert_not_called()
        assert (
            account.get_decrypt_password()
            == ConnecteurTdtService()
            .ensure_s2low_account(user, "123456789", "12345678901234", self.session, pastell, s2low)
            .get_decrypt_password()
        )

    def test_does_not_call_s2low_when_entity_is_known(self):
        with self._sessionLocal() as db:
            db.add(
                ConnecteurAuthTdt(
                    id_e=42,
                    flux="",
                    login_tech_tdt="megacte_99",
                    pwd_tech_tdt="fake",
                    pwd_key="fake",
                    s2low_authority_id=99,
                )
            )
            db.commit()

        user = MagicMock(id_pastell=12, login="user")
        pastell = MagicMock()
        pastell.get_user_by_id_u.return_value.id_e = 42
        s2low = MagicMock()
        s2low._config.password_salt = "test-salt"

        account = ConnecteurTdtService().ensure_s2low_account(
            user, None, "12345678901234", self.session, pastell, s2low
        )

        assert account.s2low_authority_id == 99
        s2low.get_authority_by_siret.assert_not_called()
