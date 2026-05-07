/**
 * 用户个人中心模块路由
 */
export default [
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/Profile.vue'),
    meta: {
      title: '个人资料',
      requiresAuth: true
    }
  }
]
