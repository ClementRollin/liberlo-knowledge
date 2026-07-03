import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Role } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // JWT stocké en mémoire uniquement — jamais en localStorage
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => token.value !== null && user.value !== null)
  const role = computed<Role | null>(() => user.value?.role ?? null)

  function setSession(accessToken: string, userData: User) {
    token.value = accessToken
    user.value = userData
  }

  function logout() {
    token.value = null
    user.value = null
  }

  function hasRole(...roles: Role[]) {
    return user.value ? roles.includes(user.value.role) : false
  }

  return { token, user, isAuthenticated, role, setSession, logout, hasRole }
})
