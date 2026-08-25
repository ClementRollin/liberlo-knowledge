<template>
  <div class="max-w-4xl mx-auto">
    <!-- Stepper -->
    <div class="flex items-center gap-0 mb-10">
      <div
        v-for="(label, i) in stepLabels"
        :key="i"
        class="flex items-center flex-1 last:flex-none"
      >
        <div class="flex items-center gap-2 shrink-0">
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
            :class="
              i < step
                ? 'bg-[#6b2fa0] text-white'
                : i === step
                  ? 'bg-[#6b2fa0] text-white ring-4 ring-purple-100'
                  : 'bg-gray-100 text-gray-400'
            "
          >
            <span v-if="i < step">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span
            class="text-sm font-medium hidden sm:block"
            :class="i <= step ? 'text-gray-900' : 'text-gray-400'"
          >
            {{ label }}
          </span>
        </div>
        <div
          v-if="i < stepLabels.length - 1"
          class="flex-1 h-px mx-3 transition-colors"
          :class="i < step ? 'bg-[#6b2fa0]' : 'bg-gray-200'"
        />
      </div>
    </div>

    <!-- Étape 1 — Choisir la source -->
    <template v-if="step === 0">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Choisir la source</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <!-- Google Drive -->
        <button
          class="group border-2 rounded-2xl p-6 text-left transition-all"
          :class="
            source === 'drive'
              ? 'border-[#6b2fa0] bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          "
          @click="source = 'drive'"
        >
          <div class="text-3xl mb-3">📁</div>
          <div class="font-semibold text-gray-900 mb-1">Google Drive</div>
          <div class="text-sm text-gray-500">Documents Google, fichiers texte et Markdown</div>
          <div
            class="mt-3 text-xs font-medium"
            :class="settings?.driveConnected ? 'text-green-600' : 'text-orange-500'"
          >
            {{ settings?.driveConnected ? '✓ Connecté' : '⚠ Non connecté' }}
          </div>
        </button>

        <!-- Confluence -->
        <button
          class="group border-2 rounded-2xl p-6 text-left transition-all"
          :class="
            source === 'confluence'
              ? 'border-[#6b2fa0] bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          "
          @click="source = 'confluence'"
        >
          <div class="text-3xl mb-3">📄</div>
          <div class="font-semibold text-gray-900 mb-1">Confluence</div>
          <div class="text-sm text-gray-500">Pages et espaces Confluence Atlassian</div>
          <div
            class="mt-3 text-xs font-medium"
            :class="settings?.confluenceConnected ? 'text-green-600' : 'text-orange-500'"
          >
            {{ settings?.confluenceConnected ? '✓ Connecté' : '⚠ Non connecté' }}
          </div>
        </button>
      </div>

      <!-- Connexion Google Drive -->
      <div
        v-if="source === 'drive' && !settings?.driveConnected"
        class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6"
      >
        <p class="text-sm text-blue-700 mb-3">
          Connectez votre compte Google pour accéder aux fichiers Drive.
        </p>
        <a
          :href="driveAuthUrl"
          class="inline-block bg-[#6b2fa0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors"
        >
          Autoriser l'accès Google Drive
        </a>
      </div>

      <!-- Config Confluence -->
      <div
        v-if="source === 'confluence' && !settings?.confluenceConnected"
        class="border border-gray-200 rounded-xl p-5 mb-6 space-y-3"
      >
        <p class="text-sm font-medium text-gray-700">Configuration Confluence</p>
        <input
          v-model="confluenceForm.baseUrl"
          type="url"
          placeholder="https://votre-domaine.atlassian.net"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
        />
        <input
          v-model="confluenceForm.email"
          type="email"
          placeholder="email@liberlo.com"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
        />
        <input
          v-model="confluenceForm.token"
          type="password"
          placeholder="Token API Atlassian"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
        />
        <button
          class="bg-[#6b2fa0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-50"
          :disabled="isSavingSettings"
          @click="saveConfluenceSettings"
        >
          {{ isSavingSettings ? 'Enregistrement…' : 'Enregistrer et tester' }}
        </button>
      </div>

      <div class="flex justify-end">
        <button
          class="bg-[#6b2fa0] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-40 transition-colors"
          :disabled="
            !source ||
            (source === 'drive' && !settings?.driveConnected) ||
            (source === 'confluence' && !settings?.confluenceConnected)
          "
          @click="goToStep1"
        >
          Suivant →
        </button>
      </div>
    </template>

    <!-- Étape 2 — Sélectionner les documents -->
    <template v-else-if="step === 1">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Sélectionner les documents</h2>
        <span class="text-sm text-gray-500">{{ selectedFiles.length }} sélectionné(s)</span>
      </div>

      <div v-if="isLoadingFiles" class="space-y-2">
        <div v-for="n in 6" :key="n" class="h-12 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      <EmptyState
        v-else-if="files.length === 0"
        icon="📂"
        title="Aucun document trouvé"
        description="Vérifiez votre connexion et les permissions d'accès."
      />

      <div v-else class="border border-gray-200 rounded-2xl overflow-hidden mb-6">
        <div class="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <input
            type="checkbox"
            :checked="selectedFiles.length === files.length"
            :indeterminate="selectedFiles.length > 0 && selectedFiles.length < files.length"
            class="rounded"
            @change="toggleAll"
          />
          <span class="text-sm font-medium text-gray-600">Tout sélectionner</span>
        </div>
        <div class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          <label
            v-for="file in files"
            :key="file.id"
            class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="file"
              v-model="selectedFiles"
              class="rounded"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-800 truncate">{{ file.name }}</div>
              <div class="text-xs text-gray-400">
                Modifié le {{ new Date(file.modifiedAt).toLocaleDateString('fr-FR') }}
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="flex justify-between">
        <button class="text-sm text-gray-500 hover:text-gray-700" @click="step = 0">← Retour</button>
        <button
          class="bg-[#6b2fa0] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-40 transition-colors"
          :disabled="selectedFiles.length === 0 || isAnalyzing"
          @click="analyzeSelected"
        >
          {{ isAnalyzing ? `Analyse en cours (${analysisProgress}/${selectedFiles.length})…` : `Analyser ${selectedFiles.length} document(s) →` }}
        </button>
      </div>
    </template>

    <!-- Étape 3 — Review des suggestions -->
    <template v-else-if="step === 2">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Vérifier les suggestions</h2>

      <div class="border border-gray-200 rounded-2xl overflow-x-auto mb-6">
        <table class="w-full text-sm min-w-[640px]">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 text-gray-500 font-medium">Titre</th>
              <th class="text-left px-4 py-3 text-gray-500 font-medium">Service suggéré</th>
              <th class="text-left px-4 py-3 text-gray-500 font-medium">Confiance</th>
              <th class="text-left px-4 py-3 text-gray-500 font-medium">Tags</th>
              <th class="px-4 py-3 text-gray-500 font-medium text-center">Inclure</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(item, i) in analysisResults"
              :key="i"
              :class="item.confidence < 0.8 ? 'bg-orange-50/50' : ''"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800 truncate max-w-48">{{ item.title }}</div>
                <div class="text-xs text-gray-400 truncate max-w-48">{{ item.summary }}</div>
              </td>
              <td class="px-4 py-3">
                <select
                  v-model="item.service"
                  class="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
                >
                  <option v-for="svc in SERVICES" :key="svc" :value="svc">{{ svc }}</option>
                </select>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="
                    item.confidence >= 0.8
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  "
                >
                  {{ Math.round(item.confidence * 100) }}%
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs max-w-36 truncate">
                {{ item.tags.join(', ') }}
              </td>
              <td class="px-4 py-3 text-center">
                <input type="checkbox" v-model="item.include" class="rounded" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-orange-600 mb-4" v-if="analysisResults.some((r) => r.confidence < 0.8)">
        ⚠ Les lignes en orange ont une confiance &lt; 80% — vérifiez le service assigné.
      </p>

      <div class="flex justify-between">
        <button class="text-sm text-gray-500 hover:text-gray-700" @click="step = 1">← Retour</button>
        <button
          class="bg-[#6b2fa0] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-40 transition-colors"
          :disabled="!analysisResults.some((r) => r.include)"
          @click="step = 3"
        >
          Confirmer {{ analysisResults.filter((r) => r.include).length }} document(s) →
        </button>
      </div>
    </template>

    <!-- Étape 4 — Confirmation -->
    <template v-else-if="step === 3">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Confirmer l'import</h2>
      <p class="text-sm text-gray-500 mb-6">
        {{ analysisResults.filter((r) => r.include).length }} article(s) seront créés en
        <strong>brouillon</strong>. Les responsables de chaque service devront les relire et les
        publier.
      </p>

      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
        Aucun article importé n'est publié automatiquement. La publication nécessite une validation humaine.
      </div>

      <template v-if="!importResult">
        <div class="flex justify-between">
          <button class="text-sm text-gray-500 hover:text-gray-700" @click="step = 2">← Retour</button>
          <button
            class="bg-[#6b2fa0] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-40 transition-colors"
            :disabled="isImporting"
            @click="runImport"
          >
            {{ isImporting ? 'Import en cours…' : 'Confirmer l\'import' }}
          </button>
        </div>
      </template>

      <div
        v-else
        class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3"
      >
        <h3 class="font-semibold text-gray-900">Résultat de l'import</h3>
        <div class="flex gap-6 text-sm">
          <div>
            <div class="text-2xl font-bold text-green-600">{{ importResult.created }}</div>
            <div class="text-gray-500">créés</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ importResult.updated }}</div>
            <div class="text-gray-500">mis à jour</div>
          </div>
          <div v-if="importResult.errors > 0">
            <div class="text-2xl font-bold text-red-500">{{ importResult.errors }}</div>
            <div class="text-gray-500">erreurs</div>
          </div>
        </div>
        <button
          class="mt-4 bg-[#6b2fa0] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-purple-800 transition-colors"
          @click="reset"
        >
          Nouvel import
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import EmptyState from '@/components/ui/EmptyState.vue'

const SERVICES = ['IT', 'CSM', 'Sales', 'Marketing', 'RH', 'Direction']

interface ImportSettings {
  driveConnected: boolean
  confluenceConnected: boolean
  confluenceBaseUrl: string | null
  confluenceEmail: string | null
}

interface FileItem {
  id: string
  name: string
  modifiedAt: string
  mimeType?: string
  webViewLink?: string
  webUrl?: string
}

interface AnalysisResultItem {
  title: string
  content: string
  summary: string
  service: string
  confidence: number
  tags: string[]
  sourceUrl: string
  include: boolean
}

interface ImportResult {
  created: number
  updated: number
  errors: number
}

const { get, post, put } = useApi()
const toast = useToast()

const step = ref(0)
const stepLabels = ['Source', 'Sélection', 'Review', 'Confirmation']

const source = ref<'drive' | 'confluence' | null>(null)
const settings = ref<ImportSettings | null>(null)
const driveAuthUrl = ref('')

const confluenceForm = ref({ baseUrl: '', email: '', token: '' })
const isSavingSettings = ref(false)

const files = ref<FileItem[]>([])
const selectedFiles = ref<FileItem[]>([])
const isLoadingFiles = ref(false)

const analysisResults = ref<AnalysisResultItem[]>([])
const isAnalyzing = ref(false)
const analysisProgress = ref(0)

const isImporting = ref(false)
const importResult = ref<ImportResult | null>(null)

onMounted(async () => {
  try {
    settings.value = await get<ImportSettings>('/import/settings')
    const { url } = await get<{ url: string }>('/import/drive/auth')
    driveAuthUrl.value = url
  } catch {
    // non-bloquant
  }
})

async function saveConfluenceSettings() {
  isSavingSettings.value = true
  try {
    await put('/import/settings', {
      confluenceBaseUrl: confluenceForm.value.baseUrl,
      confluenceEmail: confluenceForm.value.email,
      confluenceToken: confluenceForm.value.token,
    })
    settings.value = await get<ImportSettings>('/import/settings')
    toast.success('Configuration Confluence enregistrée.')
  } catch {
    toast.error('Erreur lors de l\'enregistrement.')
  } finally {
    isSavingSettings.value = false
  }
}

async function goToStep1() {
  step.value = 1
  isLoadingFiles.value = true
  files.value = []
  selectedFiles.value = []
  try {
    if (source.value === 'drive') {
      const raw = await get<{ id: string; name: string; mimeType: string; modifiedTime: string; webViewLink: string }[]>('/import/drive/files')
      files.value = raw.map(f => ({ id: f.id, name: f.name, modifiedAt: f.modifiedTime, mimeType: f.mimeType, webViewLink: f.webViewLink }))
    } else {
      const raw = await get<{ id: string; title: string; spaceKey: string; webUrl: string; lastModified: string }[]>('/import/confluence/pages')
      files.value = raw.map(p => ({ id: p.id, name: p.title, modifiedAt: p.lastModified, webUrl: p.webUrl }))
    }
  } catch {
    toast.error('Impossible de charger les documents.')
  } finally {
    isLoadingFiles.value = false
  }
}

function toggleAll() {
  selectedFiles.value =
    selectedFiles.value.length === files.value.length ? [] : [...files.value]
}

async function analyzeSelected() {
  isAnalyzing.value = true
  analysisProgress.value = 0
  analysisResults.value = []

  for (const file of selectedFiles.value) {
    try {
      let content = ''
      let sourceUrl = ''

      if (source.value === 'drive') {
        content = (await get<string>(`/import/drive/files/${file.id}/content?mimeType=${encodeURIComponent(file.mimeType ?? '')}`)) as unknown as string
        sourceUrl = file.webViewLink ?? ''
      } else {
        content = (await get<string>(`/import/confluence/pages/${file.id}/content`)) as unknown as string
        sourceUrl = file.webUrl ?? ''
      }

      const analysis = await post<{ service: string; confidence: number; summary: string; tags: string[] }>(
        '/import/analyze',
        { title: file.name, content, sourceUrl },
      )

      analysisResults.value.push({
        title: file.name,
        content,
        summary: analysis.summary,
        service: analysis.service,
        confidence: analysis.confidence,
        tags: analysis.tags,
        sourceUrl,
        include: true,
      })
    } catch {
      // skip failed files
    }
    analysisProgress.value++
  }

  isAnalyzing.value = false
  if (analysisResults.value.length > 0) {
    step.value = 2
  } else {
    toast.error('Aucun document n\'a pu être analysé.')
  }
}

async function runImport() {
  isImporting.value = true
  try {
    const items = analysisResults.value
      .filter((r) => r.include)
      .map((r) => ({
        title: r.title,
        content: r.content,
        summary: r.summary,
        serviceSlug: r.service.toLowerCase(),
        tags: r.tags,
        sourceUrl: r.sourceUrl || undefined,
      }))

    importResult.value = await post<ImportResult>('/import/confirm', { items })
    toast.success(`Import terminé : ${importResult.value.created} créé(s), ${importResult.value.updated} mis à jour.`)
  } catch {
    toast.error('Erreur lors de l\'import.')
  } finally {
    isImporting.value = false
  }
}

function reset() {
  step.value = 0
  source.value = null
  files.value = []
  selectedFiles.value = []
  analysisResults.value = []
  importResult.value = null
  analysisProgress.value = 0
}
</script>
