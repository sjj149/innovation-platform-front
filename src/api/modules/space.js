/**
 * 空间预定相关 API
 */
import { get, post, put, del, handleResponse } from '../request'

/**
 * 查询空间列表
 * @param {string} status - 可选，空间状态：AVAILABLE, MAINTENANCE, DISABLED。不传则返回所有
 */
export function getSpaces(status) {
  const params = status ? { status } : {}
  return handleResponse(get('/spaces', params))
}

/**
 * 查询可用空间列表（兼容旧接口）
 */
export function getAvailableSpaces() {
  return getSpaces('AVAILABLE')
}

/**
 * 查询空间详情
 */
export function getSpaceById(id) {
  return handleResponse(get(`/spaces/${id}`))
}

/**
 * 修改空间状态（管理员）
 * @param {number|string} id - 空间 ID
 * @param {string} status - 新状态：AVAILABLE, MAINTENANCE, DISABLED
 */
export function updateSpaceStatus(id, status) {
  return handleResponse(put(`/spaces/${id}/status`, { status }))
}

/**
 * 查询空间的实时预约状态
 */
export function getSpaceReservations(spaceId, date) {
  const params = date ? { date } : {}
  return handleResponse(get(`/spaces/${spaceId}/reservations`, params))
}

/**
 * 查询空间在指定日期的占用时段（预约+活动合并，用于时段灰显）
 */
export function getSpaceOccupiedSlots(spaceId, date) {
  return handleResponse(get(`/spaces/${spaceId}/occupied-slots`, { date }))
}

/**
 * 提交预约申请
 */
export function createReservation(data) {
  return handleResponse(post('/spaces/reservations', data))
}

/**
 * 取消预约
 */
export function cancelReservation(id) {
  return handleResponse(del(`/spaces/reservations/${id}`))
}

/**
 * 查询我的预约列表
 */
export function getMyReservations() {
  return handleResponse(get('/spaces/reservations/my'))
}

/**
 * 审核预约申请
 */
export function reviewReservation(id, data) {
  return handleResponse(post(`/spaces/reservations/${id}/review`, data))
}

/**
 * 查询待审核预约列表
 */
export function getPendingReservations() {
  return handleResponse(get('/spaces/reservations/pending'))
}

/**
 * 按状态查询预约列表（管理员）
 * @param {string} status - PENDING, APPROVED, REJECTED
 */
export function getReservationsByStatus(status) {
  return handleResponse(get('/spaces/reservations/admin', { status }))
}

/**
 * 创建入驻空间
 * @param {Object} data - 空间表单数据
 */
export function createSpace(data) {
    return handleResponse(post(`/spaces/create`, data))
}

/**
 * 更新空间信息（管理员）
 * @param {number|string} id - 空间 ID
 * @param {Object} data - 空间表单数据
 */
export function updateSpace(id, data) {
    return handleResponse(put(`/spaces/${id}`, data))
}