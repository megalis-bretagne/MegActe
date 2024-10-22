from unittest.mock import MagicMock
import pytest
from app.models.users import UserPastell
from app.services.user_service import UserService
from app.schemas.user_schemas import UserCreate
from app.exceptions.custom_exceptions import UserExistException
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
                pwd_key="fake_key",
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

    def _insert_one_fake_user(self, user: UserPastell):
        self.session.add(user)
        self.session.commit()
