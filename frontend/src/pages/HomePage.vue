<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConversationsStore } from '@/stores/conversations'

const router = useRouter()
const convsStore = useConversationsStore()

const query = ref('')
const loading = ref(false)

async function search() {
  const q = query.value.trim()
  if (!q || loading.value) return
  loading.value = true
  try {
    const id = await convsStore.create(q)
    router.push({ name: 'conversation', params: { id } })
  } finally {
    loading.value = false
  }
}

const services = [
  { name: 'IT', slug: 'it', description: 'Infrastructure, outils et support technique', icon: '💻', color: 'from-blue-50 to-indigo-50', border: 'border-blue-100', iconBg: 'bg-blue-100' },
  { name: 'CSM', slug: 'csm', description: 'Suivi praticiens, support et fidélisation', icon: '🤝', color: 'from-green-50 to-emerald-50', border: 'border-green-100', iconBg: 'bg-green-100' },
  { name: 'Sales', slug: 'sales', description: 'Acquisition, pitch et process commercial', icon: '📈', color: 'from-orange-50 to-amber-50', border: 'border-orange-100', iconBg: 'bg-orange-100' },
  { name: 'Marketing', slug: 'marketing', description: 'Marque, contenus et acquisition organique', icon: '🎨', color: 'from-pink-50 to-rose-50', border: 'border-pink-100', iconBg: 'bg-pink-100' },
  { name: 'RH', slug: 'rh', description: 'Recrutement, onboarding et politique RH', icon: '👥', color: 'from-purple-50 to-violet-50', border: 'border-purple-100', iconBg: 'bg-purple-100' },
  { name: 'Direction', slug: 'direction', description: 'Stratégie, OKR et gouvernance', icon: '🧭', color: 'from-slate-50 to-gray-100', border: 'border-slate-200', iconBg: 'bg-slate-200' },
]
</script>

<template>
  <div class="flex flex-col items-center pb-16 min-h-full">

    <!-- Titre -->
    <div class="flex flex-col items-center mt-16 lg:mt-[120px] gap-4 max-w-[560px] px-6 text-center">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
        Que cherchez-vous ?
      </h1>
      <p class="text-gray-400 text-lg">
        Retrouvez toutes les infos internes de Liberlo en quelques mots.
      </p>
    </div>

    <!-- Search bar -->
    <form @submit.prevent="search" class="mt-10 w-full max-w-[740px] px-6">
      <div class="flex items-center h-[68px] border border-gray-200 rounded-2xl px-6 gap-4 shadow-sm focus-within:border-[#6b2fa0] focus-within:shadow-[0_0_0_3px_rgba(107,47,160,0.08)] transition-all">
        <svg class="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="Rechercher une procédure, un produit, une info…"
          class="flex-1 text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent"
          autofocus
          :disabled="loading"
          @keyup.enter="search"
        />
        <button
          v-if="query"
          type="submit"
          :disabled="loading"
          class="shrink-0 px-5 py-2 rounded-xl bg-[#6b2fa0] text-white text-sm font-medium hover:bg-[#5a2787] disabled:opacity-60 transition-colors"
        >
          {{ loading ? '…' : 'Rechercher' }}
        </button>
      </div>
    </form>

    <!-- Services grid -->
    <section class="mt-14 w-full max-w-[1100px] px-6">
      <p class="text-xs font-semibold uppercase tracking-widest text-gray-300 text-center mb-8">
        Parcourir par service
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <RouterLink
          v-for="service in services"
          :key="service.slug"
          :to="`/service/${service.slug}`"
          :class="['group rounded-2xl border p-6 bg-gradient-to-br hover:shadow-md transition-all duration-200', service.color, service.border]"
        >
          <div class="flex items-start gap-4">
            <span :class="['text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0', service.iconBg]">
              {{ service.icon }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 text-base group-hover:text-[#6b2fa0] transition-colors">
                {{ service.name }}
              </p>
              <p class="text-sm text-gray-500 mt-1 leading-snug">{{ service.description }}</p>
            </div>
            <svg class="w-4 h-4 text-gray-300 group-hover:text-[#6b2fa0] shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
