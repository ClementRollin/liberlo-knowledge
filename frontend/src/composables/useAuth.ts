import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    currentUser: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isSuperAdmin: computed(() => authStore.user?.role === 'DIRECTION'),
    isResponsable: computed(() => authStore.user?.role === 'RESPONSABLE'),
    isCollaborator: computed(() => authStore.user?.role === 'COLLABORATEUR'),
    logout: () => authStore.logout(),
  }
}
