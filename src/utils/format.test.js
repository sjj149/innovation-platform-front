import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDateTime,
  formatDate,
  formatTime,
  formatFileSize,
  formatAmount
} from './format'

describe('formatDateTime', () => {
  it('应该格式化日期时间为默认格式', () => {
    const date = '2024-01-15 10:30:00'
    const result = formatDateTime(date)
    expect(result).toBe('2024-01-15 10:30:00')
  })

  it('应该支持自定义格式', () => {
    const date = '2024-01-15 10:30:00'
    const result = formatDateTime(date, 'YYYY年MM月DD日')
    expect(result).toBe('2024年01月15日')
  })

  it('应该处理空值', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
    expect(formatDateTime('')).toBe('-')
  })
})

describe('formatDate', () => {
  it('应该格式化为日期格式', () => {
    const date = '2024-01-15 10:30:00'
    const result = formatDate(date)
    expect(result).toBe('2024-01-15')
  })

  it('应该支持自定义格式', () => {
    const date = '2024-01-15 10:30:00'
    const result = formatDate(date, 'MM/DD/YYYY')
    expect(result).toBe('01/15/2024')
  })

  it('应该处理空值', () => {
    expect(formatDate(null)).toBe('-')
  })
})

describe('formatTime', () => {
  it('应该格式化时间字符串', () => {
    expect(formatTime('09:00:00')).toBe('09:00')
    expect(formatTime('9:30')).toBe('09:30')
    expect(formatTime('14:30:00')).toBe('14:30')
  })

  it('应该格式化日期时间', () => {
    const date = '2024-01-15 10:30:00'
    const result = formatTime(date)
    expect(result).toBe('10:30')
  })

  it('应该处理空值', () => {
    expect(formatTime(null)).toBe('-')
    expect(formatTime(undefined)).toBe('-')
    expect(formatTime('')).toBe('-')
  })
})

describe('formatFileSize', () => {
  it('应该格式化字节', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(100)).toBe('100 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('应该格式化大文件', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('应该处理空值', () => {
    expect(formatFileSize(null)).toBe('0 B')
    expect(formatFileSize(undefined)).toBe('0 B')
  })
})

describe('formatAmount', () => {
  it('应该格式化金额为两位小数', () => {
    expect(formatAmount(100)).toBe('100.00')
    expect(formatAmount(100.5)).toBe('100.50')
    expect(formatAmount(100.555)).toBe('100.56')
  })

  it('应该添加千位分隔符', () => {
    expect(formatAmount(1000)).toBe('1,000.00')
    expect(formatAmount(1000000)).toBe('1,000,000.00')
  })

  it('应该处理空值', () => {
    expect(formatAmount(null)).toBe('0.00')
    expect(formatAmount(undefined)).toBe('0.00')
  })

  it('应该处理负数', () => {
    expect(formatAmount(-100)).toBe('-100.00')
  })
})
