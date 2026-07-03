<script setup lang="ts">
import { useForm } from 'vee-validate'
import { object, string, ref as yupRef } from 'yup'
import { useApi } from '@/composables/useApi'
import { useRouter, useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import logoLiberlo from '@/assets/logo-liberlo.png'

const api = useApi()
const router = useRouter()
const route = useRoute()

const token = computed(() => route.query.token as string)
const email = computed(() => route.query.email as string)
const error = ref<string | null>(null)

const schema = object({
  password: string().min(8, 'Minimum 8 caractères').required(),
  confirmPassword: string()
    .oneOf([yupRef('password')], 'Les mots de passe ne correspondent pas')
    .required(),
})

const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  error.value = null
  try {
    await api.post('/auth/activate', { token: token.value, password: values.password })
    router.push({ name: 'login' })
  } catch (e) {
    error.value = (e as Error).message
  }
})
</script>

<template>
  <!-- Maquette Figma : frame "Activation compte" (26:509) -->
  <div class="min-h-screen flex flex-col bg-white">
    <header class="px-12 h-[101px] flex items-center border-b border-gray-100">
      <img :src="logoLiberlo" alt="Liberlo" class="h-[61px] w-[247px] object-contain object-left" />
    </header>

    <main class="flex-1 flex items-center justify-center">
      <div class="w-[1075px] max-w-full px-8">
        <h1 class="text-5xl font-semibold text-center text-gray-900 mb-12">
          Activez votre compte
        </h1>

        <form @submit="onSubmit" class="max-w-[408px] mx-auto flex flex-col gap-6">
          <p class="text-sm text-gray-500">Email : {{ email }}</p>
          <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

          <div>
            <input
              v-bind="passwordAttrs"
              v-model="password"
              type="password"
              placeholder="Nouveau mot de passe"
              class="w-full h-[68px] px-9 rounded-2xl border border-gray-200 text-base focus:outline-none focus:border-gray-400"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-500">{{ errors.password }}</p>
          </div>

          <div>
            <input
              v-bind="confirmPasswordAttrs"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirmer le mot de passe"
              class="w-full h-[68px] px-9 rounded-2xl border border-gray-200 text-base focus:outline-none focus:border-gray-400"
            />
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-500">{{ errors.confirmPassword }}</p>
          </div>

          <button
            type="submit"
            class="w-full h-[68px] rounded-2xl bg-gray-900 text-white text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            C'est parti !
          </button>
        </form>
      </div>
    </main>
  </div>
</template>
