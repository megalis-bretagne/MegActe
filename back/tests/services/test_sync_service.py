from unittest.mock import MagicMock

from app.models.users import UserPastell
from app.services.sync_service import SyncUserService

from ..conftest import TestDatabase


class TestSyncUserService(TestDatabase):
    """Test du service de synchronisation des utilisateurs Pastell"""

    def setUp(self):
        super().setUp()
        self.api_admin = MagicMock()
        self.service = SyncUserService(self.api_admin)
        self.api_admin.perform_get.side_effect = [
            [{"id_e": "1"}, {"id_e": "2"}],
            [
                {"id_u": "10", "login": "alice", "nom": "A", "prenom": "Alice", "email": "alice@x.fr", "id_e": "1"},
                {"id_u": "11", "login": "bob", "nom": "B", "prenom": "Bob", "email": "bob@x.fr", "id_e": "1"},
            ],
            [{"id_u": "12", "login": "carol", "nom": "C", "prenom": "Carol", "email": "carol@x.fr", "id_e": "2"}],
        ]

    def test_sync_users_creates_new_users(self):
        self.service.sync_users(self.session)

        alice = self.session.query(UserPastell).filter(UserPastell.login == "alice").first()
        bob = self.session.query(UserPastell).filter(UserPastell.login == "bob").first()
        carol = self.session.query(UserPastell).filter(UserPastell.login == "carol").first()
        self.assertIsNotNone(alice)
        self.assertIsNotNone(bob)
        self.assertIsNotNone(carol)
        self.assertEqual(alice.id_pastell, 10)
        self.assertTrue(alice.active)
        self.assertIsNotNone(alice.pwd_key)

    def test_sync_users_deactivates_missing_users(self):
        self.session.add(
            UserPastell(
                login="gone",
                id_pastell=99,
                active=True,
                pwd_key="fake_key",
            )
        )
        self.session.commit()

        self.service.sync_users(self.session)

        gone = self.session.query(UserPastell).filter(UserPastell.login == "gone").first()
        self.assertFalse(gone.active)

    def test_sync_users_reactivates_deactivated_user(self):
        self.session.add(UserPastell(login="bob", id_pastell=11, active=False, pwd_key="fake_key"))
        self.session.commit()

        self.service.sync_users(self.session)

        bob = self.session.query(UserPastell).filter(UserPastell.login == "bob").first()
        self.assertTrue(bob.active)

    def test_sync_users_returns_active_count(self):
        count = self.service.sync_users(self.session)

        self.assertEqual(count, 3)

    def test_find_and_upsert_user_creates_row(self):
        user = self.service.find_and_upsert_user("alice", self.session)

        self.assertIsNotNone(user)
        self.assertEqual(user.login, "alice")
        self.assertEqual(user.id_pastell, 10)

    def test_find_and_upsert_unknown_login_returns_none(self):
        user = self.service.find_and_upsert_user("inconnu", self.session)

        self.assertIsNone(user)

    def test_sync_users_deduplicates_users_with_same_login(self):
        """Deux comptes Pastell avec le même login (id_u différents) ne créent qu'une seule ligne."""
        self.api_admin.perform_get.side_effect = [
            [{"id_e": "1"}, {"id_e": "2"}],
            [{"id_u": "10", "login": "duplicate@x.fr", "nom": "A", "prenom": "Alice", "id_e": "1"}],
            [{"id_u": "20", "login": "duplicate@x.fr", "nom": "B", "prenom": "Bob", "id_e": "2"}],
        ]

        self.service.sync_users(self.session)

        rows = self.session.query(UserPastell).filter(UserPastell.login == "duplicate@x.fr").all()
        self.assertEqual(len(rows), 1)
        self.assertIn(rows[0].id_pastell, (10, 20))
