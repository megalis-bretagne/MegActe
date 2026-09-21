import base64
from unittest.mock import MagicMock

import pytest

from app.exceptions.custom_exceptions import UserExistException
from app.models.users import UserPastell
from app.schemas.user_schemas import UserCreate
from app.services.user_service import UserService
from app.utils import PasswordUtils

from ..conftest import TestDatabase


class TestUserService(TestDatabase):
    """Test du service user_service"""

    user_fake = UserCreate(login="test_meg@megacte.fr", id_pastell=1, pwd_pastell="fake")

    def setUp(self):
        super().setUp()
        self.client_api = MagicMock()
        self._insert_one_fake_user(
            UserPastell(
                login=self.user_fake.login,
                id_pastell=self.user_fake.id_pastell,
                pwd_pastell=self.user_fake.pwd_pastell,
                pwd_key=PasswordUtils.generate_fernet_key(),
            )
        )

    def test_should_return_error_add_exist_user(self):
        # Given
        user_login_exist = UserCreate(
            login=self.user_fake.login,
            id_pastell=100,
            pwd_pastell="fake",
        )
        # Assert
        with pytest.raises(UserExistException):
            UserService(self.client_api).add_user_to_db(user_login_exist, self.session)

    def test_should_return_error_add_exist_user_id_pastell(self):
        # Given
        user_id_pastell_exist = UserCreate(
            login="fake_login",
            id_pastell=1,
            pwd_pastell="fake",
        )
        # Assert
        with pytest.raises(UserExistException):
            UserService(self.client_api).add_user_to_db(user_id_pastell_exist, self.session)

    def test_should_add_new_user(self):
        # Given
        new_user = UserCreate(
            login="new_login@megacte.fr",
            id_pastell=1000,
            pwd_pastell="AZerty35!",
        )

        # assert
        insert_user = UserService(self.client_api).add_user_to_db(new_user, self.session)
        self.client_api.perform_patch.assert_called_once_with(
            f"/utilisateur/{new_user.id_pastell}",
            {"password": new_user.pwd_pastell},
        )
        self.assertEqual(insert_user.login, new_user.login)
        self.assertEqual(insert_user.id_pastell, new_user.id_pastell)
        self.assertIsNotNone(insert_user.pwd_pastell)
        self.assertIsNotNone(insert_user.pwd_key)

    def test_create_user_token_resets_password_and_creates_token(self):
        # Given
        user = self.session.query(UserPastell).filter(UserPastell.login == self.user_fake.login).first()
        token_value = "pastell-token-abc123"
        self.client_api.with_auth.return_value.perform_post.return_value = {"token": token_value}

        # When
        result = UserService(self.client_api).create_user_token(user, self.session)

        # Then le mot de passe a été réinitialisé via le compte technique
        self.client_api.perform_patch.assert_called_once()
        patch_args, _ = self.client_api.perform_patch.call_args
        self.assertEqual(patch_args[0], f"/utilisateur/{self.user_fake.id_pastell}")
        temp_password = patch_args[1]["password"]
        self.assertEqual(len(temp_password), 15)
        self.assertTrue(any(c.islower() for c in temp_password))
        self.assertTrue(any(c.isupper() for c in temp_password))
        self.assertTrue(any(c.isdigit() for c in temp_password))
        self.assertGreaterEqual(sum(1 for c in temp_password if c in "!@#$%&*"), 3)

        # Then le token a été créé via Basic Auth login / mot de passe temporaire
        self.client_api.with_auth.assert_called_once()
        user_auth = self.client_api.with_auth.call_args.args[0]
        self.assertEqual(user_auth.username, self.user_fake.login)
        self.assertEqual(user_auth.password, temp_password)
        self.client_api.with_auth.return_value.perform_post.assert_called_once_with(
            "/utilisateur/token", data={"name": f"megacte_{self.user_fake.login}"}
        )

        # Then le token est stocké chiffré en base
        self.assertEqual(result.token_name, f"megacte_{self.user_fake.login}")
        self.assertIsNotNone(result.token)
        self.assertNotEqual(result.token, token_value)
        self.assertEqual(PasswordUtils.decrypt_with_key(result.token, user.pwd_key), token_value)

    def test_create_user_token_replaces_non_fernet_legacy_key(self):
        # Given un utilisateur avec une clé au format "double base64" (issue d'encrypt_password)
        user = self.session.query(UserPastell).filter(UserPastell.login == self.user_fake.login).first()
        user.pwd_key = base64.urlsafe_b64encode(b"not-a-fernet-key").decode()
        self.session.commit()
        token_value = "pastell-token-abc123"
        self.client_api.with_auth.return_value.perform_post.return_value = {"token": token_value}

        # When
        result = UserService(self.client_api).create_user_token(user, self.session)

        # Then une clé Fernet valide est générée et le token est chiffrable/déchiffrable
        self.assertEqual(
            PasswordUtils.decrypt_with_key(result.token, result.pwd_key),
            token_value,
        )

    def test_create_user_token_does_not_store_temp_password(self):
        # Given
        user = self.session.query(UserPastell).filter(UserPastell.login == self.user_fake.login).first()
        self.client_api.with_auth.return_value.perform_post.return_value = {"token": "pastell-token-abc123"}

        # When
        UserService(self.client_api).create_user_token(user, self.session)

        # Then le mot de passe temporaire n'est pas enregistré dans pwd_pastell
        refreshed = self.session.query(UserPastell).filter(UserPastell.login == self.user_fake.login).first()
        self.assertEqual(refreshed.pwd_pastell, self.user_fake.pwd_pastell)

    def _insert_one_fake_user(self, user: UserPastell):
        self.session.add(user)
        self.session.commit()
