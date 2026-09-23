import pytest

from app.dependencies import _token_roles, require_admin
from app.exceptions.custom_exceptions import UserNotAdminException


class TestTokenRoles:
    """Test de l'extraction des rôles Keycloak depuis le payload JWT."""

    def test_extracts_realm_role(self):
        payload = {"realm_access": {"roles": ["megacte-admin", "offline_access"]}}
        assert "megacte-admin" in _token_roles(payload)

    def test_extracts_client_role(self):
        payload = {"resource_access": {"megacte-sync": {"roles": ["megacte-admin"]}}}
        assert "megacte-admin" in _token_roles(payload)

    def test_no_roles(self):
        assert _token_roles({}) == set()
        assert _token_roles({"realm_access": {}}) == set()

    def test_require_admin_allows_admin_role(self):
        payload = {"realm_access": {"roles": ["megacte-admin"]}}
        assert require_admin(payload) is payload

    def test_require_admin_allows_client_admin_role(self):
        payload = {"resource_access": {"megacte-sync": {"roles": ["megacte-admin"]}}}
        assert require_admin(payload) is payload

    def test_require_admin_rejects_without_role(self):
        payload = {"resource_access": {"megacte": {"roles": ["default-roles-megalis"]}}}
        with pytest.raises(UserNotAdminException):
            require_admin(payload)
