import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePhone,
  validateIdCard,
  validateUrl,
  isEmpty,
  rules
} from './validate'

describe('validateEmail', () => {
  it('应该验证正确的邮箱地址', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co')).toBe(true)
    expect(validateEmail('user+tag@example.org')).toBe(true)
  })

  it('应该拒绝无效的邮箱地址', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
    expect(validateEmail('test@example')).toBe(false)
    expect(validateEmail('test example.com')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('应该验证正确的手机号', () => {
    expect(validatePhone('13800138000')).toBe(true)
    expect(validatePhone('15912345678')).toBe(true)
    expect(validatePhone('18888888888')).toBe(true)
  })

  it('应该拒绝无效的手机号', () => {
    expect(validatePhone('')).toBe(false)
    expect(validatePhone('12345678901')).toBe(false)
    expect(validatePhone('1380013800')).toBe(false)
    expect(validatePhone('138001380000')).toBe(false)
    expect(validatePhone('abcdefghij')).toBe(false)
  })
})

describe('validateIdCard', () => {
  it('应该验证正确的身份证号', () => {
    expect(validateIdCard('110101199001011234')).toBe(true)
    expect(validateIdCard('11010119900101123X')).toBe(true)
    expect(validateIdCard('110101900101123')).toBe(true)
  })

  it('应该拒绝无效的身份证号', () => {
    expect(validateIdCard('')).toBe(false)
    expect(validateIdCard('123')).toBe(false)
    expect(validateIdCard('11010119900101123')).toBe(false)
    expect(validateIdCard('1101011990010112345')).toBe(false)
    expect(validateIdCard('abcdefghijklmnopqr')).toBe(false)
  })
})

describe('validateUrl', () => {
  it('应该验证正确的URL', () => {
    expect(validateUrl('https://www.example.com')).toBe(true)
    expect(validateUrl('http://localhost:8080')).toBe(true)
    expect(validateUrl('ftp://files.example.com')).toBe(true)
  })

  it('应该拒绝无效的URL', () => {
    expect(validateUrl('')).toBe(false)
    expect(validateUrl('not-a-url')).toBe(false)
    expect(validateUrl('http://')).toBe(false)
    expect(validateUrl('www.example.com')).toBe(false)
  })
})

describe('isEmpty', () => {
  it('应该识别空值', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
  })

  it('应该识别非空值', () => {
    expect(isEmpty('hello')).toBe(false)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
    expect(isEmpty([1, 2, 3])).toBe(false)
    expect(isEmpty({ a: 1 })).toBe(false)
  })
})

describe('rules', () => {
  it('required 应该返回正确的验证规则', () => {
    const rule = rules.required('自定义消息')
    expect(rule).toEqual({
      required: true,
      message: '自定义消息',
      trigger: 'blur'
    })
  })

  it('required 应该使用默认消息', () => {
    const rule = rules.required()
    expect(rule.message).toBe('此项为必填项')
  })

  it('email 应该返回正确的验证规则', () => {
    const rule = rules.email()
    expect(rule).toEqual({
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur'
    })
  })

  it('url 应该返回正确的验证规则', () => {
    const rule = rules.url()
    expect(rule).toEqual({
      type: 'url',
      message: '请输入正确的 URL 地址',
      trigger: 'blur'
    })
  })

  it('length 应该返回正确的验证规则', () => {
    const rule = rules.length(5, 20)
    expect(rule).toEqual({
      min: 5,
      max: 20,
      message: '长度在 5 到 20 个字符',
      trigger: 'blur'
    })
  })

  describe('phone 验证器', () => {
    it('phone 应该通过空值', () => {
      const rule = rules.phone()
      return new Promise((resolve) => {
        rule.validator({}, '', () => {
          resolve()
        })
      })
    })

    it('phone 应该拒绝无效的手机号', () => {
      const rule = rules.phone()
      const callback = vi.fn()
      rule.validator({}, '123', callback)
      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })

    it('phone 应该接受有效的手机号', () => {
      const rule = rules.phone()
      return new Promise((resolve) => {
        rule.validator({}, '13800138000', () => {
          resolve()
        })
      })
    })
  })
})
