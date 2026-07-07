<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownContent from '@/components/ui/MarkdownContent.vue'
import { useApi } from '@/composables/useApi'
import type { Article } from '@/types'

const route = useRoute()
const router = useRouter()
const api = useApi()

const article = ref<Article | null>(null)
const loading = ref(false)

watch(() => route.params.id, async (id) => {
  loading.value = true
  try {
    article.value = await api.get<Article>(`/articles/${id}`)
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <!-- Maquette Figma : frame "Fiche d'infos" (30:554) -->
  <div class="min-h-full bg-white">

    <div class="max-w-[900px] mx-auto w-full px-8 py-10">

      <!-- Retour -->
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <!-- Skeleton -->
      <template v-if="loading">
        <div class="h-10 w-2/3 bg-gray-100 animate-pulse rounded mb-4" />
        <div class="h-px bg-gray-100 mb-4" />
        <div class="flex gap-2 mb-8">
          <div v-for="i in 3" :key="i" class="h-8 w-24 bg-gray-100 animate-pulse rounded-full" />
        </div>
        <div class="h-64 bg-gray-100 animate-pulse rounded-2xl" />
      </template>

      <template v-else-if="article">
        <!-- Title — Figma: section.title (30:647) -->
        <div class="mb-8">
          <h1 class="text-4xl font-semibold text-gray-900">{{ article.title }}</h1>
          <hr class="my-6 border-gray-100" />

          <!-- Badges — Figma: section.badges (30:649) -->
          <div class="flex flex-wrap gap-3 mb-4">
            <span class="px-4 py-2 rounded-full bg-[#f0e6ff] text-[#6b2fa0] text-sm font-medium">
              {{ article.service.name }}
            </span>
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600"
            >{{ tag }}</span>
          </div>

          <!-- Author — Figma: div.writer (31:640) -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#6b2fa0] text-white flex items-center justify-center text-sm font-semibold">
              {{ article.author.email.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm text-gray-500">
              {{ article.author.email }} ·
              Mis à jour le {{ new Date(article.updatedAt).toLocaleDateString('fr-FR') }}
            </span>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="article.summary" class="bg-[#f9f6ff] border border-[#e9d8ff] rounded-2xl p-6 mb-8">
          <p class="text-base text-gray-700 leading-relaxed italic">{{ article.summary }}</p>
        </div>

        <!-- Content — rendu markdown -->
        <MarkdownContent :content="article.content" />
      </template>
    </div>
  </div>
</template>
