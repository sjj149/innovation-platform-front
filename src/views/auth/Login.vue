<template>
  <div class="login-container">
    <div class="login-background">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
      <div class="bg-grid"></div>
    </div>
    
    <div class="login-content">
      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h1 class="card-title">创新创业服务系统</h1>
            <h2>欢迎登录</h2>
            <p>请输入您的账号信息</p>
          </div>
          
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-btn"
                @click="handleLogin"
              >
                <span v-if="!loading">登 录</span>
                <span v-else>登录中...</span>
              </el-button>
            </el-form-item>
            
            <!-- CAS启用时显示提示信息 -->
            <div v-if="casEnabled" class="cas-login-section">
              <div class="divider">
                <span>统一身份认证登录</span>
              </div>
              <div class="cas-redirecting">
                <el-icon class="loading-icon" :size="24"><Loading /></el-icon>
                <span>正在跳转到统一认证平台...</span>
              </div>
              <p v-if="casMockMode" class="cas-hint">当前为测试模式</p>
            </div>
            
            <div class="form-footer">
              <span>还没有账号？</span>
              <el-link type="primary" @click="goToRegister">立即注册</el-link>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, School, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getCasStatus, casLogin } from '@/api/modules/cas'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const casLoading = ref(false)
const casEnabled = ref(false)
const casMockMode = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 检查CAS状态
onMounted(async () => {
  try {
    const res = await getCasStatus()
    if (res && res.enabled !== undefined) {
      casEnabled.value = res.enabled
      casMockMode.value = res.mockMode || false
      
      // 如果CAS启用，直接跳转到CAS登录（不显示本地登录界面）
      // 但是如果URL中有error参数（从错误页返回），则不自动跳转
      const hasError = route.query.error
      if (casEnabled.value && !hasError) {
        casLoading.value = true
        casLogin()
        return
      }
    }
  } catch (error) {
    console.log('获取CAS状态失败:', error)
    // 默认不显示本地登录界面
    casEnabled.value = false
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// CAS统一身份认证登录
const handleCasLogin = () => {
  casLoading.value = true
  try {
    casLogin()
  } catch (error) {
    ElMessage.error('CAS登录失败: ' + (error.message || '未知错误'))
    casLoading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
}

.bg-shape-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.bg-shape-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  bottom: -100px;
  right: -100px;
  animation-delay: -5s;
}

.bg-shape-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -20px) scale(1.05);
  }
  50% {
    transform: translate(-10px, 20px) scale(0.95);
  }
  75% {
    transform: translate(-20px, -10px) scale(1.02);
  }
}

.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.login-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  max-width: 460px;
  min-height: auto;
  padding: 40px 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px);
}

.login-right {
  width: 100%;
  padding: 48px 40px;
}

.login-card {
  width: 100%;
}

.card-header {
  text-align: center;
  margin-bottom: 36px;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 24px 0;
  letter-spacing: 0.5px;
}

.card-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.card-header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 2px solid #e8e8e8;
  padding: 4px 15px;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #1890ff;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.15);
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
}

.login-form :deep(.el-input__prefix-inner) {
  color: #999;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  letter-spacing: 4px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

/* CAS登录区域样式 */
.cas-login-section {
  margin-top: 20px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
}

.divider span {
  padding: 0 16px;
}

.cas-login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cas-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(82, 196, 26, 0.4);
}

.cas-login-btn:active {
  transform: translateY(0);
}

.cas-icon {
  font-size: 20px;
}

.cas-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.cas-redirecting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #52c41a;
  font-size: 14px;
}

.cas-redirecting .loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 14px;
}

.form-footer .el-link {
  font-weight: 500;
  margin-left: 4px;
}

@media (max-width: 540px) {
  .login-content {
    width: 94%;
    padding: 32px 0;
  }
  
  .login-right {
    padding: 32px 24px;
  }
}
</style>
