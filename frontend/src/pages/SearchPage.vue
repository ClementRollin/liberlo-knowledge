<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useApi } from '@/composables/useApi'
import type { SearchResult } from '@/types'

const route = useRoute()
const router = useRouter()
const api = useApi()

const query = ref((route.query.q as string) ?? '')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function performSearch(q: string) {
  if (!q.trim()) return
  loading.value = true
  error.value = null
  try {
    results.value = await api.post<SearchResult[]>('/search', { query: q })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

watch(() => route.query.q, (q) => {
  query.value = (q as string) ?? ''
  performSearch(query.value)
}, { immediate: true })

function search() {
  if (query.value.trim()) {
    router.push({ name: 'search', query: { q: query.value.trim() } })
  }
}
</script>

<template>
  <!-- Maquette Figma : frame "Résultat de recherche" (13:117) -->
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />

    <main class="flex-1 flex flex-col items-center px-8 py-12">
      <!-- Retour -->
      <div class="w-full max-w-[1200px] mb-2">
        <RouterLink to="/" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Accueil
        </RouterLink>
      </div>

      <!-- Search bar -->
      <div class="w-[740px] max-w-full">
        <form @submit.prevent="search" class="flex items-center h-[76px] border border-gray-200 rounded-2xl px-6 gap-4">
          <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="query"
            type="text"
            class="flex-1 text-base text-gray-900 outline-none bg-transparent"
            @keyup.enter="search"
          />
        </form>
        <hr class="mt-4 border-gray-100" />
      </div>

      <!-- Results -->
      <section class="mt-8 w-[1200px] max-w-full">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <div v-for="i in 4" :key="i" class="h-24 rounded-2xl bg-gray-100 animate-pulse mb-4" />
        </template>

        <!-- Error -->
        <p v-else-if="error" class="text-center text-red-500">{{ error }}</p>

        <!-- Empty -->
        <p v-else-if="results.length === 0 && query" class="text-center text-gray-400">
          Aucun résultat pour « {{ query }} »
        </p>

        <!-- Results list -->
        <RouterLink
          v-else
          v-for="item in results"
          :key="item.id"
          :to="`/article/${item.id}`"
          class="block border border-gray-100 rounded-2xl p-6 mb-4 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ item.title }}</h2>
              <p v-if="item.summary" class="mt-1 text-sm text-gray-500 line-clamp-2">{{ item.summary }}</p>
            </div>
            <span class="shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {{ item.service.name }}
            </span>
          </div>
          <p class="mt-3 text-xs text-gray-400">
            {{ item.author.email }} · {{ new Date(item.updatedAt).toLocaleDateString('fr-FR') }}
          </p>
        </RouterLink>
      </section>
    </main>
  </div>
</template>
