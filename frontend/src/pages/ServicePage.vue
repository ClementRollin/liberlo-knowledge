<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '@/composables/useApi'
import type { Article, Service } from '@/types'

const PAGE_SIZE = 12

const route = useRoute()
const api = useApi()

const service = ref<Service | null>(null)
const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)

const totalPages = computed(() => Math.ceil(articles.value.length / PAGE_SIZE))
const paginated = computed(() =>
  articles.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)

async function load(slug: string) {
  loading.value = true
  error.value = null
  page.value = 1
  try {
    const data = await api.get<{ service: Service; articles: Article[] }>(`/services/${slug}/articles`)
    service.value = data.service
    articles.value = data.articles
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les articles.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, (slug) => load(slug as string), { immediate: true })
</script>

<template>
  <!-- Maquette Figma : frame "Recherche par service" (31:644) -->
  <div class="min-h-full bg-white">
    <div class="px-12 py-10">
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

      <!-- Error -->
      <div v-else-if="error" class="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
        <p class="text-red-700 text-sm font-medium">{{ error }}</p>
        <button
          class="mt-3 text-xs text-red-600 underline hover:no-underline"
          @click="load(route.params.slug as string)"
        >Réessayer</button>
      </div>

      <!-- Articles grid — Figma: section.listArticle -->
      <template v-else>
        <div class="grid grid-cols-2 gap-6">
          <RouterLink
            v-for="article in paginated"
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

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
          <button
            :disabled="page === 1"
            class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            @click="page--"
          >&larr;</button>
          <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
          <button
            :disabled="page === totalPages"
            class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            @click="page++"
          >&rarr;</button>
        </div>
      </template>
    </div>
  </div>
</template>
