<script setup lang="ts">
const { data } = useAuth();
const router = useRouter();
const { handleSignOut } = useKeycloakSignOut();

const userMenu = ref();
const userMenuItems = [
  {
    label: "Paramètres",
    icon: "pi pi-cog",
    command: () => router.push("/parametres"),
  },
  {
    label: "Se déconnecter",
    icon: "pi pi-sign-out",
    command: () => handleSignOut(),
  },
];

function toggleUserMenu(event: Event) {
  userMenu.value?.toggle(event);
}
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-4">
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

        <div class="flex-1 flex justify-center">
          <EntiteSelector />
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <Button
            as="router-link"
            to="/documents"
            icon="pi pi-file"
            label="Documents"
            text
            class="hidden md:inline-flex whitespace-nowrap"
          />
          <button
            type="button"
            class="flex items-center cursor-pointer bg-transparent border-0"
            @click="toggleUserMenu"
          >
            <span
              v-if="data?.user?.name"
              class="text-sm text-gray-600 hidden md:inline mr-2"
            >
              {{ data.user.name }}
            </span>
            <Avatar :label="data?.user?.name?.charAt(0)" />
          </button>
          <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
        </div>
      </div>
    </div>
  </header>
</template>
