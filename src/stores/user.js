import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, logout as logoutApi, getCasLogoutUrl } from '@/api/modules/auth'
import { getToken, setToken, removeToken, getUser, setUser as setUserToStorage, removeUser } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 初始化，确保刷新后状态能恢复
  const token = ref(getToken() || '')
  const user = ref(getUser())

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')

  async function login(loginData) {
    try {
      const data = await loginApi(loginData.username, loginData.password)
      token.value = data.token
      user.value = data.user
      setToken(data.token)
      setUserToStorage(data.user)
      return data
    } catch (error) {
      throw error
    }
  }

  async function register(registerData) {
    try {
      const data = await registerApi(registerData)
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * 退出登录
   * @param {boolean} casLogout - 是否执行CAS登出（跳转到CAS退出页面）
   * @returns {Promise<string|null>} - 返回CAS登出URL或null
   */
  async function logout(casLogout = true) {
    // 检查是否是CAS用户
    const currentUser = user.value || getUser()
    const isCasUser = currentUser && (currentUser.authType === 'CAS' || currentUser.authType === 'BOTH')

    // 先通知后端使token失效（所有用户类型都执行）
    try {
      if (isCasUser) {
        await logoutApi()
      } else {
        await logoutApi()
      }
    } catch (error) {
      console.warn('通知后端退出登录失败:', error)
    }

    // 清除本地状态
    token.value = ''
    user.value = null
    removeToken()
    removeUser()

    // 如果是CAS用户且需要CAS登出，获取CAS登出地址
    if (casLogout && isCasUser) {
      try {
        const casLogoutInfo = await getCasLogoutUrl()
        if (casLogoutInfo.enabled && casLogoutInfo.fullLogoutUrl) {
          return casLogoutInfo.fullLogoutUrl
        }
      } catch (error) {
        console.warn('获取CAS登出地址失败:', error)
      }
    }

    return null
  }

  function setUser(userData) {
    user.value = userData
    // 同步更新到 localStorage
    if (userData) {
      setUserToStorage(userData)
    }
  }

  /**
   * 从 localStorage 同步恢复状态
   * 用于在应用启动时或需要时恢复用户状态
   */
  function restoreFromStorage() {
    const storedToken = getToken()
    const storedUser = getUser()

    if (storedToken) {
      token.value = storedToken
    }
    if (storedUser) {
      user.value = storedUser
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    userRole,
    login,
    register,
    logout,
    setUser,
    restoreFromStorage
  }
})
