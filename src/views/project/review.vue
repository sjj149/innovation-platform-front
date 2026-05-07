<template>
  <div class="project-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目审核</span>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.title"
            placeholder="搜索项目标题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 项目列表 -->
      <el-table :data="projectList" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="项目标题" show-overflow-tooltip min-width="180" />
        <el-table-column prop="leaderName" label="负责人" width="120" />
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getProjectDisplayStatusType(row)">{{ getProjectDisplayStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approvalStatus" label="审批状态" width="140">
          <template #default="{ row }">
            <el-tag :type="getProjectDisplayApprovalType(row)">{{ getProjectDisplayApprovalText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button
              v-if="canReviewProject(row)"
              link
              type="success"
              @click="handleReview(row, 'APPROVED')"
            >
              通过
            </el-button>
            <el-button
              v-if="canReviewProject(row)"
              link
              type="danger"
              @click="handleReview(row, 'REJECTED')"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && projectList.length === 0" description="暂无项目数据" />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="reviewDialogVisible" :title="reviewTitle" width="600px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="项目标题">
          <span>{{ currentProject?.title }}</span>
        </el-form-item>
        <el-form-item label="负责人">
          <span>{{ currentProject?.leaderName }}</span>
        </el-form-item>
        <el-form-item label="项目类别">
          <span>{{ currentProject?.category }}</span>
        </el-form-item>
        <el-form-item label="审核意见" prop="reviewComment">
          <el-input
            v-model="reviewForm.reviewComment"
            type="textarea"
            :rows="4"
            :placeholder="reviewAction === 'REJECTED' ? '请输入拒绝原因（必填）' : '请输入审核意见（选填）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewing" @click="handleSubmitReview">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProjects, reviewProject } from '@/api/modules/project'
import { formatDateTime } from '@/utils/format'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const { isCollegeAdmin, isSchoolAdmin } = usePermission()

const searchForm = reactive({
  title: '',
  status: 'PENDING' // 默认显示待审核
})

const projectList = ref([])
const loading = ref(false)

const getStatusType = (status) => {
  const statusMap = {
    DRAFT: 'info',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    IN_PROGRESS: '',
    COMPLETED: 'success'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成'
  }
  return statusMap[status] || status
}

const isEndedProject = (row) => {
  if (!row?.endTime) return false
  const end = new Date(row.endTime)
  return !Number.isNaN(end.getTime()) && end.getTime() <= Date.now()
}

const isRejectedProject = (row) => row?.status === 'REJECTED' || row?.approvalStatus === 'REJECTED'
const isFinalApprovedProject = (row) => row?.status === 'APPROVED' && row?.approvalStatus === 'APPROVED'
const isWaitingSchoolProject = (row) => row?.status === 'APPROVED' && row?.approvalStatus === 'PENDING'
const isWaitingCollegeProject = (row) => row?.status === 'PENDING' && row?.approvalStatus === 'PENDING'

const getProjectDisplayStatusText = (row) => {
  if (row?.status === 'DRAFT') return '草稿'
  if (isRejectedProject(row)) return '未通过'
  if (isWaitingSchoolProject(row) || isWaitingCollegeProject(row)) return '已提交'
  if (isFinalApprovedProject(row)) return isEndedProject(row) ? '已结束' : '进行中'
  return getStatusText(row?.status)
}

const getProjectDisplayApprovalText = (row) => {
  if (row?.status === 'DRAFT') return ''
  if (isRejectedProject(row)) return '未通过'
  if (isWaitingSchoolProject(row)) return '待学校管理员审核'
  if (isWaitingCollegeProject(row)) return '待学院管理员审核'
  if (isFinalApprovedProject(row)) return '已通过'
  return getStatusText(row?.approvalStatus)
}

const getProjectDisplayStatusType = (row) => {
  if (row?.status === 'DRAFT') return 'info'
  if (isRejectedProject(row)) return 'danger'
  if (isWaitingSchoolProject(row) || isWaitingCollegeProject(row)) return 'warning'
  if (isFinalApprovedProject(row)) return isEndedProject(row) ? 'success' : ''
  return getStatusType(row?.status)
}

const getProjectDisplayApprovalType = (row) => {
  if (isRejectedProject(row)) return 'danger'
  if (isWaitingSchoolProject(row) || isWaitingCollegeProject(row)) return 'warning'
  if (isFinalApprovedProject(row)) return 'success'
  return getStatusType(row?.approvalStatus)
}

const canReviewProject = (row) => {
  if (!row || row.approvalStatus !== 'PENDING') return false
  if (isCollegeAdmin.value && isWaitingCollegeProject(row)) return true
  // 学校管理员可以越级审核学院待审项目
  if (isSchoolAdmin.value && (isWaitingSchoolProject(row) || isWaitingCollegeProject(row))) return true
  return false
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.title) params.title = searchForm.title
    const data = await getProjects(params)
    const list = Array.isArray(data) ? data : []
    if (searchForm.title) {
      projectList.value = list.filter(item =>
        item.title && item.title.toLowerCase().includes(searchForm.title.toLowerCase())
      )
    } else {
      projectList.value = list
    }
  } catch (error) {
    ElMessage.error(error?.message || '加载项目列表失败')
    projectList.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.status = 'PENDING'
  loadData()
}

const handleViewDetail = (project) => {
  router.push(`/projects/${project.id}`)
}

const reviewDialogVisible = ref(false)
const reviewing = ref(false)
const currentProject = ref(null)
const reviewAction = ref('')

const reviewForm = reactive({
  reviewComment: ''
})

const reviewTitle = computed(() => {
  return reviewAction.value === 'APPROVED' ? '审核通过' : '审核拒绝'
})

const handleReview = (project, action) => {
  currentProject.value = project
  reviewAction.value = action
  reviewForm.reviewComment = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async () => {
  if (reviewAction.value === 'REJECTED' && !reviewForm.reviewComment?.trim()) {
    ElMessage.warning('拒绝时请填写拒绝原因')
    return
  }
  reviewing.value = true
  try {
    await reviewProject(currentProject.value.id, {
      status: reviewAction.value,
      reviewComment: reviewForm.reviewComment || ''
    })
    ElMessage.success('审核完成')
    reviewDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '审核失败')
  } finally {
    reviewing.value = false
  }
}

loadData()
</script>

<style scoped>
.project-review {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
