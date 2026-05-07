<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon projects">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedStats.totalProjects }}</div>
          <div class="stat-label">项目总数</div>
        </div>
        <div class="stat-trend up">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon teams">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedStats.totalTeams }}</div>
          <div class="stat-label">团队总数</div>
        </div>
        <div class="stat-trend up">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedStats.pendingProjects }}</div>
          <div class="stat-label">待审核数量</div>
        </div>
        <div class="stat-badge" v-if="animatedStats.pendingProjects > 0">
          需处理
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon mine">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedStats.myProjects }}</div>
          <div class="stat-label">我的项目</div>
        </div>
      </div>
    </div>

    <div class="overview-section">
      <div class="section-header">
        <h2>数据概览</h2>
        <div class="section-actions">
          <el-button text type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
      
      <div class="overview-grid">
        <div class="overview-card">
          <div class="card-header">
            <h3>
              <el-icon><Document /></el-icon>
              最近项目
            </h3>
            <el-button text size="small" @click="$router.push('/projects')">查看全部</el-button>
          </div>
          <div class="card-body">
            <el-empty v-if="recentProjects.length === 0" description="暂无项目" :image-size="60" />
            <div v-else class="item-list">
              <div v-for="p in recentProjects" :key="p.id" class="list-item" @click="$router.push(`/projects/${p.id}`)">
                <div class="item-main">
                  <div class="item-title">{{ p.title }}</div>
                  <div class="item-meta">
                    <span>{{ p.leaderName || '—' }}</span>
                    <span class="separator">·</span>
                    <span>{{ p.category || '未分类' }}</span>
                  </div>
                </div>
                <div class="item-right">
                  <el-tag :type="getProjectStatusType(p)" size="small" effect="light">
                    {{ getProjectStatusText(p) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-header">
            <h3>
              <el-icon><UserFilled /></el-icon>
              团队概览
            </h3>
            <el-button text size="small" @click="$router.push('/teams')">查看全部</el-button>
          </div>
          <div class="card-body">
            <el-empty v-if="recentTeams.length === 0" description="暂无团队" :image-size="60" />
            <div v-else class="item-list">
              <div v-for="t in recentTeams" :key="t.id" class="list-item" @click="$router.push(`/teams/${t.id}`)">
                <div class="item-avatar">
                  {{ t.name?.charAt(0) || 'T' }}
                </div>
                <div class="item-main">
                  <div class="item-title">{{ t.name }}</div>
                  <div class="item-meta">
                    <span>队长：{{ t.leaderName || '—' }}</span>
                    <span class="separator">·</span>
                    <span>{{ t.memberCount || 0 }} 人</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-header">
            <h3>
              <el-icon><OfficeBuilding /></el-icon>
              空间预约
            </h3>
            <el-button text size="small" @click="$router.push('/spaces')">查看全部</el-button>
          </div>
          <div class="card-body">
            <el-empty v-if="recentReservations.length === 0" description="暂无预约" :image-size="60" />
            <div v-else class="item-list">
              <div v-for="r in recentReservations" :key="r.id" class="list-item">
                <div class="item-icon space">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <div class="item-main">
                  <div class="item-title">{{ r.spaceName || '空间 #' + r.spaceId }}</div>
                  <div class="item-meta">
                    <span>{{ r.reservationDate }}</span>
                    <span class="separator">·</span>
                    <span>{{ formatTime(r.startTime) }}-{{ formatTime(r.endTime) }}</span>
                  </div>
                </div>
                <el-tag :type="getReservationStatusType(r)" size="small" effect="light">
                  {{ getReservationStatusText(r) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <div class="card-header">
            <h3>
              <el-icon><Calendar /></el-icon>
              近期活动
            </h3>
            <el-button text size="small" @click="$router.push('/activities')">查看全部</el-button>
          </div>
          <div class="card-body">
            <el-empty v-if="recentActivities.length === 0" description="暂无活动" :image-size="60" />
            <div v-else class="item-list">
              <div v-for="a in recentActivities" :key="a.id" class="list-item" @click="$router.push(`/activities/${a.id}`)">
                <div class="item-icon activity">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div class="item-main">
                  <div class="item-title">{{ a.title }}</div>
                  <div class="item-meta">
                    <span>{{ formatDateTime(a.startTime) }}</span>
                  </div>
                </div>
                <el-tag :type="getActivityStatusType(a)" size="small" effect="light">
                  {{ getActivityStatusText(a) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { getProjects, getMyProjects } from '@/api/modules/project'
import { getTeams, getMyTeams } from '@/api/modules/team'
import { getReservationsByStatus, getPendingReservations, getMyReservations } from '@/api/modules/space'
import { getActivities } from '@/api/modules/activity'
import { getEntryApplications, getMyApplications } from '@/api/modules/entryApplication'
import { getNews } from '@/api/modules/news'
import { getFundApplications, getMyFundApplications } from '@/api/modules/fundApplication'
import { usePermission } from '@/composables/usePermission'
import { useUserStore } from '@/stores/user'
import { formatDateTime, formatTime } from '@/utils/format'
import { STATUS_TEXT, STATUS_TYPE } from '@/constants'
import { Refresh, Document, UserFilled, OfficeBuilding, Calendar } from '@element-plus/icons-vue'
 
const userStore = useUserStore()
const { isAdmin, isStudentAdmin, isCollegeAdmin, isSchoolAdmin } = usePermission()

const stats = reactive({
  totalProjects: 0,
  totalTeams: 0,
  pendingProjects: 0,
  myProjects: 0
})

const animatedStats = reactive({
  totalProjects: 0,
  totalTeams: 0,
  pendingProjects: 0,
  myProjects: 0
})

const recentProjects = ref([])
const recentTeams = ref([])
const recentReservations = ref([])
const recentActivities = ref([])

const animateNumber = (key, value) => {
  const target = animatedStats
  const duration = 800
  const start = target[key]
  const increment = (value - start) / (duration / 16)
  let current = start
  
  const timer = setInterval(() => {
    current += increment
    if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
      target[key] = value
      clearInterval(timer)
    } else {
      target[key] = Math.round(current)
    }
  }, 16)
}

const isProjectPendingReview = (p) => {
  if (!p) return false
  if (p.status === 'DRAFT') return false
  return p.approvalStatus === 'PENDING'
}

const isProjectVisibleInAllList = (p) => {
  if (!p) return false
  if (p.status === 'DRAFT') return false
  if (p.status === 'PENDING' || p.approvalStatus === 'PENDING') return false
  if (p.status === 'REJECTED' || p.approvalStatus === 'REJECTED') return false
  return !p.approvalStatus || p.approvalStatus === 'APPROVED'
}

const getProjectStatusText = (p) => {
  if (!p) return ''
  if (p.approvalStatus === 'REJECTED' || p.status === 'REJECTED') return '未通过'
  if (p.approvalStatus === 'PENDING') return '待审核'
  if (p.approvalStatus === 'APPROVED') return '已通过'
  return p.status || ''
}

const getProjectStatusType = (p) => {
  if (!p) return ''
  if (p.approvalStatus === 'REJECTED' || p.status === 'REJECTED') return 'danger'
  if (p.approvalStatus === 'PENDING') return 'warning'
  if (p.approvalStatus === 'APPROVED') return 'success'
  return 'info'
}

const getReservationStatusText = (r) => {
  if (!r) return ''
  return STATUS_TEXT[r.status] || STATUS_TEXT[r.approvalStatus] || r.status || ''
}

const getReservationStatusType = (r) => {
  if (!r) return ''
  return STATUS_TYPE[r.status] || STATUS_TYPE[r.approvalStatus] || 'info'
}

const getActivityStatusText = (a) => {
  if (!a) return ''
  return STATUS_TEXT[a.status] || a.status || ''
}

const getActivityStatusType = (a) => {
  if (!a) return ''
  return STATUS_TYPE[a.status] || 'info'
}

const isReservationApproved = (r) => {
  if (!r) return false
  if (r.status === 'CANCELLED' || r.status === 'REJECTED') return false
  if (r.approvalStatus) {
    return r.approvalStatus === 'APPROVED'
  }
  return r.status === 'APPROVED'
}

const refreshData = () => {
  loadData()
}

const extractList = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.data)) return data.data
  if (data.data && Array.isArray(data.data.list)) return data.data.list
  return []
}

const computeAdminPendingCount = async () => {
  try {
    const requests = []

    // 空间预约：待审核列表
    requests.push(getPendingReservations().catch(() => []))

    // 入驻申请：学院 / 学校管理员看到不同阶段的待审核
    const entryQuery = {}
    if (isCollegeAdmin.value) {
      entryQuery.status = 'PENDING'
      entryQuery.approvalStatus = 'PENDING'
    } else if (isSchoolAdmin.value) {
      entryQuery.status = 'APPROVED'
      entryQuery.approvalStatus = 'PENDING'
    } else {
      entryQuery.approvalStatus = 'PENDING'
    }
    requests.push(getEntryApplications(entryQuery).catch(() => null))

    // 新闻：只有学校管理员需要审核
    if (isSchoolAdmin.value) {
      requests.push(
        getNews({ pageNum: 1, pageSize: 100, approvalStatus: 'PENDING' }).catch(() => null)
      )
    } else {
      requests.push(Promise.resolve(null))
    }

    // 项目：待审核列表（后台根据角色返回对应阶段）
    requests.push(
      getProjects({ status: 'PENDING' }).catch(() => null)
    )

    // 活动：待审批（学院 / 学校管理员阶段）
    requests.push(
      getActivities({
        pageNum: 1,
        pageSize: 100,
        status: isSchoolAdmin.value ? 'APPROVED' : 'SUBMITTED',
        approvalStatus: 'PENDING'
      }).catch(() => null)
    )

    // 基金申请：待审批列表
    requests.push(
      getFundApplications({ approvalStatus: 'PENDING' }).catch(() => null)
    )

    const [
      pendingReservations,
      entryResult,
      newsResult,
      projectResult,
      activityResult,
      fundResult
    ] = await Promise.all(requests)

    let total = 0
    total += Array.isArray(pendingReservations) ? pendingReservations.length : 0
    total += extractList(entryResult).length
    total += extractList(newsResult).length
    total += extractList(projectResult).length
    total += extractList(activityResult).length
    total += extractList(fundResult).length

    return total
  } catch (e) {
    console.error('计算管理员待审核数量失败:', e)
    return 0
  }
}

const computeStudentAdminPendingCount = async () => {
  try {
    const pendingReservations = await getPendingReservations().catch(() => [])
    return Array.isArray(pendingReservations) ? pendingReservations.length : 0
  } catch (e) {
    console.error('计算学生管理员待审核数量失败:', e)
    return 0
  }
}

const computeUserPendingCount = async (myProjectList) => {
  try {
    const userId = userStore.user?.id

    const [myEntryApps, myReservations, myFundApps, myActivitiesPage] = await Promise.all([
      getMyApplications().catch(() => []),
      getMyReservations().catch(() => []),
      getMyFundApplications().catch(() => []),
      // 活动：取待审批的列表，在前端按发起人过滤
      getActivities({ pageNum: 1, pageSize: 100, approvalStatus: 'PENDING' }).catch(() => null)
    ])

    const myEntryList = Array.isArray(myEntryApps) ? myEntryApps : []
    const myReservationList = Array.isArray(myReservations) ? myReservations : []
    const myFundList = Array.isArray(myFundApps) ? myFundApps : []
    const myActivityList = extractList(myActivitiesPage)

    let total = 0

    // 项目：已提交且仍在审批中的项目
    total += myProjectList.filter(isProjectPendingReview).length

    // 入驻申请：已提交且审批状态为待审批
    total += myEntryList.filter(a => a && a.status !== 'DRAFT' && a.approvalStatus === 'PENDING').length

    // 空间预约：状态为待审核
    total += myReservationList.filter(r => r && r.status === 'PENDING').length

    // 基金申请：已提交且审批状态为待审批
    total += myFundList.filter(f => f && f.status !== 'DRAFT' && f.approvalStatus === 'PENDING').length

    // 活动：当前用户发起且审批状态为待审批
    total += myActivityList.filter(a => a && a.organizerId === userId && a.approvalStatus === 'PENDING').length

    return total
  } catch (e) {
    console.error('计算个人待审核数量失败:', e)
    return 0
  }
}

const loadData = async () => {
  try {
    const [projects, teams, myProjects, myTeams, reservations, activitiesPage] = await Promise.all([
      getProjects().catch(() => []),
      getTeams().catch(() => []),
      getMyProjects().catch(() => []),
      getMyTeams().catch(() => []),
      getReservationsByStatus().catch(() => []),
      getActivities({ pageNum: 1, pageSize: 8, status: 'PUBLISHED' }).catch(() => null)
    ])
    
    const projectList = Array.isArray(projects) ? projects : []
    const teamList = Array.isArray(teams) ? teams : []
    const myProjectList = Array.isArray(myProjects) ? myProjects : []
    const myTeamList = Array.isArray(myTeams) ? myTeams : []
    const reservationList = Array.isArray(reservations) ? reservations : []
    const activityList = Array.isArray(activitiesPage?.list || activitiesPage?.data || activitiesPage || []) ? (activitiesPage?.list || activitiesPage?.data || activitiesPage || []) : []
    
    const visibleProjectsForAllTab = isAdmin.value
      ? projectList
      : projectList.filter(isProjectVisibleInAllList)
    
    stats.totalProjects = visibleProjectsForAllTab.length
    // 团队总数：无论角色，使用“团队列表”中的团队数量
    stats.totalTeams = teamList.length

    // 待审核数量：
    // - 管理员：审核中心所有模块的待审核条数总和
    // - 其他角色：自己提交且仍在审批中的申请总数
    const pendingTotal = isAdmin.value
      ? await computeAdminPendingCount()
      : isStudentAdmin.value
        ? await computeStudentAdminPendingCount()
        : await computeUserPendingCount(myProjectList)
    stats.pendingProjects = pendingTotal

    stats.myProjects = myProjectList.length

    animateNumber('totalProjects', stats.totalProjects)
    setTimeout(() => animateNumber('totalTeams', stats.totalTeams), 100)
    setTimeout(() => animateNumber('pendingProjects', stats.pendingProjects), 200)
    setTimeout(() => animateNumber('myProjects', stats.myProjects), 300)

    const approvedProjects = projectList.filter(isProjectVisibleInAllList)
    recentProjects.value = [...approvedProjects]
      .filter(p => p?.createTime)
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .slice(0, 5)

    recentTeams.value = [...teamList]
      .sort((a, b) => {
        if (a.createTime && b.createTime) {
          return new Date(b.createTime) - new Date(a.createTime)
        }
        return (b.id || 0) - (a.id || 0)
      })
      .slice(0, 5)

    recentReservations.value = [...reservationList]
      .filter(isReservationApproved)
      .sort((a, b) => {
        const ad = new Date(`${a.reservationDate || ''} ${a.startTime || ''}`)
        const bd = new Date(`${b.reservationDate || ''} ${b.startTime || ''}`)
        return bd - ad
      })
      .slice(0, 5)

    recentActivities.value = [...activityList]
      .filter(a => a.startTime)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 5)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
}

.stat-icon.projects {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
}

.stat-icon.teams {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-icon.mine {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #8c8ca1;
}

.stat-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-trend.up {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.stat-trend svg {
  width: 14px;
  height: 14px;
}

.stat-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 10px;
  background: rgba(245, 87, 108, 0.1);
  color: #f5576c;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
}

.overview-section {
  background: transparent;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f5;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f5;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 .el-icon {
  color: #1890ff;
}

.card-body {
  padding: 12px;
  min-height: 200px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.list-item:hover {
  background: #f5f7fa;
}

.item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon svg {
  width: 20px;
  height: 20px;
}

.item-icon.space {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.item-icon.activity {
  background: rgba(17, 153, 142, 0.1);
  color: #11998e;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: #8c8ca1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.separator {
  color: #dcdfe6;
}

.item-right {
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
