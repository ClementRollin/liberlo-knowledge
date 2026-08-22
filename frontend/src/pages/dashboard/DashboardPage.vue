<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { Article } from '@/types'

const PAGE_SIZE = 10

const api = useApi()
const auth = useAuthStore()

const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)

const totalPages = computed(() => Math.ceil(articles.value.length / PAGE_SIZE))
const paginated = computed(() =>
  articles.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)

const serviceName = computed(() => auth.user?.service?.name ?? auth.user?.serviceId ?? '')

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    articles.value = await api.get<Article[]>('/articles')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger vos articles.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <!-- Dashboard RESPONSABLE — route /dashboard -->
  <div class="min-h-full bg-white">
    <div class="px-12 py-10">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">
          Mes articles<span v-if="serviceName"> — {{ serviceName }}</span>
        </h1>
        <RouterLink
          to="/dashboard/new"
          class="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Nouvel article
        </RouterLink>
      </div>

      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="h-16 bg-gray-100 animate-pulse rounded-xl mb-3" />
      </template>

      <!-- Error -->
      <div v-else-if="error" class="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
        <p class="text-red-700 text-sm font-medium">{{ error }}</p>
      </div>

      <template v-else>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-3 font-medium">Titre</th>
              <th class="pb-3 font-medium">Tags</th>
              <th class="pb-3 font-medium">Statut</th>
              <th class="pb-3 font-medium">Modifié le</th>
              <th class="pb-3" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in paginated" :key="article.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-4 font-medium text-gray-900">{{ article.title }}</td>
              <td class="py-4 text-gray-500">{{ article.tags.join(', ') }}</td>
              <td class="py-4">
                <span
                  :class="article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ article.status === 'PUBLISHED' ? 'Publié' : 'Brouillon' }}
                </span>
              </td>
              <td class="py-4 text-gray-500">{{ new Date(article.updatedAt).toLocaleDateString('fr-FR') }}</td>
              <td class="py-4 text-right flex items-center gap-3 justify-end">
                <RouterLink :to="`/dashboard/edit/${article.id}`" class="text-[#6b2fa0] hover:underline text-xs">Modifier</RouterLink>
                <RouterLink :to="`/article/${article.id}`" class="text-gray-400 hover:text-gray-700 text-xs">Voir</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-if="articles.length === 0" class="text-center text-gray-400 py-12">
          Aucun article pour votre service.
        </p>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
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
