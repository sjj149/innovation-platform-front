/**
 * CAS统一身份认证相关 API
 */
import { get, post, handleResponse } from '../request'

/**
 * 获取CAS登录状态
 */
export function getCasStatus() {
  return handleResponse(get('/auth/cas/status'))
}

/**
 * 发起CAS登录
 * 注意：此接口会重定向到CAS服务器，不直接调用
 */
export function casLogin() {
  // 直接跳转到后端CAS登录端点
  window.location.href = '/api/auth/cas/login'
}

/**
 * 验证CAS ticket
 * @param {string} ticket - CAS票据
 */
export function validateCasTicket(ticket) {
  return handleResponse(get('/auth/cas/validate', { ticket }))
}

/**
 * 合并本地账号
 * @param {object} mergeData - 合并数据
 * @param {string} mergeData.casUid - CAS用户ID
 * @param {string} mergeData.realName - 真实姓名
 * @param {string} mergeData.password - 本地账号密码
 */
export function mergeAccount(mergeData) {
  return handleResponse(post('/auth/cas/merge', mergeData))
}

/**
 * 创建新账号（跳过合并）
 * @param {string} casUid - CAS用户ID
 * @param {string} realName - 真实姓名
 */
export function createNewAccount(casUid, realName) {
  const params = new URLSearchParams()
  params.append('casUid', casUid)
  params.append('realName', realName)
  return handleResponse(post('/auth/cas/create-new', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }))
}

/**
 * 完善用户资料
 * @param {object} profileData - 资料数据
 * @param {string} profileData.email - 邮箱
 * @param {string} profileData.phone - 手机号
 * @param {number} profileData.collegeId - 学院ID
 * @param {string} profileData.role - 角色
 */
export function completeProfile(profileData) {
  return handleResponse(post('/auth/cas/complete-profile', profileData))
}

/**
 * 检查是否需要完善资料
 */
export function checkProfileStatus() {
  return handleResponse(get('/auth/cas/check-profile'))
}
