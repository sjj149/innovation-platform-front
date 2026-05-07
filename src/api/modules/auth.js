/**
 * 认证相关 API
 */
import { get, post, handleResponse } from '../request'

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export function login(username, password) {
  return handleResponse(post('/auth/login', { username, password }))
}

/**
 * 用户注册
 * @param {object} registerData - 注册数据
 */
export function register(registerData) {
  return handleResponse(post('/auth/register', registerData))
}

/**
 * 用户登出
 */
export function logout() {
  return handleResponse(post('/auth/logout'))
}

/**
 * 刷新 Token
 */
export function refreshToken() {
  return handleResponse(post('/auth/refresh'))
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  return handleResponse(get('/users/me'))
}

/**
 * 获取CAS退出登录地址
 * @returns {Promise<{enabled: boolean, logoutUrl?: string, fullLogoutUrl?: string}>}
 */
export function getCasLogoutUrl() {
  return handleResponse(get('/auth/cas/logout-url'))
}
