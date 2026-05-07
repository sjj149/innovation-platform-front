<template>
  <div class="users-management">
    <PageHeader title="用户管理" description="管理系统用户，包括创建、编辑、禁用、导入等操作">
      <template #actions>
        <el-button type="success" :icon="Upload" @click="handleImport">
          导入用户
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          创建用户
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索表单 -->
    <SearchForm :model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="用户名">
        <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
      </el-form-item>
      <el-form-item label="学号/工号">
        <el-input v-model="searchForm.casUid" placeholder="请输入学号或工号" clearable />
      </el-form-item>
      <el-form-item label="真实姓名">
        <el-input v-model="searchForm.realName" placeholder="请输入真实姓名" clearable />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="searchForm.role" placeholder="请选择角色" clearable style="width: 160px">
          <el-option label="学生" value="STUDENT" />
          <el-option label="教师" value="TEACHER" />
          <el-option label="学生管理员" value="STUDENT_ADMIN" />
          <el-option label="学院管理员" value="COLLEGE_ADMIN" />
          <el-option label="学校管理员" value="SCHOOL_ADMIN" />
        </el-select>
      </el-form-item>
      <el-form-item label="学院">
        <el-select v-model="searchForm.collegeId" placeholder="请选择学院" clearable style="width: 180px">
          <el-option
            v-for="college in collegeList"
            :key="college.id"
            :label="college.name"
            :value="college.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 140px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </SearchForm>

    <!-- 统计信息 -->
    <div class="statistics-bar">
      <el-tag size="large" type="info">
        <el-icon><User /></el-icon>
        总注册人数：<strong>{{ total }}</strong> 人
      </el-tag>
    </div>

    <!-- 数据表格 -->
    <DataTable
      :data="userList"
      :loading="loading"
      :show-index="true"
    >
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="casUid" label="学号/工号" min-width="120">
        <template #default="{ row }">
          <span v-if="row.casUid" class="cas-uid-text">{{ row.casUid }}</span>
          <span v-else class="no-cas-uid">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="realName" label="真实姓名" min-width="120" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="getRoleType(row.role)">{{ getRoleName(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="authType" label="认证方式" width="100">
        <template #default="{ row }">
          <el-tag :type="getAuthType(row.authType)" size="small">
            {{ getAuthTypeName(row.authType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="collegeName" label="所属学院" min-width="150" show-overflow-tooltip />
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="(val) => handleStatusChange(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="warning" :icon="Key" @click="handleResetPassword(row)">重置密码</el-button>
          <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </DataTable>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="searchForm.pageNum"
        v-model:page-size="searchForm.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '创建用户'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isEdit ? '新密码' : '密码'" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
                <el-option label="学生" value="STUDENT" />
                <el-option label="教师" value="TEACHER" />
                <el-option label="学生管理员" value="STUDENT_ADMIN" />
                <el-option label="学院管理员" value="COLLEGE_ADMIN" />
                <el-option label="学校管理员" value="SCHOOL_ADMIN" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="所属学院" prop="collegeId">
          <el-select v-model="form.collegeId" placeholder="请选择所属学院" clearable style="width: 100%">
            <el-option
              v-for="college in collegeList"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="重置密码"
      width="400px"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入用户对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入用户"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        accept=".xlsx,.xls"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传 .xlsx 或 .xls 格式的 Excel 文件
          </div>
        </template>
      </el-upload>
      
      <el-divider />
      
      <div class="template-info">
        <h4>Excel 模板说明</h4>
        <p>请按照以下列顺序填写数据：</p>
        <el-table :data="templateColumns" size="small" border style="width: 100%">
          <el-table-column prop="column" label="列名" width="100" />
          <el-table-column prop="required" label="必填" width="60">
            <template #default="{ row }">
              <el-tag v-if="row.required" type="danger" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
        </el-table>
        <p class="note">注：角色可选值：STUDENT（学生）、TEACHER（教师）、STUDENT_ADMIN（学生管理员）、COLLEGE_ADMIN（学院管理员）、SCHOOL_ADMIN（学校管理员）</p>
      </div>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportSubmit">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Key, Upload, UploadFilled, User } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import {
  getUserList,
  createUser,
  updateUser,
  updateUserStatus,
  resetPassword,
  deleteUser,
  importUsers
} from '@/api/modules/userAdmin'
import { getAllColleges } from '@/api/modules/college'

// 搜索表单
const searchForm = reactive({
  username: '',
  casUid: '',
  realName: '',
  role: '',
  collegeId: '',
  status: '',
  pageNum: 1,
  pageSize: 10
})

// 表格数据
const userList = ref([])
const total = ref(0)
const loading = ref(false)
const collegeList = ref([])

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const form = reactive({
  id: '',
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  role: '',
  collegeId: '',
  status: 1
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { 
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'))
        } else if (value && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(value)) {
          callback(new Error('密码至少6位，包含字母和数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  collegeId: [{ required: true, message: '请选择所属学院', trigger: 'change' }]
}

// 重置密码对话框
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  userId: '',
  newPassword: ''
})
const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { 
      pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, 
      message: '密码至少6位，包含字母和数字', 
      trigger: 'blur' 
    }
  ]
}

// 获取角色名称
const getRoleName = (role) => {
  const roleMap = {
    'STUDENT': '学生',
    'TEACHER': '教师',
    'STUDENT_ADMIN': '学生管理员',
    'COLLEGE_ADMIN': '学院管理员',
    'SCHOOL_ADMIN': '学校管理员'
  }
  return roleMap[role] || role
}

// 获取角色标签类型
const getRoleType = (role) => {
  const typeMap = {
    'STUDENT': 'info',
    'TEACHER': 'success',
    'STUDENT_ADMIN': 'warning',
    'COLLEGE_ADMIN': 'warning',
    'SCHOOL_ADMIN': 'danger'
  }
  return typeMap[role] || 'info'
}

// 获取认证方式名称
const getAuthTypeName = (authType) => {
  const typeMap = {
    'LOCAL': '本地',
    'CAS': '统一认证',
    'BOTH': '双认证'
  }
  return typeMap[authType] || authType || '本地'
}

// 获取认证方式标签类型
const getAuthType = (authType) => {
  const typeMap = {
    'LOCAL': 'info',
    'CAS': 'success',
    'BOTH': 'warning'
  }
  return typeMap[authType] || 'info'
}

// 获取学院列表
const fetchColleges = async () => {
  try {
    const data = await getAllColleges()
    collegeList.value = data || []
  } catch (error) {
    ElMessage.error('获取学院列表失败')
  }
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {}
    Object.keys(searchForm).forEach(key => {
      if (searchForm[key] !== '' && searchForm[key] !== null) {
        params[key] = searchForm[key]
      }
    })
    const res = await getUserList(params)
    userList.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  searchForm.pageNum = 1
  fetchUserList()
}

// 重置搜索
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'pageNum') {
      searchForm[key] = 1
    } else if (key === 'pageSize') {
      searchForm[key] = 10
    } else {
      searchForm[key] = ''
    }
  })
  fetchUserList()
}

// 每页条数变化
const handleSizeChange = (size) => {
  searchForm.pageSize = size
  searchForm.pageNum = 1
  fetchUserList()
}

// 页码变化
const handlePageChange = (page) => {
  searchForm.pageNum = page
  fetchUserList()
}

// 创建用户
const handleCreate = () => {
  isEdit.value = false
  Object.keys(form).forEach(key => {
    form[key] = key === 'status' ? 1 : ''
  })
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  isEdit.value = true
  Object.keys(form).forEach(key => {
    form[key] = row[key] || ''
  })
  form.password = '' // 清空密码
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        const { id, password, ...updateData } = form
        if (password) {
          await updateUser(id, { ...updateData, password })
        } else {
          await updateUser(id, updateData)
        }
        ElMessage.success('更新用户成功')
      } else {
        await createUser(form)
        ElMessage.success('创建用户成功')
      }
      dialogVisible.value = false
      fetchUserList()
    } catch (error) {
      ElMessage.error(error.message || (isEdit.value ? '更新失败' : '创建失败'))
    } finally {
      submitLoading.value = false
    }
  })
}

// 状态变更
const handleStatusChange = async (row, status) => {
  try {
    await updateUserStatus(row.id, status)
    ElMessage.success(status === 1 ? '用户已启用' : '用户已禁用')
  } catch (error) {
    row.status = status === 1 ? 0 : 1 // 恢复原状态
    ElMessage.error('状态更新失败')
  }
}

// 重置密码
const handleResetPassword = (row) => {
  passwordForm.userId = row.id
  passwordForm.newPassword = ''
  passwordDialogVisible.value = true
}

// 提交重置密码
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    passwordLoading.value = true
    try {
      await resetPassword(passwordForm.userId, passwordForm.newPassword)
      ElMessage.success('密码重置成功')
      passwordDialogVisible.value = false
    } catch (error) {
      ElMessage.error(error.message || '密码重置失败')
    } finally {
      passwordLoading.value = false
    }
  })
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchColleges()
  fetchUserList()
})

// 导入对话框
const importDialogVisible = ref(false)
const importLoading = ref(false)
const uploadRef = ref(null)
const fileList = ref([])
const currentFile = ref(null)

const templateColumns = [
  { column: '用户名', required: true, description: '唯一标识，不可重复' },
  { column: '密码', required: true, description: '初始密码，建议后续修改' },
  { column: '真实姓名', required: true, description: '用户真实姓名' },
  { column: '邮箱', required: false, description: '联系邮箱' },
  { column: '手机号', required: false, description: '联系手机' },
  { column: '角色', required: true, description: 'STUDENT/TEACHER/STUDENT_ADMIN/COLLEGE_ADMIN/SCHOOL_ADMIN' },
  { column: '学院ID', required: false, description: '所属学院ID（与学院名称二选一）' },
  { column: '学院名称', required: false, description: '所属学院名称（与学院ID二选一）' },
  { column: '状态', required: false, description: '1-启用，0-禁用，默认启用' }
]

// 打开导入对话框
const handleImport = () => {
  fileList.value = []
  currentFile.value = null
  importDialogVisible.value = true
}

// 文件变化
const handleFileChange = (file) => {
  currentFile.value = file.raw
}

// 文件移除
const handleFileRemove = () => {
  currentFile.value = null
}

// 提交导入
const handleImportSubmit = async () => {
  if (!currentFile.value) {
    ElMessage.warning('请选择要导入的 Excel 文件')
    return
  }
  
  importLoading.value = true
  try {
    const res = await importUsers(currentFile.value)
    ElMessage.success(res.message || '导入成功')
    importDialogVisible.value = false
    fetchUserList()
  } catch (error) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}
</script>

<style scoped>
.users-management {
  padding: 24px;
}

.statistics-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.statistics-bar .el-tag {
  font-size: 14px;
  padding: 12px 16px;
}

.statistics-bar .el-icon {
  margin-right: 6px;
  vertical-align: middle;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.template-info {
  margin-top: 16px;
}

.template-info h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.template-info p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
}

.template-info .note {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.cas-uid-text {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #1890ff;
}

.no-cas-uid {
  color: #999;
}
</style>
