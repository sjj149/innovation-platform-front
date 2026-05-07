<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
        </div>
      </template>

      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-position="top"
        class="profile-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属学院" prop="collegeId">
              <el-select
                v-model="profileForm.collegeId"
                placeholder="请选择学院"
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-tag :type="getRoleType(profileForm.role)">
                {{ getRoleText(profileForm.role) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            {{ saving ? '保存中...' : '保存修改' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 认证方式信息 -->
    <el-card class="auth-card" v-if="authInfo.authType">
      <template #header>
        <div class="card-header">
          <h2>账号认证方式</h2>
        </div>
      </template>

      <div class="auth-info">
        <div class="auth-item">
          <span class="label">当前认证方式：</span>
          <el-tag :type="getAuthTypeTag(authInfo.authType)" size="large">
            {{ getAuthTypeText(authInfo.authType) }}
          </el-tag>
        </div>

        <div class="auth-item" v-if="authInfo.casUid">
          <span class="label">统一身份认证账号：</span>
          <span class="value">{{ authInfo.casUid }}</span>
        </div>

        <div class="auth-actions">
          <el-button
            v-if="authInfo.authType === 'LOCAL'"
            type="success"
            @click="handleBindCas"
          >
            <el-icon><Link /></el-icon>
            绑定统一身份认证
          </el-button>
          
          <el-button
            v-if="authInfo.authType === 'BOTH'"
            type="danger"
            plain
            @click="handleUnbindCas"
          >
            <el-icon><Link /></el-icon>
            解绑统一身份认证
          </el-button>
        </div>

        <el-alert
          v-if="authInfo.authType === 'CAS'"
          title="您当前仅使用统一身份认证登录，无法修改密码"
          type="info"
          :closable="false"
          show-icon
          class="auth-alert"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getUser, setUser } from '@/utils/storage'
import api from '@/api'
import { casLogin } from '@/api/modules/cas'

const userStore = useUserStore()

const profileFormRef = ref(null)
const saving = ref(false)
const collegeList = ref([])

const profileForm = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  collegeId: null,
  role: ''
})

const authInfo = reactive({
  authType: '',
  casUid: '',
  isProfileComplete: 1
})

const profileRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  collegeId: [
    { required: true, message: '请选择学院', trigger: 'change' }
  ]
}

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

const getAuthTypeTag = (type) => {
  const types = {
    'LOCAL': 'info',
    'CAS': 'success',
    'BOTH': 'warning'
  }
  return types[type] || 'info'
}

const getAuthTypeText = (type) => {
  const texts = {
    'LOCAL': '本地密码认证',
    'CAS': '统一身份认证',
    'BOTH': '本地密码 + 统一身份认证'
  }
  return texts[type] || type
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

// 获取认证信息
const fetchAuthInfo = async () => {
  try {
    const res = await api.get('/users/me/auth-info')
    if (res.data.code === 200) {
      const data = res.data.data
      authInfo.authType = data.authType
      authInfo.casUid = data.casUid
      authInfo.isProfileComplete = data.isProfileComplete
    }
  } catch (error) {
    console.error('获取认证信息失败:', error)
  }
}

// 加载用户信息
const loadUserInfo = () => {
  const user = userStore.user || getUser()
  if (user) {
    profileForm.username = user.username || ''
    profileForm.realName = user.realName || ''
    profileForm.email = user.email || ''
    profileForm.phone = user.phone || ''
    profileForm.collegeId = user.collegeId || null
    profileForm.role = user.role || ''
  }
}

const handleSave = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        const updateData = {
          realName: profileForm.realName,
          email: profileForm.email,
          phone: profileForm.phone,
          collegeId: profileForm.collegeId
        }
        
        const res = await api.put('/users/me', updateData)
        
        if (res.data.code === 200) {
          // 更新本地存储
          const currentUser = getUser()
          if (currentUser) {
            currentUser.realName = profileForm.realName
            currentUser.email = profileForm.email
            currentUser.phone = profileForm.phone
            currentUser.collegeId = profileForm.collegeId
            const college = collegeList.value.find(c => c.id === profileForm.collegeId)
            if (college) {
              currentUser.collegeName = college.name
            }
            userStore.setUser(currentUser)
          }
          
          ElMessage.success('资料保存成功')
        } else {
          ElMessage.error(res.data.message || '保存失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败: ' + (error.message || '网络异常'))
      } finally {
        saving.value = false
      }
    }
  })
}

const handleBindCas = () => {
  ElMessageBox.confirm(
    '绑定统一身份认证后，您可以使用统一身份认证登录系统。是否继续？',
    '绑定统一身份认证',
    {
      confirmButtonText: '去绑定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 跳转到CAS登录页面进行绑定
    // 实际实现中可能需要额外的绑定流程
    casLogin()
  }).catch(() => {})
}

const handleUnbindCas = () => {
  ElMessageBox.confirm(
    '解绑后您将无法使用统一身份认证登录，是否继续？',
    '解绑统一身份认证',
    {
      confirmButtonText: '确认解绑',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用解绑接口
      const res = await api.post('/auth/cas/unbind')
      if (res.data.code === 200) {
        ElMessage.success('解绑成功')
        fetchAuthInfo()
      } else {
        ElMessage.error(res.data.message || '解绑失败')
      }
    } catch (error) {
      ElMessage.error('解绑失败: ' + (error.message || '网络异常'))
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchColleges()
  loadUserInfo()
  fetchAuthInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card,
.auth-card {
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.profile-form {
  margin-top: 20px;
}

.auth-info {
  padding: 10px 0;
}

.auth-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.auth-item .label {
  color: #666;
  width: 140px;
}

.auth-item .value {
  color: #333;
  font-weight: 500;
}

.auth-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.auth-alert {
  margin-top: 16px;
}
</style>
