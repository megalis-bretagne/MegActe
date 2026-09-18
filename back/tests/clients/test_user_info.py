import unittest

from app.clients.pastell.models.user_info import UserInfo


class TestUserInfo(unittest.TestCase):
    """Test du modèle UserInfo (tolerant aux payloads partiels de Pastell)"""

    def test_should_parse_complete_user(self):
        # GIVEN
        data = {
            "id_u": "42",
            "login": "jdupont",
            "nom": "Dupont",
            "prenom": "Jean",
            "email": "j@x.fr",
            "id_e": "5",
            "active": True,
        }

        # WHEN
        user = UserInfo.model_validate(data)

        # THEN
        self.assertEqual(user.id_u, 42)
        self.assertEqual(user.login, "jdupont")
        self.assertEqual(user.id_e, 5)
        self.assertTrue(user.active)

    def test_should_parse_sparse_user(self):
        # GIVEN : payload minimal (champs nom/prenom/email/id_e absent)
        data = {"id_u": "7", "login": "compte-tech"}

        # WHEN
        user = UserInfo.model_validate(data)

        # THEN
        self.assertEqual(user.id_u, 7)
        self.assertEqual(user.login, "compte-tech")
        self.assertIsNone(user.nom)
        self.assertIsNone(user.prenom)
        self.assertIsNone(user.email)
        self.assertIsNone(user.id_e)
        self.assertTrue(user.active)

    def test_should_parse_nullable_id_e(self):
        # GIVEN
        data = {"id_u": "7", "login": "compte-tech", "id_e": None}

        # WHEN
        user = UserInfo.model_validate(data)

        # THEN
        self.assertIsNone(user.id_e)


if __name__ == "__main__":
    unittest.main()
