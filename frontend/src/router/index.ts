import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/activate',
      name: 'activate',
      component: () => import('@/pages/auth/ActivatePage.vue'),
      meta: { public: true },
    },

    // Auth requis
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/pages/SearchPage.vue'),
    },
    {
      path: '/service/:slug',
      name: 'service',
      component: () => import('@/pages/ServicePage.vue'),
    },
    {
      path: '/article/:id',
      name: 'article',
      component: () => import('@/pages/ArticlePage.vue'),
    },

    // RESPONSABLE uniquement
    {
      path: '/dashboard/new',
      name: 'article-new',
      component: () => import('@/pages/ArticleFormPage.vue'),
      meta: { roles: ['RESPONSABLE'] },
    },
    {
      path: '/dashboard/edit/:id',
      name: 'article-edit',
      component: () => import('@/pages/ArticleFormPage.vue'),
      meta: { roles: ['RESPONSABLE'] },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
      meta: { roles: ['RESPONSABLE'] },
    },

    // SUPER_ADMIN uniquement
    {
      path: '/dashboard/global',
      name: 'dashboard-global',
      component: () => import('@/pages/DashboardGlobalPage.vue'),
      meta: { roles: ['SUPER_ADMIN'] },
    },

    // Erreurs
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/pages/ForbiddenPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) return true

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.includes(auth.role!)) {
    return { name: 'forbidden' }
  }

  return true
})

export default router
