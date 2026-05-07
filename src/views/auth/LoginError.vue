<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-card">
        <el-icon class="error-icon" :size="64"><CircleCloseFilled /></el-icon>
        <h2>登录失败</h2>
        <p class="error-message">{{ errorMessage || '统一身份认证登录过程中出现错误' }}</p>
        
        <div class="error-details" v-if="errorDetail">
          <el-alert :title="errorDetail" type="error" :closable="false" show-icon />
        </div>

        <div class="action-buttons">
          <el-button type="primary" size="large" @click="retryLogin">
            <el-icon><RefreshRight /></el-icon>
            <span>重新登录</span>
          </el-button>
          
          <el-button size="large" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            <span>返回首页</span>
          </el-button>
        </div>

        <div class="help-section">
          <el-divider>常见问题</el-divider>
          <ul class="help-list">
            <li>请确认您的统一身份认证账号已激活</li>
            <li>检查网络连接是否正常</li>
            <li>清除浏览器缓存后重试</li>
            <li>如问题持续，请联系管理员</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCloseFilled, RefreshRight, HomeFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const errorMessage = ref('')
const errorDetail = ref('')

onMounted(() => {
  // 从 URL 参数获取错误信息
  const error = route.query.error
  if (error) {
    try {
      errorDetail.value = decodeURIComponent(error)
      // 根据错误类型显示友好的提示
      if (errorDetail.value.includes('CAS功能未启用')) {
        errorMessage.value = '统一身份认证功能未启用'
      } else if (errorDetail.value.includes('ticket')) {
        errorMessage.value = '认证票据验证失败'
      } else if (errorDetail.value.includes('SSL') || errorDetail.value.includes('证书')) {
        errorMessage.value = '安全连接建立失败'
      } else {
        errorMessage.value = errorDetail.value
      }
    } catch (e) {
      errorMessage.value = '登录过程中出现未知错误'
    }
  }
})

const retryLogin = () => {
  router.push('/login')
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  padding: 40px 20px;
}

.error-content {
  width: 100%;
  max-width: 480px;
}

.error-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.error-icon {
  color: #ff4d4f;
  margin-bottom: 24px;
}

.error-card h2 {
  font-size: 28px;
  color: #1a1a2e;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.error-message {
  color: #666;
  font-size: 16px;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 32px;
  text-align: left;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}

.action-buttons .el-button {
  min-width: 140px;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-section {
  text-align: left;
}

.help-section :deep(.el-divider__text) {
  color: #999;
  font-size: 14px;
}

.help-list {
  margin: 16px 0 0 0;
  padding-left: 20px;
  color: #666;
  font-size: 14px;
  line-height: 2;
}

.help-list li {
  margin-bottom: 4px;
}

@media (max-width: 540px) {
  .error-card {
    padding: 32px 24px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
