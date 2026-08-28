export type EntiteTreeNode = {
  key: string;
  label: string;
  children: EntiteTreeNode[];
};

// Convertit une entité Pastell (id_e, denomination, child) au format attendu par les
// composants PrimeVue Tree/TreeSelect (key, label, children).
export function toEntiteTreeNode(node: EntiteNode): EntiteTreeNode {
  return {
    key: String(node.id_e),
    label: node.denomination,
    children: (node.child ?? []).map(toEntiteTreeNode),
  };
}

// Cherche la dénomination d'une entité (par id_e) dans l'arbre des entités accessibles,
// utilisé pour afficher l'"entité de base" de l'utilisateur (comme dans les paramètres Pastell).
export function findEntiteDenomination(
  nodes: EntiteNode[],
  id_e: number
): string | null {
  for (const node of nodes) {
    if (node.id_e === id_e) return node.denomination;
    const found = findEntiteDenomination(node.child ?? [], id_e);
    if (found) return found;
  }
  return null;
}
