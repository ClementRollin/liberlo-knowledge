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

    // Toutes les routes auth partagent le layout sidebar
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/pages/HomePage.vue'),
        },
        {
          path: 'conversations/:id',
          name: 'conversation',
          component: () => import('@/pages/ConversationPage.vue'),
        },
        {
          path: 'service/:slug',
          name: 'service',
          component: () => import('@/pages/ServicePage.vue'),
        },
        {
          path: 'article/:id',
          name: 'article',
          component: () => import('@/pages/ArticlePage.vue'),
        },

        // RESPONSABLE
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/pages/dashboard/DashboardPage.vue'),
          meta: { roles: ['RESPONSABLE'] },
        },
        {
          path: 'dashboard/new',
          name: 'article-new',
          component: () => import('@/pages/ArticleFormPage.vue'),
          meta: { roles: ['RESPONSABLE'] },
        },
        {
          path: 'dashboard/edit/:id',
          name: 'article-edit',
          component: () => import('@/pages/ArticleFormPage.vue'),
          meta: { roles: ['RESPONSABLE'] },
        },

        // DIRECTION
        {
          path: 'dashboard/global',
          name: 'dashboard-global',
          component: () => import('@/pages/dashboard/DashboardGlobalPage.vue'),
          meta: { roles: ['DIRECTION'] },
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('@/pages/admin/UsersPage.vue'),
          meta: { roles: ['DIRECTION'] },
        },
        {
          path: 'admin/import',
          name: 'admin-import',
          component: () => import('@/pages/admin/ImportPage.vue'),
          meta: { roles: ['DIRECTION'] },
        },

        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/pages/ProfilePage.vue'),
        },

        {
          path: '403',
          name: 'forbidden',
          component: () => import('@/pages/ForbiddenPage.vue'),
        },

        { path: 'search', redirect: '/' },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
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
