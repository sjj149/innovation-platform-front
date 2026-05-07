<template>
  <div class="entry-review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>入驻审核</span>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="团队名称">
          <el-input
            v-model="searchForm.teamName"
            placeholder="搜索团队名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="申请类型">
          <el-select
            v-model="searchForm.applicationType"
            placeholder="选择类型"
            clearable
            filterable
          >
            <el-option label="个人入驻" value="INDIVIDUAL" />
            <el-option label="团队入驻" value="TEAM" />
            <el-option label="组织入驻" value="ORGANIZATION" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 申请列表 -->
      <el-table :data="applications" v-loading="loading" style="width: 100%">
        <el-table-column prop="teamName" label="团队名称" />
        <el-table-column prop="applicationType" label="申请类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ getApplicationTypeText(row.applicationType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="leaderName" label="负责人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getEntryDisplayStatusType(row)">{{ getEntryDisplayStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approvalStatus" label="审批状态" width="130">
          <template #default="{ row }">
            <el-tag :type="getEntryDisplayApprovalType(row)">{{ getEntryDisplayApprovalText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button
              v-if="row.approvalStatus === 'PENDING'"
              link
              type="success"
              @click="handleReview(row, 'APPROVED')"
            >
              通过
            </el-button>
            <el-button
              v-if="row.approvalStatus === 'PENDING'"
              link
              type="danger"
              @click="handleReview(row, 'REJECTED')"
            >
              驳回
            </el-button>
            <el-button
              v-if="row.status === 'APPROVED'"
              link
              type="warning"
              @click="handleConfirmEntry(row)"
            >
              确认入驻
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="reviewDialogVisible" :title="reviewTitle" width="600px">
      <el-form :model="reviewForm" label-width="120px">
        <el-form-item label="团队名称">
          <span>{{ currentApplication?.teamName }}</span>
        </el-form-item>
        <el-form-item label="负责人">
          <span>{{ currentApplication?.leaderName }}</span>
        </el-form-item>
        <el-form-item label="联系电话">
          <span>{{ currentApplication?.contactPhone }}</span>
        </el-form-item>
        <el-form-item label="审批意见" prop="reviewComment">
          <el-input
            v-model="reviewForm.reviewComment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEntryApplications, reviewEntryApplication, confirmEntry } from '@/api/modules/entryApplication'
import { useTable } from '@/composables/useTable'
import { STATUS_TEXT, STATUS_TYPE } from '@/constants'
import { formatDateTime } from '@/utils/format'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const { isSchoolAdmin, isCollegeAdmin } = usePermission()

const searchForm = reactive({
  teamName: '',
  approvalStatus: 'PENDING', // 默认显示待审核
  applicationType: ''
})

const { tableData: applications, loading, page, size, total, loadData, handlePageChange, handleSizeChange } = useTable(
  async (params) => {
    const query = {
      ...params,
      teamName: searchForm.teamName,
      applicationType: searchForm.applicationType || ''
    }
    if (searchForm.approvalStatus === 'PENDING') {
      // 待审核列表：学院 / 学校管理员看到不同阶段
      if (isCollegeAdmin.value) {
        query.status = 'PENDING'
        query.approvalStatus = 'PENDING'
      } else if (isSchoolAdmin.value) {
        // 学校管理员可以越级审核：查看所有 approvalStatus=PENDING 的入驻申请
        query.approvalStatus = 'PENDING'
      } else {
        query.approvalStatus = 'PENDING'
      }
    } else if (searchForm.approvalStatus) {
      query.approvalStatus = searchForm.approvalStatus
    }
    const result = await getEntryApplications(query)
    return result
  },
  { immediate: true }
)

const reviewDialogVisible = ref(false)
const reviewing = ref(false)
const currentApplication = ref(null)
const reviewAction = ref('')

const reviewForm = reactive({
  reviewComment: ''
})

const reviewTitle = computed(() => {
  return reviewAction.value === 'APPROVED' ? '审核通过' : '审核驳回'
})

const getStatusText = (status) => STATUS_TEXT[status] || status
const getStatusType = (status) => STATUS_TYPE[status] || ''

const isRejectedEntry = (row) => row?.status === 'REJECTED' || row?.approvalStatus === 'REJECTED'
const isFinalApprovedEntry = (row) => row?.status === 'ENTERED' && row?.approvalStatus === 'APPROVED'
const isWaitingSchoolEntry = (row) => row?.status === 'APPROVED' && row?.approvalStatus === 'PENDING'
const isWaitingCollegeEntry = (row) => row?.status === 'PENDING' && row?.approvalStatus === 'PENDING'

const getEntryDisplayStatusText = (row) => {
  if (isRejectedEntry(row)) return '未通过'
  if (isFinalApprovedEntry(row)) return '已入驻'
  if (isWaitingSchoolEntry(row) || isWaitingCollegeEntry(row)) return '已提交'
  return getStatusText(row?.status)
}

const getEntryDisplayApprovalText = (row) => {
  if (isRejectedEntry(row)) return '未通过'
  if (isFinalApprovedEntry(row)) return '已通过'
  if (isWaitingSchoolEntry(row)) return '待学校管理员审核'
  if (isWaitingCollegeEntry(row)) return '待学院管理员审核'
  return getStatusText(row?.approvalStatus)
}

const getEntryDisplayStatusType = (row) => {
  if (isRejectedEntry(row)) return 'danger'
  if (isFinalApprovedEntry(row)) return 'success'
  if (isWaitingSchoolEntry(row) || isWaitingCollegeEntry(row)) return 'warning'
  return getStatusType(row?.status)
}

const getEntryDisplayApprovalType = (row) => {
  if (isRejectedEntry(row)) return 'danger'
  if (isFinalApprovedEntry(row)) return 'success'
  if (isWaitingSchoolEntry(row) || isWaitingCollegeEntry(row)) return 'warning'
  return getStatusType(row?.approvalStatus)
}

const getApplicationTypeText = (type) => {
  const map = {
    'INDIVIDUAL': '个人入驻',
    'TEAM': '团队入驻',
    'ORGANIZATION': '组织入驻'
  }
  return map[type] || type
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const handleReset = () => {
  searchForm.teamName = ''
  searchForm.approvalStatus = 'PENDING'
  searchForm.applicationType = ''
  handleSearch()
}

const handleViewDetail = (application) => {
  router.push(`/entry-applications/${application.id}`)
}

const handleReview = (application, action) => {
  currentApplication.value = application
  reviewAction.value = action
  reviewForm.reviewComment = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async () => {
  reviewing.value = true
  try {
    await reviewEntryApplication(currentApplication.value.id, {
      approvalStatus: reviewAction.value,
      reviewComment: reviewForm.reviewComment
    })
    ElMessage.success('审核完成')
    reviewDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '审核失败')
  } finally {
    reviewing.value = false
  }
}

const handleConfirmEntry = async (application) => {
  try {
    await ElMessageBox.confirm('确定要确认此团队入驻吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await confirmEntry(application.id)
    ElMessage.success('入驻确认成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '确认失败')
    }
  }
}
</script>

<style scoped>
.entry-review {
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
