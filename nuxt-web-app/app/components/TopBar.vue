<script setup lang="ts">
const { data } = useAuth();
const router = useRouter();
const { handleSignOut } = useKeycloakSignOut();

const userMenu = ref();
const isDarkMode = ref(false);
const userMenuItems = [
  {
    label: "Dashboard",
    icon: "pi pi-chart-bar",
    command: () => router.push("/"),
  },
  {
    label: "Documents",
    icon: "pi pi-file",
    command: () => router.push("/documents"),
  },
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

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle("p-dark", isDarkMode.value);
  localStorage.setItem("dark-mode", String(isDarkMode.value));
}

onMounted(() => {
  isDarkMode.value = localStorage.getItem("dark-mode") === "true";
  document.documentElement.classList.toggle("p-dark", isDarkMode.value);
});
</script>

<template>
  <header class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center space-x-3 flex-shrink-0">
          <a
            href="https://www.megalis.bretagne.bzh/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/img/megalis_logo.png"
              alt="Megacte Logo"
              class="h-20 w-auto"
            />
          </a>
          <div>
            <NuxtLink
              to="/"
              title="Accueil MegActes"
              class="text-lg font-bold text-gray-900 dark:text-white"
            >
              MegActes
            </NuxtLink>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Gestion des actes administratifs
            </p>
          </div>
        </div>

        <div class="flex-1 flex justify-center">
          <EntiteSelector />
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <Button
            :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
            :aria-label="isDarkMode ? 'Mode clair' : 'Mode sombre'"
            text
            rounded
            @click="toggleDarkMode"
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
