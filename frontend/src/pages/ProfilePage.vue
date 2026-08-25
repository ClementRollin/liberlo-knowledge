<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const roleLabels: Record<string, string> = {
  COLLABORATEUR: 'Collaborateur',
  RESPONSABLE: 'Responsable de service',
  DIRECTION: 'Direction',
}

const showPasswordInfo = ref(false)
</script>

<template>
  <div class="min-h-full bg-white">
    <div class="px-12 py-10 max-w-2xl">
      <h1 class="text-4xl font-semibold text-gray-900 mb-2">Mon profil</h1>
      <p class="text-gray-400 text-sm mb-10">Informations de votre compte (lecture seule)</p>

      <div class="space-y-6">
        <!-- Email -->
        <div class="border border-gray-100 rounded-2xl p-6">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Adresse e-mail</p>
          <p class="text-base text-gray-900 font-medium">{{ auth.user?.email }}</p>
        </div>

        <!-- Rôle -->
        <div class="border border-gray-100 rounded-2xl p-6">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Rôle</p>
          <p class="text-base text-gray-900 font-medium">
            {{ auth.user?.role ? roleLabels[auth.user.role] : '—' }}
          </p>
        </div>

        <!-- Service (affiché uniquement si l'utilisateur est rattaché à un service) -->
        <div v-if="auth.user?.service" class="border border-gray-100 rounded-2xl p-6">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Service</p>
          <p class="text-base text-gray-900 font-medium">{{ auth.user.service.name }}</p>
        </div>

        <!-- Bouton changer de mot de passe -->
        <div class="border border-gray-100 rounded-2xl p-6">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Mot de passe</p>
          <button
            @click="showPasswordInfo = true"
            class="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Changer de mot de passe
          </button>
          <p v-if="showPasswordInfo" class="mt-3 text-sm text-gray-400">
            Pour modifier votre mot de passe, veuillez contacter votre administrateur.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
