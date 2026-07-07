<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { Article } from '@/types'

const api = useApi()
const auth = useAuthStore()

const articles = ref<Article[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    articles.value = await api.get<Article[]>('/articles')
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
          Mes articles — {{ auth.user?.serviceId ? 'Service' : '' }}
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

      <table v-else class="w-full text-sm">
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
          <tr v-for="article in articles" :key="article.id" class="border-b border-gray-50 hover:bg-gray-50">
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

      <p v-if="!loading && articles.length === 0" class="text-center text-gray-400 py-12">
        Aucun article pour votre service.
      </p>
    </div>
  </div>
</template>
