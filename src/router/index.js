import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getToken, getUser } from '@/utils/storage'

// 路由模块
import authRoutes from './modules/auth'
import dashboardRoutes from './modules/dashboard'
import projectRoutes from './modules/project'
import teamRoutes from './modules/team'
import spaceRoutes from './modules/space'
import activityRoutes from './modules/activity'
import personRoutes from './modules/person'
import informationLinkRoutes from './modules/informationLink'
import newsRoutes from './modules/news'
import entryApplicationRoutes from './modules/entryApplication'
import adminRoutes from './modules/admin'
import userRoutes from './modules/user'

const routes = [
  ...authRoutes,

  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      ...dashboardRoutes,
      ...projectRoutes,
      ...teamRoutes,
      ...spaceRoutes,
      ...activityRoutes,
      ...personRoutes,
      ...informationLinkRoutes,
      ...newsRoutes,
      ...entryApplicationRoutes,
      ...adminRoutes,

      // 个人中心
      ...userRoutes,
    ]
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 白名单
const whiteList = ['/login', '/register']

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 1. 先从本地恢复登录态（刷新必执行）
  if (!userStore.token) {
    const token = getToken()
    if (token) {
      userStore.token = token
      const userInfo = getUser()
      if (userInfo) {
        userStore.setUser(userInfo)
      }
    }
  }

  const isLogin = !!userStore.token
  const userRole = userStore.user?.role

  // 2. 在白名单
  if (whiteList.includes(to.path)) {
    if (isLogin) {
      // 已登录还想去登录/注册 → 去 dashboard
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  // 3. 需要登录但未登录
  if (to.meta.requiresAuth && !isLogin) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 4. 角色权限判断
  if (to.meta.roles?.length && userRole) {
    const hasPermission = to.meta.roles.includes(userRole)
    if (!hasPermission) {
      next('/dashboard')
      return
    }
  }

  // 正常放行
  next()
})

export default router