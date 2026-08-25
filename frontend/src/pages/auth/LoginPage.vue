<script setup lang="ts">
import { useForm } from 'vee-validate'
import { object, string } from 'yup'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'
import logoLiberlo from '@/assets/logo-liberlo.png'

const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const route = useRoute()

const error = ref<string | null>(null)

const schema = object({
  email: string().email('Email invalide').required('Email requis'),
  password: string().min(1, 'Mot de passe requis').required(),
})

const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  error.value = null
  try {
    const res = await api.post<{ access_token: string; user: import('@/types').User }>(
      '/auth/login',
      values,
    )
    auth.setSession(res.access_token, res.user)
    const redirect = (route.query.redirect as string) ?? '/'
    router.push(redirect)
  } catch (e) {
    error.value = (e as Error).message
  }
})
</script>

<template>
  <!-- Maquette Figma : frame "Connexion" (5:5838) -->
  <div class="min-h-screen flex flex-col bg-white">
    <!-- Header -->
    <header class="px-4 sm:px-8 lg:px-12 h-16 sm:h-[101px] flex items-center border-b border-gray-100">
      <img :src="logoLiberlo" alt="Liberlo" class="h-10 sm:h-[61px] w-auto sm:w-[247px] object-contain object-left" />
    </header>

    <!-- Content -->
    <main class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-[1075px]">
        <h1 class="text-2xl sm:text-4xl lg:text-5xl font-semibold text-center text-gray-900 mb-8 lg:mb-12">
          Bienvenue sur la base de connaissances
        </h1>

        <form @submit="onSubmit" class="max-w-[408px] mx-auto flex flex-col gap-4 sm:gap-6">
          <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>

          <div>
            <input
              v-bind="emailAttrs"
              v-model="email"
              type="email"
              placeholder="Adresse e-mail"
              class="w-full h-14 sm:h-[68px] px-5 sm:px-9 rounded-2xl border border-gray-200 text-base focus:outline-none focus:border-gray-400"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
          </div>

          <div>
            <input
              v-bind="passwordAttrs"
              v-model="password"
              type="password"
              placeholder="Mot de passe"
              class="w-full h-14 sm:h-[68px] px-5 sm:px-9 rounded-2xl border border-gray-200 text-base focus:outline-none focus:border-gray-400"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-500">{{ errors.password }}</p>
          </div>

          <button
            type="submit"
            class="w-full h-14 sm:h-[68px] rounded-2xl bg-gray-900 text-white text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Connexion avec e-mail
          </button>
        </form>
      </div>
    </main>
  </div>
</template>
