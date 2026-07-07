<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import type { Article } from '@/types'

const api = useApi()
const articles = ref<Article[]>([])
const loading = ref(false)
const filterService = ref<string>('all')

onMounted(async () => {
  loading.value = true
  try {
    articles.value = await api.get<Article[]>('/admin/articles')
  } finally {
    loading.value = false
  }
})

const services = computed(() => {
  const map = new Map<string, string>()
  articles.value.forEach(a => map.set(a.service.slug, a.service.name))
  return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }))
})

const stats = computed(() => ({
  total: articles.value.length,
  published: articles.value.filter(a => a.status === 'PUBLISHED').length,
  draft: articles.value.filter(a => a.status === 'DRAFT').length,
  services: services.value.length,
}))

const filtered = computed(() =>
  filterService.value === 'all'
    ? articles.value
    : articles.value.filter(a => a.service.slug === filterService.value)
)

const serviceIcons: Record<string, string> = {
  it: '💻', csm: '🤝', sales: '📈', marketing: '🎨', rh: '👥', direction: '🧭',
}
</script>

<template>
  <div class="min-h-full bg-[#fafafa]">
    <div class="max-w-[1200px] mx-auto w-full px-8 py-10">

      <!-- Header -->
      <div class="mb-10">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
        <h1 class="text-3xl font-semibold text-gray-900">Vision globale</h1>
        <p class="text-gray-400 mt-1 text-sm">Lecture seule · tous les services</p>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-4 gap-5 mb-10">
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p class="text-3xl font-bold text-gray-900">{{ stats.total }}</p>
          <p class="text-sm text-gray-400 mt-1">Articles au total</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p class="text-3xl font-bold text-green-600">{{ stats.published }}</p>
          <p class="text-sm text-gray-400 mt-1">Publiés</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p class="text-3xl font-bold text-amber-500">{{ stats.draft }}</p>
          <p class="text-sm text-gray-400 mt-1">Brouillons</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p class="text-3xl font-bold text-[#6b2fa0]">{{ stats.services }}</p>
          <p class="text-sm text-gray-400 mt-1">Services actifs</p>
        </div>
      </div>

      <!-- Répartition par service -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Articles par service</h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="s in services"
            :key="s.slug"
            @click="filterService = filterService === s.slug ? 'all' : s.slug"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              filterService === s.slug
                ? 'bg-[#6b2fa0] text-white border-[#6b2fa0]'
                : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-[#6b2fa0] hover:text-[#6b2fa0]'
            ]"
          >
            <span>{{ serviceIcons[s.slug] ?? '📄' }}</span>
            {{ s.name }}
            <span :class="['text-xs px-1.5 py-0.5 rounded-full font-semibold', filterService === s.slug ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500']">
              {{ articles.filter(a => a.service.slug === s.slug).length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <template v-if="loading">
          <div v-for="i in 8" :key="i" class="h-14 bg-gray-50 animate-pulse border-b border-gray-100" />
        </template>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Titre</th>
              <th class="text-left px-4 py-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Service</th>
              <th class="text-left px-4 py-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Auteur</th>
              <th class="text-left px-4 py-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Statut</th>
              <th class="text-left px-4 py-4 font-medium text-gray-500 text-xs uppercase tracking-wide">Modifié</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="article in filtered"
              :key="article.id"
              class="border-b border-gray-50 hover:bg-[#faf6ff] transition-colors"
            >
              <td class="px-6 py-4">
                <RouterLink
                  :to="`/article/${article.id}`"
                  class="font-medium text-gray-900 hover:text-[#6b2fa0] transition-colors"
                >
                  {{ article.title }}
                </RouterLink>
                <p v-if="article.tags.length" class="text-xs text-gray-400 mt-0.5">
                  {{ article.tags.join(' · ') }}
                </p>
              </td>
              <td class="px-4 py-4">
                <span class="flex items-center gap-1.5 text-gray-600">
                  {{ serviceIcons[article.service.slug] ?? '📄' }}
                  {{ article.service.name }}
                </span>
              </td>
              <td class="px-4 py-4 text-gray-400 text-xs">
                {{ article.author.email.split('@')[0] }}
              </td>
              <td class="px-4 py-4">
                <span
                  :class="article.status === 'PUBLISHED'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'"
                  class="px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  {{ article.status === 'PUBLISHED' ? 'Publié' : 'Brouillon' }}
                </span>
              </td>
              <td class="px-4 py-4 text-gray-400 text-xs">
                {{ new Date(article.updatedAt).toLocaleDateString('fr-FR') }}
              </td>
            </tr>
          </tbody>
        </table>

        <p v-if="!loading && filtered.length === 0" class="text-center text-gray-400 py-12 text-sm">
          Aucun article pour ce filtre.
        </p>
      </div>
    </div>
  </div>
</template>
