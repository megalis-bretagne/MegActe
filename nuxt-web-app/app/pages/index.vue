<script setup lang="ts">
const { user, pastellReady, selectedFlux } = useUserContext();


const entiteId = computed(() => user.value?.pastellUser?.user_info?.id_e);
console.log("tester ", entiteId.value);
console.log("tester_2", selectedFlux);
</script>

<template>
  <div class="p-6">
    <DocumentList
      v-if="entiteId"
      :entite-id="entiteId"
      :id-flux="selectedFlux"
    />

    <div v-else-if="!pastellReady" class="space-y-3 mt-2">
      <div class="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table class="min-w-full table-auto text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3">
                <div class="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </th>
              <th class="px-4 py-3 hidden sm:table-cell">
                <div class="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th class="px-4 py-3">
                <div class="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th class="px-4 py-3 hidden sm:table-cell">
                <div class="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="i in 8" :key="i">
              <td class="px-4 py-3">
                <div
                  class="h-3 bg-gray-100 rounded animate-pulse"
                  :style="`width: ${60 + ((i * 13) % 30)}%`"
                />
              </td>
              <td class="px-4 py-3 hidden sm:table-cell">
                <div class="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </td>
              <td class="px-4 py-3">
                <div class="h-5 w-28 bg-blue-50 rounded-full animate-pulse" />
              </td>
              <td class="px-4 py-3 hidden sm:table-cell">
                <div class="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
