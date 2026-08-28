<script setup lang="ts">
useHead({ title: "Paramètres" });

const { data } = useAuth();
const pastellUser = usePastellUser();

const entiteBaseName = computed(() => {
  const u = pastellUser.value;
  if (!u) return null;
  return findEntiteDenomination(u.entites ?? [], u.user_info.id_e);
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-gray-900">Paramètres</h1>

    <section class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="font-medium text-gray-900 mb-3">Profil</h2>
      <div class="flex items-center gap-4">
        <Avatar :label="data?.user?.name?.charAt(0)" size="xlarge" />
        <dl class="text-sm">
          <div class="flex gap-2">
            <dt class="text-gray-500 w-20 shrink-0">Nom</dt>
            <dd class="text-gray-900">{{ data?.user?.name ?? "—" }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-gray-500 w-20 shrink-0">Email</dt>
            <dd class="text-gray-900">{{ data?.user?.email ?? "—" }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="font-medium text-gray-900 mb-3">Compte Pastell</h2>
      <dl
        v-if="pastellUser?.user_info"
        class="text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1"
      >
        <div class="flex gap-2">
          <dt class="text-gray-500 w-32 shrink-0">Nom</dt>
          <dd class="text-gray-900">
            {{ pastellUser.user_info.nom }} {{ pastellUser.user_info.prenom }}
          </dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-gray-500 w-32 shrink-0">Identifiant</dt>
          <dd class="text-gray-900">{{ pastellUser.user_info.login }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-gray-500 w-32 shrink-0">Email Pastell</dt>
          <dd class="text-gray-900">{{ pastellUser.user_info.email }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-gray-500 w-32 shrink-0">Id utilisateur</dt>
          <dd class="text-gray-900 tabular-nums">
            {{ pastellUser.user_info.id_u }}
          </dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-gray-500 w-32 shrink-0">Entité de base</dt>
          <dd class="text-gray-900">
            {{ entiteBaseName ?? pastellUser.user_info.id_e }}
          </dd>
        </div>
      </dl>
      <p v-else class="text-sm text-gray-400 italic">Chargement…</p>
    </section>
  </div>
</template>
