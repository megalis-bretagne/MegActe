from fastapi.testclient import TestClient

from app.dependencies import require_admin, validate_token
from app.main import app


class TestRefreshUsersEndpoint:
    """Test du endpoint POST /users/refresh (accusé de réception immédiat + synchro de fond)."""

    def test_returns_immediate_ack_and_schedules_background_sync(self, monkeypatch):
        called: dict[str, bool] = {}

        def fake_run_sync_users_job() -> None:
            called["run"] = True

        monkeypatch.setattr("app.routers.users.run_sync_users_job", fake_run_sync_users_job)
        monkeypatch.setattr("app.main.run_sync_users_job", fake_run_sync_users_job)
        settings = __import__("app.dependencies", fromlist=["settings"]).settings
        monkeypatch.setattr(settings.sync, "enabled", False, raising=False)

        payload = {"preferred_username": "service-account-megacte-sync"}
        app.dependency_overrides[validate_token] = lambda: payload
        app.dependency_overrides[require_admin] = lambda: payload
        try:
            with TestClient(app) as client:
                response = client.post("/users/refresh")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {"message": "Synchronisation des utilisateurs lancée en arrière-plan"}
        assert called.get("run") is True
