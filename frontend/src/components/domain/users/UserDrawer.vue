<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="fixed inset-0 z-40 flex justify-end">
        <div class="absolute inset-0 bg-black/30" @click="$emit('close')" />

        <div class="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
          <!-- En-tête -->
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h2 class="text-lg font-semibold text-gray-900">Créer un utilisateur</h2>
            <button
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>

          <!-- Formulaire -->
          <form
            class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
            @submit.prevent="handleSubmit"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="prenom.nom@liberlo.com"
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                v-model="form.role"
                required
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
              >
                <option value="" disabled>Choisir un rôle</option>
                <option value="COLLABORATEUR">Collaborateur</option>
                <option value="RESPONSABLE">Responsable de service</option>
                <option value="DIRECTION">Direction</option>
              </select>
            </div>

            <div v-if="form.role === 'RESPONSABLE'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                v-model="form.serviceId"
                required
                class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b2fa0]"
              >
                <option value="" disabled>Choisir un service</option>
                <option v-for="svc in services" :key="svc.id" :value="svc.id">
                  {{ svc.name }}
                </option>
              </select>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="mt-auto w-full bg-[#6b2fa0] text-white rounded-xl py-3 text-sm font-medium hover:bg-purple-800 disabled:opacity-50 transition-colors"
            >
              {{ isSubmitting ? 'Création en cours…' : 'Créer le compte' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Modale mot de passe généré -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="generatedPassword"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Compte créé ✓</h3>
          <p class="text-sm text-gray-500 mb-4">
            Communiquez ces informations à
            <strong class="text-gray-800">{{ createdEmail }}</strong>.
            <span class="block mt-1 text-xs text-red-500">
              Le mot de passe ne sera plus affiché après fermeture de cette fenêtre.
            </span>
          </p>

          <div
            class="bg-gray-100 rounded-xl p-4 font-mono text-center text-xl tracking-widest text-gray-800 mb-4 select-all"
          >
            {{ generatedPassword }}
          </div>

          <!-- Lien de connexion -->
          <div class="bg-[#f9f6ff] border border-[#e9d8ff] rounded-xl px-4 py-3 mb-5">
            <p class="text-xs text-gray-500 mb-1">Lien de connexion à transmettre :</p>
            <p class="text-xs font-mono text-[#6b2fa0] break-all select-all">{{ loginUrl }}</p>
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 bg-[#6b2fa0] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-800 transition-colors"
              @click="copyPassword"
            >
              {{ isCopied ? 'Copié ✓' : 'Copier le mdp' }}
            </button>
            <button
              class="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
              @click="closePasswordModal"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

defineProps<{
  isOpen: boolean
  services: Array<{ id: string; name: string; slug: string }>
}>()

const emit = defineEmits<{ close: []; created: [] }>()

const { post } = useApi()
const toast = useToast()

const form = reactive({ email: '', role: '', serviceId: '' })
const isSubmitting = ref(false)
const generatedPassword = ref<string | null>(null)
const createdEmail = ref('')
const isCopied = ref(false)

const loginUrl = computed(() => {
  const base = window.location.origin
  return `${base}/auth/login`
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const payload: Record<string, string> = { email: form.email, role: form.role }
    if (form.role === 'RESPONSABLE') payload.serviceId = form.serviceId

    const result = await post<{ email: string; generatedPassword: string }>('/users', payload)
    createdEmail.value = result.email
    generatedPassword.value = result.generatedPassword
    form.email = ''
    form.role = ''
    form.serviceId = ''
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création'
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

async function copyPassword() {
  if (!generatedPassword.value) return
  await navigator.clipboard.writeText(generatedPassword.value)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

function closePasswordModal() {
  generatedPassword.value = null
  createdEmail.value = ''
  isCopied.value = false
  emit('created')
  emit('close')
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
