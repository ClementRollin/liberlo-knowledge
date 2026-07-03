<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useApi } from '@/composables/useApi'
import type { Article, Service } from '@/types'

const route = useRoute()
const api = useApi()

const service = ref<Service | null>(null)
const articles = ref<Article[]>([])
const loading = ref(false)

async function load(slug: string) {
  loading.value = true
  try {
    const data = await api.get<{ service: Service; articles: Article[] }>(`/services/${slug}/articles`)
    service.value = data.service
    articles.value = data.articles
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, (slug) => load(slug as string), { immediate: true })
</script>

<template>
  <!-- Maquette Figma : frame "Recherche par service" (31:644) -->
  <div class="min-h-screen flex flex-col bg-white">
    <AppHeader />

    <main class="flex-1 px-[164px] py-12">
      <RouterLink to="/" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Accueil
      </RouterLink>

      <h2 class="text-4xl font-semibold text-gray-900 mb-8">
        {{ service?.name ?? '...' }}
      </h2>
      <hr class="border-gray-100 mb-8" />

      <!-- Loading -->
      <template v-if="loading">
        <div v-for="i in 6" :key="i" class="h-24 rounded-2xl bg-gray-100 animate-pulse mb-4" />
      </template>

      <!-- Articles grid — Figma: section.listArticle -->
      <div v-else class="grid grid-cols-2 gap-6">
        <RouterLink
          v-for="article in articles"
          :key="article.id"
          :to="`/article/${article.id}`"
          class="border border-gray-100 rounded-2xl p-6 hover:shadow-sm transition-shadow"
        >
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
            >{{ tag }}</span>
          </div>
          <h3 class="text-base font-semibold text-gray-900">{{ article.title }}</h3>
          <p v-if="article.summary" class="mt-1 text-sm text-gray-500 line-clamp-2">{{ article.summary }}</p>
          <p class="mt-3 text-xs text-gray-400">
            {{ new Date(article.updatedAt).toLocaleDateString('fr-FR') }}
          </p>
        </RouterLink>

        <p v-if="articles.length === 0" class="col-span-2 text-center text-gray-400 py-12">
          Aucun article publié pour ce service.
        </p>
      </div>
    </main>
  </div>
</template>
