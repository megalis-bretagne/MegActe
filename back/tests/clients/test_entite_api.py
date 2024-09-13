import unittest

from app.clients.pastell.api.entite_api import EntiteApi
from app.clients.pastell.models.entite_info import EntiteInfo
from app.clients.pastell.models.config import Config


class TestEntiteApi(unittest.TestCase):

    def setUp(self):
        self.entite = EntiteApi(conf=Config(base_url="", timeout=5))

    def test_group_entite_admin(self):
        # GIVEN
        entites = [
            EntiteInfo(
                id_e=1,
                denomination="Megalis",
                siren="555555",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=2,
                denomination="Brest",
                siren="11111",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=3,
                denomination="Rennes",
                siren="55556666",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
        ]

        # do
        group_entite = self.entite._build_tree_entite(entites)

        # assert
        self.assertEqual(len(group_entite), len(entites))  # que des entites racines

    def test_group_one_root_multiple_child(self):
        # GIVEN
        entites = [
            EntiteInfo(
                id_e=4,
                denomination="Sous paf",
                siren="11111",
                type="type",
                entite_mere="2",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=2,
                denomination="PAF",
                siren="11111",
                type="type",
                entite_mere="1",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=1,
                denomination="Megalis",
                siren="555555",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=3,
                denomination="SI",
                siren="55556666",
                type="type",
                entite_mere="1",
                centre_de_gestion="0",
                is_active=True,
            ),
        ]

        # do
        group_entite = self.entite._build_tree_entite(entites)

        # assert
        self.assertEqual(len(group_entite), 1)  # une racine
        self.assertEqual(len(group_entite[0].child), 2)  # deux filles dans la racine

        child = list(filter(lambda child: child.id_e == 2, group_entite[0].child))
        self.assertEqual(len(child[0].child), 1)  # un fils dans l'id_e = 2

    def test_group_multiple_root_multiple_child(self):
        # GIVEN
        entites = [
            EntiteInfo(
                id_e=1,
                denomination="root 1",
                siren="55556666",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=2,
                denomination="child 2",
                siren="55556666",
                type="type",
                entite_mere="1",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=3,
                denomination="root 2",
                siren="55556666",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=4,
                denomination="child 2",
                siren="55556666",
                type="type",
                entite_mere="3",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=5,
                denomination="root 3",
                siren="55556666",
                type="type",
                entite_mere="0",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=6,
                denomination="child 5",
                siren="55556666",
                type="type",
                entite_mere="5",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=7,
                denomination="child 5.1",
                siren="55556666",
                type="type",
                entite_mere="6",
                centre_de_gestion="0",
                is_active=True,
            ),
            EntiteInfo(
                id_e=10,
                denomination="child 5.1",
                siren="55556666",
                type="type",
                entite_mere="8",
                centre_de_gestion="0",
                is_active=True,
            ),
        ]
        # do
        group_entite = self.entite._build_tree_entite(entites)

        # assert
        # [ id e 1 => [2] , 3 => [4] , 5 => [6 => [7]], 10 ]
        self.assertEqual(len(group_entite), 4)  # trois racine

        id_e_1 = list(filter(lambda entite: entite.id_e == 1, group_entite))[0]
        id_e_3 = list(filter(lambda entite: entite.id_e == 3, group_entite))[0]
        id_e_5 = list(filter(lambda entite: entite.id_e == 5, group_entite))[0]
        id_e_10 = list(filter(lambda entite: entite.id_e == 10, group_entite))[0]

        self.assertEqual(len(id_e_1.child), 1)
        self.assertEqual(len(id_e_3.child), 1)
        self.assertEqual(len(id_e_5.child), 1)
        self.assertEqual(len(id_e_10.child), 0)

        id_e_6 = id_e_5.child[0]
        self.assertEqual(id_e_6.id_e, 6)
        self.assertEqual(len(id_e_6.child), 1)
