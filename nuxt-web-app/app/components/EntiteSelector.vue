<script setup lang="ts">
const user = usePastellUser();
const selectedEntiteId = useSelectedEntiteId();

type TreeNode = {
  key: string;
  label: string;
  children: TreeNode[];
};

// Convertit une entité Pastell (id_e, denomination, child) en noeud attendu par le TreeSelect (key, label, children)
function toTreeNode(node: EntiteNode): TreeNode {
  return {
    key: String(node.id_e),
    label: node.denomination,
    children: (node.child ?? []).map(toTreeNode),
  };
}

// Liste des entités de l'utilisateur, converties au format attendu par le TreeSelect
const treeNodes = computed<TreeNode[]>(() =>
    (user.value?.entites ?? []).map(toTreeNode),
);

// Entité choisie manuellement par l'utilisateur (null si aucune sélection manuelle)
const manuelKey = ref<string | null>(null);

watch(treeNodes, () => {
  manuelKey.value = null;
});

const effectiveKey = computed(
    () => manuelKey.value ?? treeNodes.value[0]?.key ?? null,
);

// Le TreeSelect attend un objet { key: true }, on le construit à partir de effectiveKey
const selectedKeys = computed<Record<string, boolean>>({
  get: () => (effectiveKey.value ? { [effectiveKey.value]: true } : {}),
  set: (keys) => {
    manuelKey.value = Object.keys(keys)[0] ?? null;
  },
});

// Dès que l'entité sélectionnée change, on la passe dans le state global de l'app
watch(
    effectiveKey,
    (key) => {
      selectedEntiteId.value = key ? Number(key) : null;
    },
    { immediate: true },
);

// DEBUG temporaire
watch(
  [user, treeNodes, effectiveKey, selectedEntiteId],
  ([u, nodes, key, id]) => {
    console.log("[EntiteSelector] user=", u, "treeNodes=", nodes, "effectiveKey=", key, "selectedEntiteId=", id);
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
