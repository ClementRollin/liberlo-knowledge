<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConversationsStore } from '@/stores/conversations'
import type { SearchResult } from '@/types'

const route = useRoute()
const convsStore = useConversationsStore()

const query = ref('')
const sending = ref(false)
const messagesEnd = ref<HTMLElement | null>(null)

const conversation = computed(() => convsStore.active)
const loading = computed(() => convsStore.loading)

watch(
  () => route.params.id as string,
  async (id) => {
    if (id) await convsStore.fetchOne(id)
    await nextTick()
    scrollToBottom()
  },
  { immediate: true },
)

function scrollToBottom() {
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

async function send() {
  const q = query.value.trim()
  if (!q || sending.value) return
  const id = route.params.id as string
  sending.value = true
  query.value = ''
  try {
    await convsStore.addMessage(id, q)
    await nextTick()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

function getResults(msg: { results: SearchResult[] | null }) {
  return msg.results ?? []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="space-y-3 w-full max-w-2xl px-6">
        <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>

    <!-- Messages -->
    <div v-else-if="conversation" class="flex-1 overflow-y-auto">
      <div class="max-w-3xl mx-auto px-6 py-8 space-y-8">

        <div v-for="msg in conversation.messages" :key="msg.id">

          <!-- Message utilisateur -->
          <div v-if="msg.role === 'USER'" class="flex justify-end">
            <div class="max-w-[80%] bg-[#6b2fa0] text-white rounded-2xl rounded-tr-sm px-4 py-3">
              <p class="text-sm leading-relaxed">{{ msg.content }}</p>
            </div>
          </div>

          <!-- Réponse assistant -->
          <div v-else class="space-y-3">
            <p class="text-xs text-gray-400 font-medium flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-[#6b2fa0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ msg.content }}
            </p>

            <!-- Résultats de recherche -->
            <template v-if="getResults(msg).length > 0">
              <RouterLink
                v-for="result in getResults(msg)"
                :key="result.id"
                :to="`/article/${result.id}`"
                class="block border border-gray-100 rounded-xl p-4 hover:border-[#6b2fa0]/30 hover:shadow-sm transition-all group"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-gray-900 group-hover:text-[#6b2fa0] transition-colors truncate">
                      {{ result.title }}
                    </h3>
                    <p v-if="result.summary" class="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {{ result.summary }}
                    </p>
                  </div>
                  <span class="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0e6ff] text-[#6b2fa0]">
                    {{ result.service.name }}
                  </span>
                </div>
                <p class="mt-2 text-[10px] text-gray-400">
                  {{ result.author.email }} · {{ formatDate(result.updatedAt) }}
                </p>
              </RouterLink>
            </template>

            <p v-else class="text-sm text-gray-400 italic">
              Aucun résultat trouvé pour cette recherche.
            </p>
          </div>
        </div>

        <!-- Spinner pendant l'envoi -->
        <div v-if="sending" class="space-y-2">
          <div class="flex justify-end">
            <div class="bg-[#6b2fa0]/20 rounded-2xl px-4 py-3 text-sm text-[#6b2fa0] italic">
              Recherche en cours…
            </div>
          </div>
        </div>

        <div ref="messagesEnd" />
      </div>
    </div>

    <!-- Erreur / conv introuvable -->
    <div v-else class="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Conversation introuvable.
    </div>

    <!-- Input de message (fixed en bas) -->
    <div class="border-t border-gray-100 bg-white px-6 py-4">
      <div class="max-w-3xl mx-auto">
        <form @submit.prevent="send" class="flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-[#6b2fa0] focus-within:shadow-[0_0_0_3px_rgba(107,47,160,0.08)] transition-all">
          <input
            v-model="query"
            type="text"
            placeholder="Affinez votre recherche…"
            class="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-300 bg-transparent"
            :disabled="sending"
          />
          <button
            type="submit"
            :disabled="!query.trim() || sending"
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-[#6b2fa0] text-white hover:bg-[#5a2787] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
