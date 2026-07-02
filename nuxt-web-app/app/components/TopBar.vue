<script setup lang="ts">
const { data } = useAuth();
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-4">
        <!-- Left side: Logo and text -->
        <div class="flex items-center space-x-3 flex-shrink-0">
          <img
            src="/img/megalis_logo.png"
            alt="Megacte Logo"
            class="h-20 w-auto"
          />
          <div>
            <NuxtLink
              to="/"
              title="Accueil Megactes"
              class="text-lg font-bold text-gray-900"
            >
              Megactes
            </NuxtLink>
            <p class="text-sm text-gray-500">
              Gestion des actes administratifs
            </p>
          </div>
        </div>

        <!-- Right side: User Avatar -->
        <div class="flex items-center flex-shrink-0">
          <span
            v-if="data?.user?.name"
            class="text-sm text-gray-600 hidden md:inline mr-2"
          >
            {{ data.user.name }}
          </span>
          <Avatar :label="data?.user?.name?.charAt(0)" />
        </div>
      </div>
    </div>
  </header>
</template>
