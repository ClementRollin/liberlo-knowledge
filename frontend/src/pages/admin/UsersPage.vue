<template>
  <div class="min-h-full bg-white">
    <div class="px-12 py-10">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
        <button
          class="bg-[#6b2fa0] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-800 transition-colors"
          @click="isDrawerOpen = true"
        >
          + Créer un utilisateur
        </button>
      </div>

      <!-- Filtre par rôle -->
      <div class="mb-5">
        <select
          v-model="roleFilter"
          class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
        >
          <option value="">Tous les rôles</option>
          <option value="COLLABORATEUR">Collaborateurs</option>
          <option value="RESPONSABLE">Responsables</option>
          <option value="DIRECTION">Direction</option>
        </select>
      </div>

      <!-- Chargement -->
      <template v-if="isLoading">
        <div v-for="n in 5" :key="n" class="h-14 bg-gray-100 rounded-xl animate-pulse mb-3" />
      </template>

      <!-- Vide -->
      <EmptyState
        v-else-if="filteredUsers.length === 0"
        icon="👥"
        title="Aucun utilisateur trouvé"
        description="Ajustez les filtres ou créez un premier utilisateur."
      />

      <!-- Tableau -->
      <div v-else class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Email</th>
              <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Rôle</th>
              <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Service</th>
              <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Statut</th>
              <th class="text-left px-5 py-3.5 text-gray-500 font-medium">Créé le</th>
              <th class="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-5 py-3.5 font-medium text-gray-800">{{ user.email }}</td>
              <td class="px-5 py-3.5">
                <span
                  class="text-xs font-medium px-2.5 py-1 rounded-full"
                  :class="roleBadgeClass(user.role)"
                >
                  {{ roleLabelByKey[user.role] }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-gray-600">{{ user.service?.name ?? '—' }}</td>
              <td class="px-5 py-3.5">
                <span :class="user.isActive ? 'text-green-600' : 'text-gray-400'">
                  {{ user.isActive ? 'Actif' : 'Désactivé' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-gray-400">{{ formatDate(user.createdAt) }}</td>
              <td class="px-5 py-3.5 text-right">
                <button
                  v-if="user.isActive"
                  class="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                  @click="openDeactivateConfirm(user)"
                >
                  Désactiver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UserDrawer
      :is-open="isDrawerOpen"
      :services="services"
      @close="isDrawerOpen = false"
      @created="loadUsers"
    />

    <ConfirmModal
      :is-open="!!userToDeactivate"
      title="Désactiver ce compte ?"
      :message="`Le compte ${userToDeactivate?.email} ne pourra plus se connecter. Les articles rédigés sont conservés.`"
      confirm-label="Désactiver"
      variant="danger"
      @confirm="confirmDeactivate"
      @cancel="userToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import UserDrawer from '@/components/domain/users/UserDrawer.vue'

interface ServiceSummary {
  id: string
  name: string
  slug: string
}

interface UserItem {
  id: string
  email: string
  role: 'COLLABORATEUR' | 'RESPONSABLE' | 'DIRECTION'
  isActive: boolean
  createdAt: string
  service: ServiceSummary | null
}

const { get, patch } = useApi()
const toast = useToast()

const users = ref<UserItem[]>([])
const services = ref<ServiceSummary[]>([])
const isLoading = ref(true)
const isDrawerOpen = ref(false)
const roleFilter = ref('')
const userToDeactivate = ref<UserItem | null>(null)

const roleLabelByKey: Record<string, string> = {
  COLLABORATEUR: 'Collaborateur',
  RESPONSABLE: 'Responsable',
  DIRECTION: 'Direction',
}

function roleBadgeClass(role: string) {
  return {
    'bg-blue-100 text-blue-700': role === 'COLLABORATEUR',
    'bg-purple-100 text-purple-700': role === 'RESPONSABLE',
    'bg-gray-800 text-white': role === 'DIRECTION',
  }
}

const filteredUsers = computed(() =>
  roleFilter.value ? users.value.filter((u) => u.role === roleFilter.value) : users.value,
)

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function loadUsers() {
  isLoading.value = true
  try {
    users.value = await get<UserItem[]>('/users')
  } catch {
    toast.error('Impossible de charger les utilisateurs.')
  } finally {
    isLoading.value = false
  }
}

async function loadServices() {
  try {
    services.value = await get<ServiceSummary[]>('/services')
  } catch {
    // non-bloquant
  }
}

function openDeactivateConfirm(user: UserItem) {
  userToDeactivate.value = user
}

async function confirmDeactivate() {
  if (!userToDeactivate.value) return
  try {
    await patch(`/users/${userToDeactivate.value.id}/deactivate`, {})
    toast.success(`Compte ${userToDeactivate.value.email} désactivé.`)
    await loadUsers()
  } catch {
    toast.error('Erreur lors de la désactivation.')
  } finally {
    userToDeactivate.value = null
  }
}

onMounted(() => {
  loadUsers()
  loadServices()
})
</script>
