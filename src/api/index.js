import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/storage'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

/**
 * 获取当前有效的 token
 * 优先从 store 获取，如果没有则从 localStorage 获取（解决刷新后 token 丢失问题）
 */
function getValidToken() {
  let userStore = useUserStore()
  // 优先从 store 获取
  if (userStore.token) {
    return userStore.token
  }
  // store 中没有，从 localStorage 获取
  const token = getToken()
  if (token) {
    // 同步恢复到 store
    userStore.token = token
  }
  return token
}

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = getValidToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        const userStore = useUserStore()
        // 401可能是token过期或被踢出（CAS单点登出），不执行CAS登出
        userStore.logout(false)
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else {
        const msg = data?.message || (status === 403 ? '无权限访问' : status === 404 ? '接口不存在' : status === 500 ? '服务器错误' : '请求失败')
        ElMessage.error(msg)
      }
    } else {
      ElMessage.error(error.code === 'ECONNABORTED' ? '请求超时，请检查网络' : '网络错误，请确保后端服务已启动(端口8080)')
    }
    return Promise.reject(error)
  }
)

export default api
