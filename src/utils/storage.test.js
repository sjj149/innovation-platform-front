import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import storage, {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser
} from './storage'

describe('storage', () => {
  beforeEach(() => {
    // 模拟 localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('sessionStorage', sessionStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('set', () => {
    it('应该存储对象到 localStorage', () => {
      const data = { name: 'test', value: 123 }
      storage.set('key', data)
      expect(localStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify(data))
    })

    it('应该存储到 sessionStorage', () => {
      storage.set('key', 'value', 'sessionStorage')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('key', '"value"')
    })
  })

  describe('get', () => {
    it('应该从 localStorage 获取值', () => {
      localStorage.getItem.mockReturnValue('{"name":"test"}')
      const result = storage.get('key')
      expect(result).toEqual({ name: 'test' })
    })

    it('应该返回默认值当键不存在', () => {
      localStorage.getItem.mockReturnValue(null)
      const result = storage.get('key', 'default')
      expect(result).toBe('default')
    })

    it('应该从 sessionStorage 获取', () => {
      sessionStorage.getItem.mockReturnValue('"value"')
      const result = storage.get('key', null, 'sessionStorage')
      expect(result).toBe('value')
    })
  })

  describe('remove', () => {
    it('应该从 localStorage 删除键', () => {
      storage.remove('key')
      expect(localStorage.removeItem).toHaveBeenCalledWith('key')
    })

    it('应该从 sessionStorage 删除键', () => {
      storage.remove('key', 'sessionStorage')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('key')
    })
  })

  describe('clear', () => {
    it('应该清空 localStorage', () => {
      storage.clear()
      expect(localStorage.clear).toHaveBeenCalled()
    })

    it('应该清空 sessionStorage', () => {
      storage.clear('sessionStorage')
      expect(sessionStorage.clear).toHaveBeenCalled()
    })
  })

  describe('便捷方法', () => {
    it('setLocal 应该使用 localStorage', () => {
      storage.setLocal('key', 'value')
      expect(localStorage.setItem).toHaveBeenCalledWith('key', '"value"')
    })

    it('getLocal 应该从 localStorage 获取', () => {
      localStorage.getItem.mockReturnValue('123')
      const result = storage.getLocal('key', 0)
      expect(result).toBe(123)
    })

    it('setSession 应该使用 sessionStorage', () => {
      storage.setSession('key', 'value')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('key', '"value"')
    })

    it('getSession 应该从 sessionStorage 获取', () => {
      sessionStorage.getItem.mockReturnValue('"test"')
      const result = storage.getSession('key')
      expect(result).toBe('test')
    })
  })
})

describe('Token 工具函数', () => {
  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getToken', () => {
    it('应该获取 token', () => {
      localStorage.getItem.mockReturnValue('my-token')
      const result = getToken()
      expect(result).toBe('my-token')
      expect(localStorage.getItem).toHaveBeenCalledWith(TOKEN_KEY)
    })
  })

  describe('setToken', () => {
    it('应该设置 token', () => {
      setToken('new-token')
      expect(localStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'new-token')
    })
  })

  describe('removeToken', () => {
    it('应该删除 token', () => {
      removeToken()
      expect(localStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY)
    })
  })
})

describe('User 工具函数', () => {
  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getUser', () => {
    it('应该获取用户对象', () => {
      const user = { id: 1, name: '张三' }
      localStorage.getItem.mockReturnValue(JSON.stringify(user))
      const result = getUser()
      expect(result).toEqual(user)
    })

    it('应该在解析失败时返回 null', () => {
      localStorage.getItem.mockReturnValue('invalid json')
      const result = getUser()
      expect(result).toBeNull()
    })

    it('应该在无数据时返回 null', () => {
      localStorage.getItem.mockReturnValue(null)
      const result = getUser()
      expect(result).toBeNull()
    })
  })

  describe('setUser', () => {
    it('应该设置用户对象', () => {
      const user = { id: 1, name: '张三' }
      setUser(user)
      expect(localStorage.setItem).toHaveBeenCalledWith(USER_KEY, JSON.stringify(user))
    })

    it('应该删除用户当传入 null', () => {
      setUser(null)
      expect(localStorage.removeItem).toHaveBeenCalledWith(USER_KEY)
    })
  })

  describe('removeUser', () => {
    it('应该删除用户', () => {
      removeUser()
      expect(localStorage.removeItem).toHaveBeenCalledWith(USER_KEY)
    })
  })
})
