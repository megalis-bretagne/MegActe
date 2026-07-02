<script setup lang="ts">
const props = defineProps<{
  totalPages: number;
  pageActive: number;
}>();

const emit = defineEmits<{ changePage: [page: number] }>();

const pagesToShow = 7;

const pagesToDisplay = computed(() => {
  const pages: number[] = [];
  const total = props.totalPages;
  const current = props.pageActive;

  let start = Math.max(2, current - 3);
  let end = Math.min(total - 1, current + 3);

  if (current <= 4) end = Math.min(pagesToShow, total - 1);
  if (current > total - 4) start = Math.max(2, total - pagesToShow + 1);

  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

function changePage(page: number) {
  if (page === props.pageActive) return;
  if (page < 1 || page > props.totalPages) return;
  emit("changePage", page);
}

const showLeftEllipsis = computed(() => props.pageActive > pagesToShow / 2 + 2);
const showRightEllipsis = computed(
  () => props.totalPages > props.pageActive + pagesToShow / 2 + 2
);
</script>

<template>
  <nav
    role="navigation"
    aria-label="Pagination"
    class="flex justify-center items-center py-3 px-4"
  >
    <ul class="inline-flex items-center gap-1">
      <!-- Première page -->
      <li>
        <button
          @click="changePage(1)"
          :disabled="pageActive === 1"
          title="Première page"
          class="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono"
        >
          «
        </button>
      </li>

      <!-- Précédent -->
      <li>
        <button
          @click="changePage(pageActive - 1)"
          :disabled="pageActive === 1"
          title="Page précédente"
          class="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono"
        >
          ‹
        </button>
      </li>

      <!-- Page 1 -->
      <li>
        <button
          @click="changePage(1)"
          :class="
            pageActive === 1
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          "
          class="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors"
        >
          1
        </button>
      </li>

      <!-- Ellipsis gauche -->
      <li v-if="showLeftEllipsis">
        <span
          class="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
          >…</span
        >
      </li>

      <!-- Pages du milieu -->
      <li v-for="page in pagesToDisplay" :key="page">
        <button
          @click="changePage(page)"
          :class="
            page === pageActive
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          "
          class="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors"
        >
          {{ page }}
        </button>
      </li>

      <!-- Ellipsis droite -->
      <li v-if="showRightEllipsis">
        <span
          class="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
          >…</span
        >
      </li>

      <!-- Dernière page -->
      <li v-if="totalPages > 1">
        <button
          @click="changePage(totalPages)"
          :class="
            pageActive === totalPages
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          "
          class="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors"
        >
          {{ totalPages }}
        </button>
      </li>

      <!-- Suivant -->
      <li>
        <button
          @click="changePage(pageActive + 1)"
          :disabled="pageActive >= totalPages"
          title="Page suivante"
          class="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono"
        >
          ›
        </button>
      </li>

      <!-- Dernière page -->
      <li>
        <button
          @click="changePage(totalPages)"
          :disabled="pageActive >= totalPages"
          title="Dernière page"
          class="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono"
        >
          »
        </button>
      </li>
    </ul>
  </nav>
</template>
