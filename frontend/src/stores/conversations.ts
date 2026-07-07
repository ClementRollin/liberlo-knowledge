import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { Conversation, ConversationPreview, Message } from '@/types'

export const useConversationsStore = defineStore('conversations', () => {
  const api = useApi()
  const list = ref<ConversationPreview[]>([])
  const active = ref<Conversation | null>(null)
  const loading = ref(false)

  async function fetchList() {
    list.value = await api.get<ConversationPreview[]>('/conversations')
  }

  async function fetchOne(id: string) {
    loading.value = true
    try {
      active.value = await api.get<Conversation>(`/conversations/${id}`)
    } finally {
      loading.value = false
    }
  }

  async function create(query: string): Promise<string> {
    const conv = await api.post<Conversation>('/conversations', { query })
    list.value.unshift({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: conv.messages.map(m => ({ content: m.content, role: m.role })),
    })
    active.value = conv
    return conv.id
  }

  async function addMessage(conversationId: string, query: string): Promise<Message[]> {
    const messages = await api.post<Message[]>(`/conversations/${conversationId}/messages`, { query })
    if (active.value?.id === conversationId) {
      active.value.messages.push(...messages)
    }
    const idx = list.value.findIndex(c => c.id === conversationId)
    if (idx !== -1) {
      list.value[idx].updatedAt = new Date().toISOString()
      list.value.splice(0, 0, list.value.splice(idx, 1)[0])
    }
    return messages
  }

  async function remove(id: string) {
    await api.del(`/conversations/${id}`)
    list.value = list.value.filter(c => c.id !== id)
    if (active.value?.id === id) active.value = null
  }

  function clear() {
    list.value = []
    active.value = null
  }

  return { list, active, loading, fetchList, fetchOne, create, addMessage, remove, clear }
})
