<template>
  <div class="cas-merge-container">
    <div class="merge-content">
      <div class="merge-card">
        <div class="card-header">
          <el-icon class="warning-icon" :size="48"><WarningFilled /></el-icon>
          <h2>检测到同名账号</h2>
          <p class="subtitle">系统发现您已有一个使用相同姓名的本地账号</p>
        </div>

        <div class="account-info">
          <h3>现有本地账号信息</h3>
          <div class="info-item">
            <span class="label">用户名：</span>
            <span class="value">{{ duplicateAccount?.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">姓名：</span>
            <span class="value">{{ duplicateAccount?.realName }}</span>
          </div>
          <div class="info-item">
            <span class="label">角色：</span>
            <el-tag :type="getRoleType(duplicateAccount?.role)" size="small">
              {{ getRoleText(duplicateAccount?.role) }}
            </el-tag>
          </div>
        </div>

        <div class="merge-options">
          <h3>请选择操作</h3>
          
          <!-- 选项1：合并账号 -->
          <div class="option-card" :class="{ active: selectedOption === 'merge' }" @click="selectedOption = 'merge'">
            <div class="option-header">
              <el-radio v-model="selectedOption" label="merge" size="large">
                <span class="option-title">合并账号（推荐）</span>
              </el-radio>
            </div>
            <div class="option-desc">
              <p>将统一身份认证与现有本地账号关联，保留所有历史数据</p>
              <ul>
                <li>保留现有账号的所有数据和权限</li>
                <li>可以使用统一身份认证或原密码登录</li>
                <li>推荐使用此选项</li>
              </ul>
            </div>
            
            <!-- 密码输入框 -->
            <div v-if="selectedOption === 'merge'" class="password-input">
              <el-input
                v-model="password"
                type="password"
                placeholder="请输入本地账号的密码进行验证"
                show-password
                size="large"
              />
            </div>
          </div>

          <!-- 选项2：创建新账号 -->
          <div class="option-card" :class="{ active: selectedOption === 'new' }" @click="selectedOption = 'new'">
            <div class="option-header">
              <el-radio v-model="selectedOption" label="new" size="large">
                <span class="option-title">创建新账号</span>
              </el-radio>
            </div>
            <div class="option-desc">
              <p>创建一个新的账号，不与现有账号关联</p>
              <ul>
                <li>创建一个全新的独立账号</li>
                <li>现有账号数据不会自动迁移</li>
                <li>仅建议使用统一身份认证登录</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <el-button @click="goBack" size="large">返回登录</el-button>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            {{ submitButtonText }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { mergeAccount, createNewAccount } from '@/api/modules/cas'
import { useUserStore } from '@/stores/user'
import { setToken, setUser } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const selectedOption = ref('merge')
const password = ref('')
const casUid = ref('')
const casName = ref('')
const duplicateAccount = ref(null)

// 从 sessionStorage 或 URL 参数获取合并数据
// 将 Latin1 字符串转换为 UTF-8 字符串（处理中文）
const latin1ToUtf8 = (str) => {
  try {
    return decodeURIComponent(escape(str))
  } catch (e) {
    return str
  }
}

onMounted(() => {
  // 优先检查 URL 参数（从后端重定向过来）
  const dataParam = route.query.data
  if (dataParam) {
    try {
      // 将 URL-safe Base64 转换为标准 Base64（后端用的是 URL 安全编码）
      const standardBase64 = dataParam
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(dataParam.length + (4 - dataParam.length % 4) % 4, '=')
      
      // Base64 解码（atob 返回的是 Latin1 编码，需要转换为 UTF-8）
      const decodedLatin1 = atob(standardBase64)
      const decodedData = latin1ToUtf8(decodedLatin1)
      const data = JSON.parse(decodedData)
      casUid.value = data.casUid
      casName.value = data.casName
      
      // 复原 duplicateAccount 信息
      if (data.duplicateAccount) {
        duplicateAccount.value = data.duplicateAccount
      } else {
        // 兼容旧版本，如果没有传输 complete 信息
        duplicateAccount.value = {
          username: data.casUid,
          realName: data.casName,
          role: 'STUDENT'
        }
      }
      return
    } catch (error) {
      console.error('解析URL数据失败:', error)
      ElMessage.error('页面数据解析失败')
      router.push('/login')
      return
    }
  }
  
  // 从 sessionStorage 获取（传统方式，用于前端直接跳转的情况）
  const mergeData = sessionStorage.getItem('cas_merge_data')
  if (!mergeData) {
    ElMessage.error('页面数据已过期，请重新登录')
    router.push('/login')
    return
  }

  try {
    const data = JSON.parse(mergeData)
    casUid.value = data.casUid
    casName.value = data.casName
    duplicateAccount.value = data.duplicateAccount
  } catch (error) {
    console.error('解析合并数据失败:', error)
    ElMessage.error('数据解析失败，请重新登录')
    router.push('/login')
  }
})

const canSubmit = computed(() => {
  if (selectedOption.value === 'merge') {
    return password.value.length > 0
  }
  return true
})

const submitButtonText = computed(() => {
  if (loading.value) return '处理中...'
  return selectedOption.value === 'merge' ? '确认合并' : '创建新账号'
})

const getRoleType = (role) => {
  const types = {
    'STUDENT': '',
    'TEACHER': 'success',
    'STUDENT_ADMIN': 'warning',
    'COLLEGE_ADMIN': 'warning',
    'SCHOOL_ADMIN': 'danger'
  }
  return types[role] || ''
}

const getRoleText = (role) => {
  const texts = {
    'STUDENT': '学生',
    'TEACHER': '教师',
    'STUDENT_ADMIN': '学生管理员',
    'COLLEGE_ADMIN': '学院管理员',
    'SCHOOL_ADMIN': '学校管理员'
  }
  return texts[role] || role
}

const goBack = () => {
  sessionStorage.removeItem('cas_merge_data')
  router.push('/login')
}

const handleSubmit = async () => {
  loading.value = true

  try {
    if (selectedOption.value === 'merge') {
      await handleMerge()
    } else {
      await handleCreateNew()
    }
  } finally {
    loading.value = false
  }
}

const handleMerge = async () => {
  try {
    // handleResponse 返回的是 data 部分，不是整个响应
    const data = await mergeAccount({
      casUid: casUid.value,
      realName: casName.value,
      password: password.value
    })

    // 合并成功，直接使用返回的数据
    setToken(data.token)
    setUser(data.user)
    userStore.token = data.token
    userStore.setUser(data.user)
    
    sessionStorage.removeItem('cas_merge_data')
    ElMessage.success('账号合并成功！')
    
    if (data.needCompleteProfile) {
      router.push('/complete-profile')
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('合并账号失败:', error)
    ElMessage.error('合并失败: ' + (error.message || '密码错误或网络异常'))
  }
}

const handleCreateNew = async () => {
  try {
    const confirm = await ElMessageBox.confirm(
      '创建新账号后，您的现有账号数据将无法自动迁移。是否继续？',
      '确认创建新账号',
      {
        confirmButtonText: '确认创建',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirm) {
      // handleResponse 返回的是 data 部分
      const data = await createNewAccount(casUid.value, casName.value)

      setToken(data.token)
      setUser(data.user)
      userStore.token = data.token
      userStore.setUser(data.user)
      
      sessionStorage.removeItem('cas_merge_data')
      ElMessage.success('新账号创建成功！')
      
      if (data.needCompleteProfile) {
        router.push('/complete-profile')
      } else {
        router.push('/dashboard')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建新账号失败:', error)
      ElMessage.error('创建失败: ' + (error.message || '网络异常'))
    }
  }
}
</script>

<style scoped>
.cas-merge-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 40px 20px;
}

.merge-content {
  width: 100%;
  max-width: 600px;
}

.merge-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.warning-icon {
  color: #faad14;
  margin-bottom: 16px;
}

.card-header h2 {
  font-size: 24px;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.account-info {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.account-info h3 {
  font-size: 16px;
  color: #389e0d;
  margin: 0 0 16px 0;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
  width: 80px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.merge-options {
  margin-bottom: 24px;
}

.merge-options h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 16px 0;
}

.option-card {
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.option-card.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.option-header {
  margin-bottom: 12px;
}

.option-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.option-desc {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.option-desc p {
  margin: 0 0 8px 0;
}

.option-desc ul {
  margin: 0;
  padding-left: 20px;
}

.option-desc li {
  margin-bottom: 4px;
}

.password-input {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #d9d9d9;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-buttons .el-button {
  min-width: 120px;
  height: 44px;
  border-radius: 8px;
}

@media (max-width: 540px) {
  .merge-card {
    padding: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
