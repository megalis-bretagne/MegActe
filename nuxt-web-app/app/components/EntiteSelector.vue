<script setup lang="ts">
const { user, selectedEntiteId } = useUserContext();

type EntiteNode = {
  id_e: number;
  denomination: string;
  child: EntiteNode[];
};

// Je déclare le noeud
type TreeNode = {
  key: string;
  label: string;
  children: TreeNode[];
};

// Le tri par dénomination est fait côté back (cf. EntiteApi._sort_tree)
function toTreeNode(node: EntiteNode): TreeNode {
  return {
    key: String(node.id_e),
    label: node.denomination,
    children: (node.child ?? []).map(toTreeNode),
  };
}

function flattenKeys(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) => [n.key, ...flattenKeys(n.children)]);
}

// Arbre complet (une entrée par racine, Pastell peut en renvoyer plusieurs)
const treeNodes = computed<TreeNode[]>(() =>
  (user.value?.pastellUser?.entites ?? []).map(toTreeNode),
);

// Clé sélectionnée dans le TreeSelect (format imposé par le composant : map { key: true })
const selectedKeys = ref<Record<string, boolean>>({});

// Dès que l'arbre est disponible (ou change), on garde la sélection courante si elle
// existe toujours, sinon on retombe sur la première racine par défaut
watch(
  treeNodes,
  (nodes) => {
    const validKeys = new Set(flattenKeys(nodes));
    const currentKey = Object.keys(selectedKeys.value)[0];
    if (currentKey && validKeys.has(currentKey)) return;
    const firstRootKey = nodes[0]?.key;
    selectedKeys.value = firstRootKey ? { [firstRootKey]: true } : {};
  },
  { immediate: true },
);

// La clé sélectionnée est directement l'id_e : pas besoin de retraverser l'arbre
watch(
  selectedKeys,
  (keys) => {
    const key = Object.keys(keys)[0];
    selectedEntiteId.value = key ? Number(key) : null;
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="flex items-center gap-2">
    <TreeSelect
      v-if="treeNodes.length"
      v-model="selectedKeys"
      :options="treeNodes"
      selection-mode="single"
      filter
      filter-placeholder="Rechercher une entité"
      placeholder="Sélectionner une entité"
      class="text-sm"
      :pt="{
        root: { style: 'min-width: 16rem' },
        transition: { css: false },
      }"
    />

    <template v-else>
      <Skeleton width="16rem" height="2rem" border-radius="6px" />
    </template>
  </div>
</template>
