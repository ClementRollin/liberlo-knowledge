<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()
const sidebarOpen = ref(false)

watch(() => route.fullPath, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white">

    <!-- Backdrop mobile -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/40 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Barre mobile -->
      <header class="flex items-center gap-3 px-4 h-14 border-b border-gray-100 bg-white shrink-0 lg:hidden">
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-semibold text-gray-900 text-sm">Liberlo KB</span>
      </header>

      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
