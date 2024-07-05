import unittest
import pytest

from app.utils import PasswordUtils
from app.exceptions.custom_exceptions import DecryptionException


class TestPassword(unittest.TestCase):
    def test_should_encrypt_and_decrypt_password(self):
        # GIVEN
        g_password = "Aeetrg0051.!!dzzd"

        key, password_encrypt = PasswordUtils.encrypt_password(g_password)
        self.assertIsNotNone(key)
        self.assertIsNotNone(password_encrypt)

        # should decrypt
        password_decrypt = PasswordUtils.decrypt_password(
            password_encrypt,
            key,
        )
        self.assertEqual(g_password, password_decrypt)

    def test_raise_decrypt_bad_key(self):
        # GIVEN
        g_password_encrypt = "gAAAAABmh_zNTOGJiDWfuPZrgm0UcEzrL7bnbtFvaFb2MXPoJhzzBOLHpy-EqvaIXDewIOu1C_LSkxsVBviEtTC7GXxO79wRiQzlB76Sy4FDp_gAih_uLDs="
        g_bad_key = "badkey"

        with pytest.raises(DecryptionException):
            PasswordUtils.decrypt_password(g_password_encrypt, g_bad_key)

    def test_raise_decrypt_password_none(self):
        # GIVEN
        g_key = "WGVBTlN1VUl5U0g0UVAxRm84M21LbHVEVnpRX202SnNnZFFqR3BLSkVmYz0="

        with pytest.raises(DecryptionException):
            PasswordUtils.decrypt_password("bad password", g_key)
