from typing import Dict, List
from pydantic import TypeAdapter

from ..models.entite_info import EntiteInfo, EntiteInfoWithChild
from requests.auth import HTTPBasicAuth
from . import ApiPastell

__all__ = "EntiteApi"


class EntiteApi(ApiPastell):
    """Client pour les entites de pastell

    Args:
        ApiPastell (_type_): _description_
    """

    def get_entite(self, only_active: bool = False, auth: HTTPBasicAuth = None):
        """Retourne les entités à plat en fonction du contexte utilisateur

        Args:
            only_active (bool, optional): pour filtrer les entités actite uniquement ou non
            auth (AuthUser, optional): le contexte utilisateur redéfini

        Returns:
            Liste d'entite
        """
        list_entites = TypeAdapter(list[EntiteInfo]).validate_python(self.perform_get("/entite", auth))

        return list_entites if not only_active else list(filter(lambda entite: entite.is_active, list_entites))

    def get_entite_with_child(self, only_active: bool = False, auth: HTTPBasicAuth = None):
        """Retourne les entités hierarchisés  en fonction du contexte utilisateur

        Args:
            only_active (bool, optional): pour filtrer les entités actite uniquement ou non
            auth (AuthUser, optional): le contexte utilisateur redéfini

        Returns:
            Liste d'entite
        """
        list_entites = self.get_entite(only_active, auth)
        return self._build_tree_entite(list_entites)

    def _build_tree_entite(self, entites: List[EntiteInfo]) -> List[EntiteInfoWithChild]:
        """
        Construit un arbre d'entités avec des relations parent-enfant à partir d'une liste plate d'entités.

        Args:
            id_e_racine (int) : la racine
            entites (List[EntiteInfo]): La liste d'entités à plat.

        Returns:
            List[EntiteInfoWithChild]: Une liste d'entités à la racine avec leurs enfants.

        """
        entite_dict: Dict[int, EntiteInfoWithChild] = {}
        all_entite_ids: set[int] = set()
        entite_mere_ids: set[int] = set()
        for entite in entites:
            entite_dict[entite.id_e] = EntiteInfoWithChild(**entite.model_dump(), child=[])
            all_entite_ids.add(entite.id_e)
            entite_mere_ids.add(entite.entite_mere)

        def _complete(
            group_entite: Dict[int, EntiteInfoWithChild],
            all_entite_ids: set[int],
            entite_mere_ids: set[id],
        ):
            for id_e in all_entite_ids:
                if id_e not in entite_mere_ids:  # si feuille
                    id_mere = group_entite[id_e].entite_mere
                    entite_mere = group_entite[id_mere] if id_mere in group_entite else None
                    if entite_mere is not None:
                        entite_mere.child.append(group_entite[id_e])
                        del group_entite[id_e]  # on supprime l'entite feuille du group

            all_entite_ids = set(entite_dict.keys())
            entite_mere_ids = set([entite.entite_mere for entite in list(entite_dict.values())])
            # tant qu'il y a des id commun entre les id_mere et tous les id
            if not entite_mere_ids.isdisjoint(all_entite_ids):
                _complete(group_entite, all_entite_ids, entite_mere_ids)

        _complete(entite_dict, all_entite_ids, entite_mere_ids)

        return list(entite_dict.values())
