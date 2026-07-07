<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownContent from '@/components/ui/MarkdownContent.vue'
import { useApi } from '@/composables/useApi'
import type { Article } from '@/types'

const route = useRoute()
const router = useRouter()
const api = useApi()

const articleId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!articleId.value)

const title = ref('')
const summary = ref('')
const content = ref('')
const tagsInput = ref('')
const status = ref<'DRAFT' | 'PUBLISHED'>('DRAFT')
const preview = ref(false)

const saving = ref(false)
const error = ref<string | null>(null)

// Chargement en mode édition
onMounted(async () => {
  if (!isEdit.value) return
  try {
    const a = await api.get<Article>(`/articles/${articleId.value}`)
    title.value = a.title
    summary.value = a.summary ?? ''
    content.value = a.content
    tagsInput.value = a.tags.join(', ')
    status.value = a.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  } catch {
    error.value = 'Impossible de charger l\'article.'
  }
})

async function save() {
  if (!title.value.trim() || !content.value.trim()) {
    error.value = 'Le titre et le contenu sont obligatoires.'
    return
  }
  saving.value = true
  error.value = null
  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  const payload = { title: title.value, summary: summary.value, content: content.value, tags, status: status.value }
  try {
    if (isEdit.value) {
      await api.patch(`/articles/${articleId.value}`, payload)
    } else {
      await api.post('/articles', payload)
    }
    router.push({ name: 'dashboard' })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-full bg-[#fafafa]">
    <div class="max-w-[900px] mx-auto w-full px-8 py-10">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <button
            @click="router.back()"
            class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <h1 class="text-2xl font-semibold text-gray-900">
            {{ isEdit ? 'Modifier l\'article' : 'Nouvel article' }}
          </h1>
        </div>

        <!-- Aperçu toggle -->
        <button
          @click="preview = !preview"
          class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#6b2fa0] hover:text-[#6b2fa0] transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {{ preview ? 'Éditer' : 'Aperçu' }}
        </button>
      </div>

      <p v-if="error" class="mb-4 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{{ error }}</p>

      <!-- Formulaire -->
      <div v-if="!preview" class="space-y-5">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <!-- Titre -->
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">Titre *</label>
            <input
              v-model="title"
              type="text"
              placeholder="Ex : Guide d'onboarding technique"
              class="w-full text-xl font-semibold text-gray-900 outline-none border-b border-gray-100 pb-3 focus:border-[#6b2fa0] transition-colors bg-transparent placeholder:text-gray-200"
            />
          </div>

          <!-- Résumé -->
          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">Résumé (intro)</label>
            <textarea
              v-model="summary"
              rows="2"
              placeholder="Une phrase qui résume l'article (affiché dans la recherche)"
              class="w-full text-sm text-gray-700 outline-none resize-none border border-gray-100 rounded-xl p-3 focus:border-[#6b2fa0] transition-colors placeholder:text-gray-300"
            />
          </div>
        </div>

        <!-- Contenu markdown -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">
            Contenu * <span class="font-normal text-gray-300 normal-case tracking-normal">— Markdown supporté</span>
          </label>
          <textarea
            v-model="content"
            rows="18"
            placeholder="## Section&#10;&#10;Votre contenu ici...&#10;&#10;- Liste&#10;- d'éléments&#10;&#10;**Gras**, *italique*, `code`"
            class="w-full text-sm text-gray-700 font-mono outline-none resize-y border border-gray-100 rounded-xl p-4 focus:border-[#6b2fa0] transition-colors placeholder:text-gray-200 leading-relaxed"
          />
        </div>

        <!-- Tags + statut -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-6">
          <div class="flex-1">
            <label class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">Tags</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="onboarding, procédure, accès"
              class="w-full text-sm text-gray-700 outline-none border border-gray-100 rounded-xl px-4 py-3 focus:border-[#6b2fa0] transition-colors placeholder:text-gray-300"
            />
            <p class="text-xs text-gray-300 mt-1">Séparés par des virgules</p>
          </div>

          <div>
            <label class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">Statut</label>
            <select
              v-model="status"
              class="text-sm text-gray-700 outline-none border border-gray-100 rounded-xl px-4 py-3 focus:border-[#6b2fa0] transition-colors bg-white"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button
            @click="router.back()"
            class="px-5 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            @click="save"
            :disabled="saving"
            class="px-8 py-3 rounded-xl bg-[#6b2fa0] text-white text-sm font-medium hover:bg-[#5a2787] transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Publier' }}
          </button>
        </div>
      </div>

      <!-- Aperçu markdown -->
      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 class="text-3xl font-semibold text-gray-900 mb-2">{{ title || 'Sans titre' }}</h1>
        <p v-if="summary" class="text-gray-400 italic mb-6 text-sm">{{ summary }}</p>
        <hr class="border-gray-100 mb-6" />
        <MarkdownContent v-if="content" :content="content" />
        <p v-else class="text-gray-300 text-sm">Aucun contenu à prévisualiser.</p>
      </div>

    </div>
  </div>
</template>
