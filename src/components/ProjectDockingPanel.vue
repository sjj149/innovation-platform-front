<template>
  <div class="project-docking-panel">
    <div class="panel-actions">
      <el-button
        v-if="canApplyToProject"
        type="primary"
        plain
        @click="projectJoinVisible = true"
      >
        主动申请加入项目
      </el-button>
      <el-button
        v-if="isLeader"
        type="success"
        @click="recruitmentVisible = true"
      >
        发布招募
      </el-button>
    </div>

    <el-card class="panel-card">
      <template #header>
        <div class="panel-card-header">
          <span>{{ canReviewApplications ? '项目主动申请' : '我的主动申请' }}</span>
          <el-button text @click="loadData" :loading="loading">刷新</el-button>
        </div>
      </template>

      <el-empty
        v-if="!loading && filteredProjectApplications.length === 0"
        description="暂无主动申请"
        :image-size="60"
      />
      <el-table v-else :data="filteredProjectApplications" border size="small">
        <el-table-column prop="applicantName" label="申请人" width="110" />
        <el-table-column prop="desiredPosition" label="申请职位" width="120" />
        <el-table-column prop="applicantCollegeName" label="学院" width="130" />
        <el-table-column prop="applicantMajor" label="专业" width="130" />
        <el-table-column prop="qualifications" label="特长" min-width="180" show-overflow-tooltip />
        <el-table-column label="简历" width="90">
          <template #default="{ row }">
            <el-link v-if="row.resumeUrl" :href="row.resumeUrl" target="_blank" type="primary">查看</el-link>
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="applicationContent" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getApprovalTagType(row.approvalStatus)" size="small">
              {{ getApprovalText(row.approvalStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="isLeader && row.approvalStatus === 'PENDING'">
              <el-button link type="success" @click="handleReviewProjectApplication(row, 'APPROVED')">通过</el-button>
              <el-button link type="danger" @click="handleReviewProjectApplication(row, 'REJECTED')">拒绝</el-button>
            </template>
            <el-button
              v-else-if="isOwnerApplication(row) && row.approvalStatus === 'PENDING'"
              link
              type="warning"
              @click="handleWithdrawProjectApplication(row)"
            >
              撤回
            </el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="panel-card">
      <template #header>
        <div class="panel-card-header">
          <span>项目招募</span>
          <div class="panel-card-actions">
            <span class="panel-tip">共 {{ recruitments.length }} 条</span>
          </div>
        </div>
      </template>

      <el-empty
        v-if="!loading && recruitments.length === 0"
        description="暂无招募"
        :image-size="60"
      />

      <div v-else class="recruitment-list">
        <el-card
          v-for="recruitment in recruitments"
          :key="recruitment.id"
          class="recruitment-card"
          shadow="never"
        >
          <template #header>
            <div class="recruitment-header">
              <div>
                <div class="recruitment-title">{{ recruitment.positionName }}</div>
                <div class="recruitment-meta">
                  发布时间：{{ formatDateTime(recruitment.createTime) }}
                </div>
              </div>
              <div class="recruitment-actions">
                <el-button
                  v-if="canApplyToRecruitment"
                  type="primary"
                  link
                  @click="openRecruitmentApply(recruitment)"
                >
                  根据招募申请
                </el-button>
                <el-button
                  v-if="isLeader"
                  type="danger"
                  link
                  @click="handleDeleteRecruitment(recruitment)"
                >
                  删除招募
                </el-button>
              </div>
            </div>
          </template>

          <div class="recruitment-content">
            <div><strong>任务说明：</strong>{{ recruitment.taskDescription }}</div>
            <div><strong>学院偏好：</strong>{{ recruitment.collegePreference || '不限' }}</div>
            <div><strong>专业偏好：</strong>{{ recruitment.majorPreference || '不限' }}</div>
            <div><strong>需要回答的问题：</strong>{{ recruitment.questionContent || '无' }}</div>
          </div>

          <div class="recruitment-application-block">
            <div class="sub-title">{{ canReviewApplications ? '招募申请列表' : '我的招募申请' }}</div>
            <el-empty
              v-if="applicationsByRecruitment[recruitment.id]?.length === 0"
              description="暂无申请"
              :image-size="48"
            />
            <el-table
              v-else
              :data="applicationsByRecruitment[recruitment.id] || []"
              border
              size="small"
            >
              <el-table-column prop="applicantName" label="申请人" width="110" />
              <el-table-column prop="desiredPosition" label="申请职位" width="120" />
              <el-table-column prop="applicantCollegeName" label="学院" width="130" />
              <el-table-column prop="applicantMajor" label="专业" width="130" />
              <el-table-column prop="qualifications" label="特长" min-width="180" show-overflow-tooltip />
              <el-table-column prop="answerContent" label="问题回答" min-width="180" show-overflow-tooltip />
              <el-table-column label="简历" width="90">
                <template #default="{ row }">
                  <el-link v-if="row.resumeUrl" :href="row.resumeUrl" target="_blank" type="primary">查看</el-link>
                  <span v-else>无</span>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
              <el-table-column label="状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="getApprovalTagType(row.approvalStatus)" size="small">
                    {{ getApprovalText(row.approvalStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="申请时间" width="170">
                <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <template v-if="isLeader && row.approvalStatus === 'PENDING'">
                    <el-button link type="success" @click="handleReviewRecruitmentApplication(row, 'APPROVED')">通过</el-button>
                    <el-button link type="danger" @click="handleReviewRecruitmentApplication(row, 'REJECTED')">拒绝</el-button>
                  </template>
                  <el-button
                    v-else-if="isOwnerRecruitmentApplication(row) && row.approvalStatus === 'PENDING'"
                    link
                    type="warning"
                    @click="handleWithdrawRecruitmentApplication(row)"
                  >
                    撤回
                  </el-button>
                  <span v-else>—</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </el-card>

    <ProjectJoinDialog
      v-model="projectJoinVisible"
      :project-id="project.id"
      @success="loadData"
    />
    <ProjectRecruitmentDialog
      v-model="recruitmentVisible"
      :project-id="project.id"
      @success="loadData"
    />
    <RecruitmentApplyDialog
      v-model="recruitmentApplyVisible"
      :recruitment-id="selectedRecruitment?.id || null"
      :question-content="selectedRecruitment?.questionContent || ''"
      @success="loadData"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteProjectRecruitment,
  getProjectApplications,
  getProjectRecruitments,
  getRecruitmentApplications,
  reviewProjectApplication,
  reviewRecruitmentApplication,
  withdrawProjectApplication,
  withdrawRecruitmentApplication
} from '@/api/modules/projectDocking'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'
import ProjectJoinDialog from '@/components/ProjectJoinDialog.vue'
import ProjectRecruitmentDialog from '@/components/ProjectRecruitmentDialog.vue'
import RecruitmentApplyDialog from '@/components/RecruitmentApplyDialog.vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const userStore = useUserStore()

const loading = ref(false)
const projectJoinVisible = ref(false)
const recruitmentVisible = ref(false)
const recruitmentApplyVisible = ref(false)
const selectedRecruitment = ref(null)

const projectApplications = ref([])
const recruitments = ref([])
const recruitmentApplications = ref([])

const isLeader = computed(() => props.project?.leaderId === userStore.user?.id)
const isAdmin = computed(() => {
  const role = userStore.user?.role
  return role === 'COLLEGE_ADMIN' || role === 'SCHOOL_ADMIN'
})
const isStudentLike = computed(() => {
  const role = userStore.user?.role
  return role === 'STUDENT' || role === 'STUDENT_ADMIN'
})
const canReviewApplications = computed(() => isLeader.value || isAdmin.value)
const canApplyToProject = computed(() => isStudentLike.value && props.project?.leaderId && !isLeader.value)
const canApplyToRecruitment = computed(() => isStudentLike.value && props.project?.leaderId && !isLeader.value)

const filteredProjectApplications = computed(() => projectApplications.value || [])

const applicationsByRecruitment = computed(() => {
  const grouped = {}
  for (const recruitment of recruitments.value) {
    grouped[recruitment.id] = []
  }
  for (const application of recruitmentApplications.value) {
    if (!grouped[application.recruitmentId]) {
      grouped[application.recruitmentId] = []
    }
    grouped[application.recruitmentId].push(application)
  }
  return grouped
})

watch(
  () => props.project?.id,
  value => {
    if (value) {
      loadData()
    }
  },
  { immediate: true }
)

function isOwnerApplication(row) {
  return row?.applicantId === userStore.user?.id
}

function isOwnerRecruitmentApplication(row) {
  return row?.applicantId === userStore.user?.id
}

function getApprovalText(status) {
  const textMap = {
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    WITHDRAWN: '已撤回'
  }
  return textMap[status] || status || '未知'
}

function getApprovalTagType(status) {
  const typeMap = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    WITHDRAWN: 'info'
  }
  return typeMap[status] || 'info'
}

async function loadData() {
  if (!props.project?.id) return
  loading.value = true
  try {
    const [projectApplicationData, recruitmentData, recruitmentApplicationData] = await Promise.all([
      getProjectApplications(props.project.id).catch(() => []),
      getProjectRecruitments(props.project.id).catch(() => []),
      getRecruitmentApplications(props.project.id).catch(() => [])
    ])
    projectApplications.value = Array.isArray(projectApplicationData) ? projectApplicationData : []
    recruitments.value = Array.isArray(recruitmentData) ? recruitmentData : []
    recruitmentApplications.value = Array.isArray(recruitmentApplicationData) ? recruitmentApplicationData : []
  } finally {
    loading.value = false
  }
}

function openRecruitmentApply(recruitment) {
  selectedRecruitment.value = recruitment
  recruitmentApplyVisible.value = true
}

async function handleWithdrawProjectApplication(row) {
  try {
    await ElMessageBox.confirm('确定要撤回这条主动申请吗？', '撤回申请', {
      type: 'warning'
    })
    await withdrawProjectApplication(row.id)
    ElMessage.success('撤回成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '撤回失败')
    }
  }
}

async function handleWithdrawRecruitmentApplication(row) {
  try {
    await ElMessageBox.confirm('确定要撤回这条招募申请吗？', '撤回申请', {
      type: 'warning'
    })
    await withdrawRecruitmentApplication(row.id)
    ElMessage.success('撤回成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '撤回失败')
    }
  }
}

async function handleReviewProjectApplication(row, approvalStatus) {
  try {
    const { value } = await ElMessageBox.prompt(
      approvalStatus === 'APPROVED' ? '可选填写审批意见' : '请填写拒绝原因',
      approvalStatus === 'APPROVED' ? '通过申请' : '拒绝申请',
      {
        inputValue: '',
        inputPlaceholder: approvalStatus === 'APPROVED' ? '审批意见（选填）' : '请输入拒绝原因'
      }
    )
    await reviewProjectApplication(row.id, {
      approvalStatus,
      approvalComment: value || ''
    })
    ElMessage.success('审批完成')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '审批失败')
    }
  }
}

async function handleReviewRecruitmentApplication(row, approvalStatus) {
  try {
    const { value } = await ElMessageBox.prompt(
      approvalStatus === 'APPROVED' ? '可选填写审批意见' : '请填写拒绝原因',
      approvalStatus === 'APPROVED' ? '通过申请' : '拒绝申请',
      {
        inputValue: '',
        inputPlaceholder: approvalStatus === 'APPROVED' ? '审批意见（选填）' : '请输入拒绝原因'
      }
    )
    await reviewRecruitmentApplication(row.id, {
      approvalStatus,
      approvalComment: value || ''
    })
    ElMessage.success('审批完成')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '审批失败')
    }
  }
}

async function handleDeleteRecruitment(recruitment) {
  try {
    await ElMessageBox.confirm(`确定删除招募“${recruitment.positionName}”吗？`, '删除招募', {
      type: 'warning'
    })
    await deleteProjectRecruitment(recruitment.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.project-docking-panel {
  margin-top: 24px;
}

.panel-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.panel-card {
  margin-bottom: 16px;
}

.panel-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.panel-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-tip {
  font-size: 12px;
  color: #909399;
}

.recruitment-list {
  display: grid;
  gap: 16px;
}

.recruitment-card {
  border-radius: 12px;
}

.recruitment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.recruitment-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.recruitment-meta {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

.recruitment-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.recruitment-content {
  display: grid;
  gap: 8px;
  color: #606266;
  line-height: 1.7;
}

.recruitment-application-block {
  margin-top: 16px;
}

.sub-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
