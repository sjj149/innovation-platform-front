/**
 * 认证模块路由
 */
export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/login-error',
    name: 'LoginError',
    component: () => import('@/views/auth/LoginError.vue'),
    meta: {
      title: '登录失败',
      requiresAuth: false
    }
  },
  {
    path: '/cas-callback',
    name: 'CasCallback',
    component: () => import('@/views/auth/CasCallback.vue'),
    meta: {
      title: 'CAS登录处理',
      requiresAuth: false
    }
  },
  {
    path: '/cas-merge',
    name: 'CasMerge',
    component: () => import('@/views/auth/CasMerge.vue'),
    meta: {
      title: '账号合并',
      requiresAuth: false
    }
  },
  {
    path: '/complete-profile',
    name: 'CompleteProfile',
    component: () => import('@/views/auth/CompleteProfile.vue'),
    meta: {
      title: '完善资料',
      requiresAuth: true
    }
  }
]
