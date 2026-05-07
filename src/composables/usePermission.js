/**
 * 通用组合式函数 - 权限处理
 */
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUser as getUserFromStorage } from '@/utils/storage'

/**
 * 从 localStorage 获取用户角色（不依赖 store，避免初始化时序问题）
 */
function getRoleFromStorage() {
  try {
    const user = getUserFromStorage()
    return user?.role || ''
  } catch (e) {
    console.error('读取用户角色失败:', e)
    return ''
  }
}

export function usePermission() {
  const userStore = useUserStore()

  /**
   * 获取当前用户角色（优先从 store 获取，否则从 localStorage 获取）
   */
  const getCurrentRole = () => {
    // 优先从 store 获取（如果 store 中有有效的 role）
    if (userStore.user?.role) {
      return userStore.user.role
    }
    // store 中没有，直接从 localStorage 获取（避免 store 初始化延迟问题）
    const role = getRoleFromStorage()
    // 如果 localStorage 中有角色但 store 中没有，同步到 store
    if (role && !userStore.user?.role) {
      const storedUser = getUserFromStorage()
      if (storedUser) {
        userStore.setUser(storedUser)
      }
    }
    return role
  }

  /**
   * 当前用户角色
   */
  const userRole = computed(() => getCurrentRole())

  /**
   * 是否为管理员
   */
  const isAdmin = computed(() => {
    const role = getCurrentRole()
    return role === 'COLLEGE_ADMIN' || role === 'SCHOOL_ADMIN'
  })

  /**
   * 是否为学校管理员
   */
  const isSchoolAdmin = computed(() => {
    return getCurrentRole() === 'SCHOOL_ADMIN'
  })

  /**
   * 是否为学生管理员
   */
  const isStudentAdmin = computed(() => {
    return getCurrentRole() === 'STUDENT_ADMIN'
  })

  /**
   * 是否为学院管理员
   */
  const isCollegeAdmin = computed(() => {
    return getCurrentRole() === 'COLLEGE_ADMIN'
  })

  /**
   * 是否为教师
   */
  const isTeacher = computed(() => {
    return getCurrentRole() === 'TEACHER'
  })

  /**
   * 是否为学生
   */
  const isStudent = computed(() => {
    return getCurrentRole() === 'STUDENT'
  })

  /**
   * 是否可以审核空间预约
   */
  const canReviewSpaceReservations = computed(() => {
    const role = getCurrentRole()
    return role === 'STUDENT_ADMIN' || role === 'COLLEGE_ADMIN' || role === 'SCHOOL_ADMIN'
  })

  /**
   * 检查是否有指定角色
   */
  const hasRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.includes(getCurrentRole())
  }

  /**
   * 检查是否有任一角色
   */
  const hasAnyRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.some(role => role === getCurrentRole())
  }

  return {
    userRole,
    isAdmin,
    isSchoolAdmin,
    isStudentAdmin,
    isCollegeAdmin,
    isTeacher,
    isStudent,
    canReviewSpaceReservations,
    hasRole,
    hasAnyRole
  }
}
