<script setup lang="ts">
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <TopBar />
    <div class="flex flex-1 overflow-hidden">
      <SideBar />
      <main class="flex-1 overflow-y-auto p-6">
        <NuxtRouteAnnouncer />
        <!-- C'est le contenu de la page selon l'URL. La zone qui change à chaque navigation -->
         <NuxtPage />
       </main>
     </div>
   </div>
 </template>
