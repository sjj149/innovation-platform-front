/**
 * 空间预约路由模块
 */
export default [
  {
    path: '/spaces',
    name: 'Spaces',
    component: () => import('@/views/space/index.vue'),
    meta: {
      title: '空间预约',
      requiresAuth: true
    }
  },
  {
    path: '/spaces/:id',
    name: 'SpaceDetail',
    component: () => import('@/views/space/detail.vue'),
    meta: {
      title: '空间详情',
      requiresAuth: true
    }
  },
  {
    path: '/spaces/admin',
    name: 'SpaceAdmin',
    component: () => import('@/views/space/admin.vue'),
    meta: {
      title: '空间预约审核',
      requiresAuth: true,
      roles: ['STUDENT_ADMIN', 'COLLEGE_ADMIN', 'SCHOOL_ADMIN']
    }
  }
]
