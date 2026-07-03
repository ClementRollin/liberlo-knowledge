<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import logoLiberlo from '@/assets/logo-liberlo.png'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="flex items-center justify-between px-12 h-[101px] border-b border-gray-100 bg-white">
    <RouterLink to="/" class="shrink-0">
      <img :src="logoLiberlo" alt="Liberlo" class="h-[61px] w-[247px] object-contain object-left" />
    </RouterLink>

    <div class="relative group">
      <button
        class="w-[60px] h-[60px] rounded-full bg-[#6b2fa0] text-white font-semibold text-lg flex items-center justify-center focus:outline-none"
        aria-label="Menu utilisateur"
      >
        {{ auth.user?.email?.charAt(0).toUpperCase() ?? '?' }}
      </button>

      <!-- Dropdown conditionnel par rôle -->
      <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 hidden group-focus-within:block z-50">
        <RouterLink
          v-if="auth.hasRole('RESPONSABLE')"
          to="/dashboard"
          class="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
        >
          <span>✏️</span> Mes articles
        </RouterLink>
        <RouterLink
          v-if="auth.hasRole('SUPER_ADMIN')"
          to="/dashboard/global"
          class="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
        >
          <span>📊</span> Dashboard global
        </RouterLink>
        <hr class="border-gray-100" />
        <button
          @click="logout"
          class="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
        >
          <span>↩</span> Déconnexion
        </button>
      </div>
    </div>
  </header>
</template>
