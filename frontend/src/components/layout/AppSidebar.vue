<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'

const auth = useAuthStore()
const convsStore = useConversationsStore()
const router = useRouter()
const route = useRoute()

const SERVICE_ICONS: Record<string, string> = {
  it: '💻',
  csm: '🤝',
  sales: '📈',
  marketing: '🎨',
  rh: '👥',
  direction: '🧭',
}

const userService = computed(() => auth.user?.service ?? null)
const serviceIcon = computed(() =>
  userService.value ? (SERVICE_ICONS[userService.value.slug] ?? '📁') : null,
)
const initials = computed(() => (auth.user?.email ?? '').charAt(0).toUpperCase())

onMounted(() => {
  if (auth.isAuthenticated) convsStore.fetchList().catch(() => {})
})

function logout() {
  auth.logout()
  convsStore.clear()
  router.push({ name: 'login' })
}

function isActiveConv(id: string) {
  return route.name === 'conversation' && route.params.id === id
}

async function deleteConv(id: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  await convsStore.remove(id)
  if (route.name === 'conversation' && route.params.id === id) {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <aside class="w-64 shrink-0 flex flex-col h-screen bg-[#140730] overflow-hidden select-none">

    <!-- En-tête -->
    <div class="px-3 pt-5 pb-2">
      <div class="px-2 mb-3">
        <span class="text-white/90 font-semibold text-sm tracking-wide">Liberlo KB</span>
      </div>
      <RouterLink
        to="/"
        class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.name === 'home'
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/70 hover:bg-white/10'"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle recherche
      </RouterLink>
    </div>

    <!-- Liste des conversations -->
    <div class="flex-1 overflow-y-auto px-3 py-2 min-h-0 scrollbar-thin scrollbar-thumb-white/10">
      <p class="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5">
        Récentes
      </p>

      <p v-if="convsStore.list.length === 0" class="px-2 py-2 text-white/25 text-xs italic">
        Aucune recherche encore
      </p>

      <div v-for="conv in convsStore.list" :key="conv.id" class="group relative mb-0.5">
        <RouterLink
          :to="`/conversations/${conv.id}`"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors pr-8 block"
          :class="isActiveConv(conv.id)
            ? 'bg-[#6b2fa0]/50 text-white'
            : 'text-white/65 hover:bg-white/10 hover:text-white/90'"
        >
          <svg class="w-3.5 h-3.5 shrink-0 opacity-50 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M21 16a2 2 0 01-2 2H5l-4 4V5a2 2 0 012-2h16a2 2 0 012 2v11z" />
          </svg>
          <span class="truncate text-xs leading-5">{{ conv.title }}</span>
        </RouterLink>
        <button
          @click="deleteConv(conv.id, $event)"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
          title="Supprimer"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bas de sidebar : service + user -->
    <div class="px-3 pb-4 pt-2 border-t border-white/[0.08] space-y-1">

      <!-- Accès rapide au service -->
      <RouterLink
        v-if="userService"
        :to="`/service/${userService.slug}`"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.params.slug === userService.slug
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/80'"
      >
        <span class="text-base leading-none flex-none">{{ serviceIcon }}</span>
        <span class="truncate text-xs">{{ userService.name }}</span>
        <svg class="w-3 h-3 ml-auto opacity-30 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </RouterLink>

      <!-- Dashboard RESPONSABLE -->
      <RouterLink
        v-if="auth.hasRole('RESPONSABLE')"
        to="/dashboard"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.path.startsWith('/dashboard') && !route.path.includes('global')
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/80'"
      >
        <svg class="w-3.5 h-3.5 flex-none opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span class="text-xs">Mes articles</span>
      </RouterLink>

      <!-- Dashboard global SUPER_ADMIN -->
      <RouterLink
        v-if="auth.hasRole('SUPER_ADMIN')"
        to="/dashboard/global"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.path === '/dashboard/global'
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/80'"
      >
        <svg class="w-3.5 h-3.5 flex-none opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-xs">Dashboard global</span>
      </RouterLink>

      <!-- Gestion utilisateurs SUPER_ADMIN -->
      <RouterLink
        v-if="auth.hasRole('SUPER_ADMIN')"
        to="/admin/users"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.path === '/admin/users'
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/80'"
      >
        <svg class="w-3.5 h-3.5 flex-none opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span class="text-xs">Utilisateurs</span>
      </RouterLink>

      <!-- Import SUPER_ADMIN -->
      <RouterLink
        v-if="auth.hasRole('SUPER_ADMIN')"
        to="/admin/import"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.path === '/admin/import'
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/80'"
      >
        <svg class="w-3.5 h-3.5 flex-none opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span class="text-xs">Import</span>
      </RouterLink>

      <!-- Profil -->
      <RouterLink
        to="/profile"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="route.path === '/profile'
          ? 'bg-[#6b2fa0]/50 text-white'
          : 'text-white/55 hover:bg-white/10 hover:text-white/80'"
      >
        <svg class="w-3.5 h-3.5 flex-none opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-xs">Mon profil</span>
      </RouterLink>

      <!-- User -->
      <div class="flex items-center gap-2.5 px-3 py-2 mt-1">
        <div class="w-6 h-6 rounded-full bg-[#6b2fa0] flex items-center justify-center text-white text-[10px] font-bold flex-none">
          {{ initials }}
        </div>
        <span class="text-white/50 text-xs truncate flex-1 min-w-0">{{ auth.user?.email }}</span>
        <button
          @click="logout"
          title="Déconnexion"
          class="text-white/25 hover:text-white/70 transition-colors flex-none"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
