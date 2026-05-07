<template>
  <div class="complete-profile-container">
    <div class="profile-content">
      <div class="profile-card">
        <div class="card-header">
          <el-icon class="success-icon" :size="48"><CircleCheckFilled /></el-icon>
          <h2>登录成功</h2>
          <p class="subtitle">请完善您的个人资料以继续使用系统</p>
        </div>

        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          class="profile-form"
          label-position="top"
        >
          <el-form-item label="真实姓名" prop="realName">
            <el-input
              v-model="profileForm.realName"
              placeholder="请输入真实姓名"
              size="large"
              disabled
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="profileForm.email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="profileForm.phone"
              placeholder="请输入手机号码"
              size="large"
              :prefix-icon="Phone"
              maxlength="11"
            />
          </el-form-item>

          <el-form-item label="所属学院" prop="collegeId">
            <el-select
              v-model="profileForm.collegeId"
              placeholder="请选择所属学院"
              size="large"
              style="width: 100%"
            >
              <el-option
                v-for="college in collegeList"
                :key="college.id"
                :label="college.name"
                :value="college.id"
              />
            </el-select>
          </el-form-item>

          <!-- 角色由统一身份认证或注册时确定，不允许用户修改 -->
          <el-form-item label="身份类型">
            <div class="role-display">
              <el-tag :type="profileForm.role === 'TEACHER' ? 'success' : ''" size="large">
                {{ profileForm.role === 'TEACHER' ? '教师' : '学生' }}
              </el-tag>
            </div>
            <div class="role-hint">身份由统一身份认证系统自动确定，不可修改</div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleSubmit"
            >
              {{ loading ? '保存中...' : '保存并继续' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 加载错误提示 -->
        <div v-if="loadError" class="error-section">
          <el-alert
            :title="loadError"
            type="error"
            :closable="false"
            show-icon
          />
          <el-button type="primary" @click="retryLoad" style="margin-top: 16px;">
            刷新页面重试
          </el-button>
        </div>

        <div class="skip-section" v-else>
          <el-button link type="info" @click="handleSkip">
            稍后完善，先进入系统
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Message, Phone } from '@element-plus/icons-vue'
import { completeProfile } from '@/api/modules/cas'
import { getCurrentUser } from '@/api/modules/auth'
import { useUserStore } from '@/stores/user'
import { getUser, setToken, setUser } from '@/utils/storage'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loadError = ref('')  // 加载错误信息
const profileFormRef = ref(null)
const collegeList = ref([])

const profileForm = reactive({
  realName: '',
  email: '',
  phone: '',
  collegeId: null,
  role: 'STUDENT'
})

const profileRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
  ],
  collegeId: [
    { required: true, message: '请选择所属学院', trigger: 'change' }
  ]
  // 角色不允许修改，无需验证
}

// 获取学院列表
const fetchColleges = async () => {
  try {
    const res = await api.get('/colleges')
    if (res.data.code === 200) {
      collegeList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取学院列表失败:', error)
  }
}

// 刷新页面重试
const retryLoad = () => {
  window.location.reload()
}

// 获取当前用户信息
onMounted(async () => {
  await fetchColleges()
  
  // 检查URL是否有token参数（从CAS回调重定向过来）
  const token = route.query.token
  console.log('[CompleteProfile] URL token:', token ? '存在' : '不存在')
  
  if (token) {
    // 先保存token到localStorage（这是最重要的，确保API请求能够带上token）
    setToken(token)
    userStore.token = token
    console.log('[CompleteProfile] Token 已保存到 store 和 localStorage')
    
    // 获取用户信息（尝试多次，处理时序问题）
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        console.log(`[CompleteProfile] 尝试获取用户信息 (${retryCount + 1}/${maxRetries})...`)
        
        // 每次尝试间隔 500ms
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        const user = await getCurrentUser()
        console.log('[CompleteProfile] 用户信息响应:', user)
        
        if (user) {
          setUser(user)
          userStore.setUser(user)
          console.log('[CompleteProfile] 用户信息已保存:', user.username)
          
          // 填充表单（角色只显示，不允许修改）
          profileForm.realName = user.realName || ''
          if (user.email) profileForm.email = user.email
          if (user.phone) profileForm.phone = user.phone
          if (user.collegeId) profileForm.collegeId = user.collegeId
          if (user.role) profileForm.role = user.role  // 仅用于显示
          
          // 成功后跳出循环
          break
        } else {
          throw new Error('获取用户信息失败: 返回数据为空')
        }
      } catch (error) {
        retryCount++
        console.error(`[CompleteProfile] 第 ${retryCount} 次获取失败:`, error)
        
        if (retryCount >= maxRetries) {
          loadError.value = '获取用户信息失败，请点击下方按钮刷新页面重试'
          // 不跳转到登录页，让用户可以刷新页面重试
          return
        }
      }
    }
    return
  }
  
  // 从 userStore 或 localStorage 获取用户信息
  let user = userStore.user
  if (!user) {
    user = getUser()
  }
  
  if (user) {
    profileForm.realName = user.realName || ''
    // 如果用户已有部分信息，预填充（角色仅显示不修改）
    if (user.email) profileForm.email = user.email
    if (user.phone) profileForm.phone = user.phone
    if (user.collegeId) profileForm.collegeId = user.collegeId
    if (user.role) profileForm.role = user.role
  } else {
    ElMessage.error('获取用户信息失败，请重新登录')
    router.push('/login')
  }
})

const handleSubmit = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 不传递 role，由后端保持原有角色（CAS返回或默认学生）
        const submitData = {
          email: profileForm.email,
          phone: profileForm.phone,
          collegeId: profileForm.collegeId
        }
        
        const res = await completeProfile(submitData)
        
        if (res.code === 200) {
          // 更新本地存储的用户信息
          const currentUser = getUser()
          if (currentUser) {
            currentUser.email = profileForm.email
            currentUser.phone = profileForm.phone
            currentUser.collegeId = profileForm.collegeId
            // 不更新 role，保持原有角色
            currentUser.isProfileComplete = 1
            
            // 找到学院名称
            const college = collegeList.value.find(c => c.id === profileForm.collegeId)
            if (college) {
              currentUser.collegeName = college.name
            }
            
            userStore.setUser(currentUser)
          }
          
          ElMessage.success('资料完善成功！')
          router.push('/dashboard')
        } else {
          ElMessage.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('完善资料失败:', error)
        ElMessage.error('保存失败: ' + (error.message || '网络异常'))
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSkip = () => {
  ElMessage.info('您可以稍后进入"个人设置"完善资料')
  router.push('/dashboard')
}
</script>

<style scoped>
.complete-profile-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 40px 20px;
}

.profile-content {
  width: 100%;
  max-width: 500px;
}

.profile-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.success-icon {
  color: #52c41a;
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

.profile-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

.profile-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e8e8e8;
  padding: 4px 15px;
}

.profile-form :deep(.el-input__wrapper:hover) {
  border-color: #1890ff;
}

.profile-form :deep(.el-input__wrapper.is-focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}

.profile-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
}

.profile-form :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4);
}

.skip-section {
  text-align: center;
  margin-top: 16px;
}

.role-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  line-height: 1.5;
}

.role-display {
  padding: 8px 0;
}

.error-section {
  text-align: center;
  margin-top: 16px;
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
}

@media (max-width: 540px) {
  .profile-card {
    padding: 24px;
  }
}
</style>
