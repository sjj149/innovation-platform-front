<template>
  <div class="project-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目详情</span>
          <div class="header-actions">
            <el-button v-if="isLeader" type="primary" @click="handleEditBasic">编辑基本信息</el-button>
            <el-button
              v-if="isLeader && project?.teamId && linkedMembers.length"
              type="primary"
              @click="showTransferDialog = true"
            >
              更换负责人
            </el-button>
            <el-button v-if="isLeader" type="warning" @click="handleVacateLeader">招募负责人</el-button>
            <el-button
              v-if="isLeaderVacant && isTeacher"
              type="success"
              :loading="takeoverLoading"
              @click="handleTakeover"
            >
              申请接管
            </el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>

      <div v-if="loading" class="loading-wrap">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>

      <div v-else-if="project">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目标题">{{ project.title }}</el-descriptions-item>
          <el-descriptions-item label="项目类别">{{ project.category }}</el-descriptions-item>
          <el-descriptions-item label="负责人">
            <template v-if="project.leaderId">{{ project.leaderName }}</template>
            <span v-else class="leader-vacant">虚位以待</span>
          </el-descriptions-item>
          <el-descriptions-item label="负责人电话">{{ project.leaderPhone || '—' }}</el-descriptions-item>
          <template v-if="project.leaderId == null && (project.previousLeaderName || project.previousLeaderPhone)">
            <el-descriptions-item label="上一任负责人">{{ project.previousLeaderName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="上一任联系方式">{{ project.previousLeaderPhone || '—' }}</el-descriptions-item>
          </template>
          <el-descriptions-item label="指导老师">{{ project.instructorName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(project.status)">
              {{ getStatusText(project.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(project.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(project.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="项目描述" :span="2">
            <div class="pre-wrap">{{ project.description || '暂无描述' }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="project.reviewComment" label="审核意见" :span="2">
            <div class="pre-wrap">{{ project.reviewComment }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="project.teamId">
          <el-divider>关联团队与队员</el-divider>
          <div v-loading="loadingTeam" class="linked-team-section">
            <div v-if="linkedTeam" class="linked-team-header">
              <span class="linked-team-label">关联团队：</span>
              <router-link :to="`/teams/${linkedTeam.id}`" class="team-link">{{ linkedTeam.name }}</router-link>
              <span class="linked-team-meta">（队长：{{ linkedTeam.leaderName }}）</span>
            </div>
            <div v-if="linkedMembers.length" class="linked-members-table">
              <div class="linked-members-title">队员信息</div>
              <el-table :data="linkedMembers" border size="small">
                <el-table-column prop="userName" label="姓名" width="100" />
                <el-table-column prop="role" label="角色" width="80">
                  <template #default="{ row }">{{ row.role === 'LEADER' ? '队长' : '成员' }}</template>
                </el-table-column>
                <el-table-column prop="joinTime" label="加入时间" width="170">
                  <template #default="{ row }">{{ formatDateTime(row.joinTime) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </template>

        <el-divider>项目对接</el-divider>
        <ProjectDockingPanel :project="project" />
      </div>
    </el-card>

    <el-dialog v-model="showTransferDialog" title="更换负责人" width="400px">
      <p>将项目负责人身份转给以下团队成员之一：</p>
      <el-select v-model="selectedNewLeaderId" placeholder="请选择新负责人" style="width: 100%" filterable>
        <el-option
          v-for="member in linkedMembers.filter(item => item.userId !== project?.leaderId)"
          :key="member.userId"
          :label="`${member.userName}（${member.role === 'LEADER' ? '队长' : '成员'}）`"
          :value="member.userId"
        />
      </el-select>
      <template #footer>
        <el-button @click="showTransferDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="transferLoading"
          :disabled="!selectedNewLeaderId"
          @click="confirmTransfer"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getProjectById, transferLeader, vacateLeader } from '@/api/modules/project'
import { getTeamById, getTeamMembers } from '@/api/modules/team'
import { applyTakeoverProject } from '@/api/modules/informationLink'
import ProjectDockingPanel from '@/components/ProjectDockingPanel.vue'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const project = ref(null)
const loading = ref(true)
const linkedTeam = ref(null)
const linkedMembers = ref([])
const loadingTeam = ref(false)
const showTransferDialog = ref(false)
const selectedNewLeaderId = ref(null)
const transferLoading = ref(false)
const takeoverLoading = ref(false)

const isLeader = computed(() => project.value?.leaderId != null && userStore.user?.id === project.value.leaderId)
const isLeaderVacant = computed(() => project.value?.leaderId == null)
const isTeacher = computed(() => userStore.user?.role === 'TEACHER')

const getStatusType = status => {
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

const getStatusText = status => {
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

const goBack = () => {
  router.back()
}

const handleEditBasic = () => {
  router.push(`/projects/${project.value?.id}/edit`)
}

const confirmTransfer = async () => {
  if (!selectedNewLeaderId.value || !project.value?.id) return
  transferLoading.value = true
  try {
    await transferLeader(project.value.id, selectedNewLeaderId.value)
    ElMessage.success('更换负责人成功')
    showTransferDialog.value = false
    selectedNewLeaderId.value = null
    project.value = await getProjectById(project.value.id)
    await loadLinkedTeamAndMembers()
  } catch (error) {
    ElMessage.error(error?.message || '更换失败')
  } finally {
    transferLoading.value = false
  }
}

const handleVacateLeader = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要发起招募负责人吗？你将不再担任负责人，项目会进入无人接管列表。',
      '招募负责人',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await vacateLeader(project.value.id)
    ElMessage.success('已设为虚位以待，项目已进入无人接管列表')
    project.value = await getProjectById(project.value.id)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  }
}

const handleTakeover = async () => {
  if (!project.value?.id) return
  takeoverLoading.value = true
  try {
    await applyTakeoverProject(project.value.id)
    ElMessage.success('申请接管成功')
    project.value = await getProjectById(project.value.id)
  } catch (error) {
    ElMessage.error(error?.message || '申请失败')
  } finally {
    takeoverLoading.value = false
  }
}

async function loadLinkedTeamAndMembers() {
  if (!project.value?.teamId) {
    linkedTeam.value = null
    linkedMembers.value = []
    return
  }
  loadingTeam.value = true
  try {
    const [team, members] = await Promise.all([
      getTeamById(project.value.teamId),
      getTeamMembers(project.value.teamId)
    ])
    linkedTeam.value = team || null
    linkedMembers.value = members || []
  } catch {
    linkedTeam.value = null
    linkedMembers.value = []
  } finally {
    loadingTeam.value = false
  }
}

onMounted(async () => {
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    project.value = await getProjectById(id)
    await loadLinkedTeamAndMembers()
  } catch (error) {
    ElMessage.error(error?.message || '加载项目详情失败')
    project.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.project-detail {
  padding: 20px;
}

.loading-wrap {
  text-align: center;
  padding: 40px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.pre-wrap {
  white-space: pre-wrap;
}

.linked-team-section {
  margin-top: 16px;
}

.linked-team-header {
  margin-bottom: 12px;
  font-size: 14px;
}

.linked-team-label {
  color: #909399;
}

.team-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.team-link:hover {
  text-decoration: underline;
}

.linked-team-meta {
  color: #606266;
  margin-left: 4px;
}

.linked-members-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
}

.leader-vacant {
  color: var(--el-color-warning);
  font-weight: 500;
}
</style>
