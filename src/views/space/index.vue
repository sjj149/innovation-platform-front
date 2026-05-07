<template>
  <div class="space-reservation">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>空间预约管理</span>
          <div>
            <el-button @click="showMyReservations">我的预约</el-button>
            <el-button v-if="canReviewSpaceReservations" @click="goToAdmin">预约审核</el-button>
            <el-button v-if="isAdmin" @click="handleOpenCreateSpace">创建入驻</el-button>
            <el-button type="primary" @click="handleReserve">预约空间</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="空间">
          <el-select v-model="searchForm.spaceId" placeholder="选择空间" clearable filterable>
            <el-option
              v-for="space in allSpaces"
              :key="space.id"
              :label="space.name"
              :value="space.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部"
            clearable
            filterable
          >
            <el-option label="全部" value="" />
            <el-option label="可用" value="AVAILABLE" />
            <el-option label="维护中" value="MAINTENANCE" />
            <el-option label="已禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 空间列表 -->
      <el-table :data="spaces" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="空间名称" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="capacity" label="容量（人）" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            <el-select
              v-if="isAdmin"
              v-model="row.status"
              size="small"
              class="status-select"
              @change="(val) => handleStatusChange(row, val)"
            >
              <el-option label="可用" value="AVAILABLE" />
              <el-option label="维护中" value="MAINTENANCE" />
              <el-option label="已禁用" value="DISABLED" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row.id)">查看详情</el-button>
            <el-button
              v-if="isAdmin"
              link
              type="warning"
              @click="handleOpenEditSpace(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'AVAILABLE'"
              link
              type="success"
              @click="handleReserveSpace(row)"
            >
              预约
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 预约申请对话框 -->
    <el-dialog
      v-model="reservationDialogVisible"
      :title="currentSpace ? `预约 ${currentSpace.name}` : '预约空间'"
      width="600px"
    >
      <el-form
        ref="reservationFormRef"
        :model="reservationForm"
        :rules="reservationRules"
        label-width="100px"
      >
        <el-form-item label="空间" prop="spaceId" v-if="!currentSpace">
          <el-select
            v-model="spaceSelectValue"
            placeholder="请选择空间"
            @change="onSpaceSelectChange"
          >
            <el-option
              v-for="space in availableSpaces"
              :key="space.id"
              :label="space.name"
              :value="space.id"
            />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="!currentSpace && spaceSelectValue === 'OTHER'"
          label="其他空间名称"
          prop="otherSpaceName"
        >
          <el-input v-model="reservationForm.otherSpaceName" placeholder="请输入其他空间名称" clearable />
        </el-form-item>
        <el-form-item label="预约日期" prop="reservationDate">
          <el-date-picker
            v-model="reservationForm.reservationDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            @change="onDateOrSpaceChange"
          />
        </el-form-item>
        <el-form-item label="预约时间" prop="startTime">
          <div class="time-slots-hint">请先选择空间和日期，再点击下方时段选择预约时间（已被占用的时段不可选）</div>
          <div class="time-slot-buttons">
            <el-button
              v-for="h in hourSlots"
              :key="h"
              size="small"
              :type="reservationForm.startTime === hourToTime(h) ? 'primary' : 'default'"
              :disabled="isStartHourDisabled(h)"
              :class="{ 'is-occupied': isHourOccupied(h) }"
              @click="selectStartHour(h)"
            >
              {{ String(h).padStart(2, '0') }}:00
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="使用目的" prop="purpose">
          <el-input
            v-model="reservationForm.purpose"
            type="textarea"
            :rows="3"
            placeholder="请输入使用目的"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="reservationForm.contactPhone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reservationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitReservation">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <!-- 我的预约对话框 -->
    <el-dialog v-model="myReservationsDialogVisible" title="我的预约" width="800px">
      <el-table :data="myReservations" v-loading="myReservationsLoading" max-height="400">
        <el-table-column label="空间" width="120">
          <template #default="{ row }">
            {{ row.spaceId != null ? row.spaceId : (row.customSpaceName || '其他') }}
          </template>
        </el-table-column>
        <el-table-column prop="reservationDate" label="预约日期" width="120" />
        <el-table-column label="时间段" width="150">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}-{{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" show-overflow-tooltip min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReservationDisplayStatusType(row)">{{ getReservationDisplayStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approvalStatus" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReservationDisplayApprovalType(row)">{{ getReservationDisplayApprovalText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canCancel(row)"
              link
              type="danger"
              @click="handleCancelReservation(row)"
            >
              取消
            </el-button>
            <span v-else style="color: #909399; font-size: 12px;">-</span>
          </template>
        </el-table-column>
      </el-table>
      <template v-if="myReservations.length === 0 && !myReservationsLoading">
        <el-empty description="暂无预约记录" />
      </template>
    </el-dialog>

<!--创建入驻空间-->
    <el-dialog v-model="createSpaceVisible" :title="isEditingSpace ? '编辑空间' : '新增空间/教室入驻'" width="500px" destroy-on-close>
      <el-form :model="spaceForm" ref="createSpaceFormRef" label-width="100px">
        <el-form-item label="空间名称" required>
          <el-input v-model="spaceForm.name" placeholder="请输入空间名称" />
        </el-form-item>
        <el-form-item label="位置" required>
          <el-input v-model="spaceForm.location" placeholder="例如：创新创业学院A405" />
        </el-form-item>
        <el-form-item label="容量人数">
          <el-input-number v-model="spaceForm.capacity" :min="1" />
        </el-form-item>
        <el-form-item label="空间描述">
          <el-input v-model="spaceForm.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createSpaceVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="isEditingSpace ? submitEditSpace() : submitSpace()">{{ isEditingSpace ? '保存修改' : '立即创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatTime } from '@/utils/format'
import { createSpace, getSpaces, createReservation, getMyReservations, cancelReservation, getSpaceOccupiedSlots, updateSpaceStatus, updateSpace } from '@/api/modules/space'
import { usePermission } from '@/composables/usePermission'
import { STATUS_TEXT, STATUS_TYPE } from '@/constants'
import dayjs from 'dayjs'

const router = useRouter()
const { isAdmin, canReviewSpaceReservations } = usePermission()

const spaces = ref([])
const allSpaces = ref([])
const availableSpaces = ref([])
const loading = ref(false)
const submitting = ref(false)
const reservationDialogVisible = ref(false)
const currentSpace = ref(null)
const reservationFormRef = ref(null)

const searchForm = reactive({
  spaceId: null,
  status: '' // 空表示全部
})

const reservationForm = reactive({
  spaceId: null,
  otherSpaceName: '',
  reservationDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  attendeeCount: 1,
  contactPhone: ''
})


// --- 创建空间（管理员）相关 ---
const createSpaceVisible = ref(false)
const isEditingSpace = ref(false)
const editingSpaceId = ref(null)
const submitLoading = ref(false)
const createSpaceFormRef = ref(null)
const spaceForm = reactive({
  name: '',
  location: '',
  capacity: 10,
  description: '',
  status: 'AVAILABLE'
})
const handleOpenCreateSpace = () => {
  isEditingSpace.value = false
  editingSpaceId.value = null
  createSpaceVisible.value = true
  Object.assign(spaceForm, { name: '', location: '', capacity: 10, description: '', status: 'AVAILABLE' })
}
const handleOpenEditSpace = (row) => {
  isEditingSpace.value = true
  editingSpaceId.value = row.id
  createSpaceVisible.value = true
  Object.assign(spaceForm, {
    name: row.name || '',
    location: row.location || '',
    capacity: row.capacity || 10,
    description: row.description || '',
    status: row.status || 'AVAILABLE'
  })
}
const submitEditSpace = async () => {
  if (!spaceForm.name || !spaceForm.location) return ElMessage.warning('请填写名称和位置')
  submitLoading.value = true
  try {
    await updateSpace(editingSpaceId.value, spaceForm)
    ElMessage.success('空间更新成功！')
    createSpaceVisible.value = false
    loadSpaces()
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

const submitSpace = async () => {
  if (!spaceForm.name || !spaceForm.location) return ElMessage.warning('请填写名称和位置')
  submitLoading.value = true
  try {
    await createSpace(spaceForm)
    ElMessage.success('空间创建成功！')
    createSpaceVisible.value = false
    loadSpaces()
  } catch (error) {
    ElMessage.error(error.message || '创建失败')
  } finally {
    submitLoading.value = false
  }
}

// 空间下拉实际选中值：为 number（空间 id）或 'OTHER'
const spaceSelectValue = ref(null)

// 预约时段：08:00–21:00（8 到 21 点）
const hourSlots = Array.from({ length: 14 }, (_, i) => i + 8)
const spaceReservationsForDate = ref([])
const loadingReservations = ref(false)

const hourToTime = (h) => `${String(h).padStart(2, '0')}:00:00`

/** 根据占用时段（预约+活动合并）计算被占用的小时 */
const occupiedHoursSet = computed(() => {
  const set = new Set()
  const list = spaceReservationsForDate.value || []
  for (const r of list) {
    const s = String(r.startTime || '')
    const e = String(r.endTime || '')
    const startH = parseInt(s.split(':')[0], 10)
    let endH = parseInt(e.split(':')[0], 10)
    const endMin = parseInt(e.split(':')[1], 10) || 0
    if (endMin > 0) endH += 1
    for (let h = startH; h < endH; h++) set.add(h)
  }
  return set
})

const isHourOccupied = (h) => occupiedHoursSet.value.has(h)

const isStartHourDisabled = (h) => isHourOccupied(h)

/** 选择预约时段：仅选开始时间，结束时间自动为开始 +1 小时；已被占用的时段不可选 */
const selectStartHour = (h) => {
  reservationForm.startTime = hourToTime(h)
  reservationForm.endTime = hourToTime(h + 1)
}

const onSpaceSelectChange = (val) => {
  if (val === 'OTHER') {
    reservationForm.spaceId = null
    reservationForm.otherSpaceName = ''
  } else {
    reservationForm.spaceId = val
    reservationForm.otherSpaceName = ''
  }
  onDateOrSpaceChange()
}

const onDateOrSpaceChange = () => {
  reservationForm.startTime = ''
  reservationForm.endTime = ''
  loadSpaceReservations()
}

const loadSpaceReservations = async () => {
  const spaceId = reservationForm.spaceId
  const date = reservationForm.reservationDate
  if (!spaceId || !date) {
    spaceReservationsForDate.value = []
    return
  }
  loadingReservations.value = true
  try {
    const list = await getSpaceOccupiedSlots(spaceId, date)
    spaceReservationsForDate.value = Array.isArray(list) ? list : []
  } catch (e) {
    spaceReservationsForDate.value = []
  } finally {
    loadingReservations.value = false
  }
}

const validateSpace = (rule, value, callback) => {
  if (spaceSelectValue.value === 'OTHER') {
    if (!reservationForm.otherSpaceName?.trim()) {
      callback(new Error('请输入其他空间名称'))
    } else {
      callback()
    }
  } else {
    if (value == null || value === '') {
      callback(new Error('请选择空间'))
    } else {
      callback()
    }
  }
}

const reservationRules = {
  spaceId: [{ validator: validateSpace, trigger: 'change' }],
  otherSpaceName: [
    {
      validator: (rule, value, callback) => {
        if (spaceSelectValue.value === 'OTHER' && !(value && value.trim())) {
          callback(new Error('请输入其他空间名称'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  reservationDate: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择预约时间', trigger: 'change' }],
  purpose: [{ required: true, message: '请输入使用目的', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const getStatusText = (status) => STATUS_TEXT[status] || status
const getStatusType = (status) => STATUS_TYPE[status] || ''

const isRejected = (row) => row?.status === 'REJECTED' || row?.approvalStatus === 'REJECTED'
const isFinalApproved = (row) => row?.status === 'APPROVED' && row?.approvalStatus === 'APPROVED'
const isWaitingSchool = (row) => row?.status === 'APPROVED' && row?.approvalStatus === 'PENDING'
const isWaitingCollege = (row) => row?.status === 'PENDING' && row?.approvalStatus === 'PENDING'

const getReservationDisplayStatusText = (row) => {
  if (isRejected(row)) return '未通过'
  if (isFinalApproved(row)) return '已通过'
  if (isWaitingSchool(row) || isWaitingCollege(row)) return '已提交'
  return getStatusText(row?.status)
}

const getReservationDisplayApprovalText = (row) => {
  if (isRejected(row)) return '未通过'
  if (isFinalApproved(row)) return '已通过'
  if (isWaitingSchool(row)) return '待学校管理员审核'
  if (isWaitingCollege(row)) return '待学院管理员审核'
  return getStatusText(row?.approvalStatus)
}

const getReservationDisplayStatusType = (row) => {
  if (isRejected(row)) return 'danger'
  if (isFinalApproved(row)) return 'success'
  if (isWaitingSchool(row) || isWaitingCollege(row)) return 'warning'
  return getStatusType(row?.status)
}

const getReservationDisplayApprovalType = (row) => {
  if (isRejected(row)) return 'danger'
  if (isFinalApproved(row)) return 'success'
  if (isWaitingSchool(row) || isWaitingCollege(row)) return 'warning'
  return getStatusType(row?.approvalStatus)
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 不能选择今天之前的日期
}

const loadSpaces = async () => {
  loading.value = true
  try {
    // 先获取所有空间，再在前端根据筛选条件过滤，这样可以组合多个条件
    const list = await getSpaces()
    allSpaces.value = Array.isArray(list) ? list : []
    // 预约对话框中的空间列表：使用现有空间列表
    availableSpaces.value = allSpaces.value

    let filtered = [...allSpaces.value]
    if (searchForm.spaceId) {
      filtered = filtered.filter(s => s.id === searchForm.spaceId)
    }
    if (searchForm.status) {
      filtered = filtered.filter(s => s.status === searchForm.status)
    }
    spaces.value = filtered
  } catch (error) {
    ElMessage.error(error.message || '加载空间列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadSpaces()
}

const handleReset = () => {
  searchForm.spaceId = null
  searchForm.status = ''
  loadSpaces()
}

const handleStatusChange = async (row, value) => {
  const oldStatus = row.status
  try {
    await updateSpaceStatus(row.id, value)
    ElMessage.success('空间状态已更新')
    // 重新加载以确保与后端数据一致
    loadSpaces()
  } catch (e) {
    row.status = oldStatus
    ElMessage.error(e?.message || '更新空间状态失败')
  }
}

const handleViewDetail = (id) => {
  router.push(`/spaces/${id}`)
}

const goToAdmin = () => {
  router.push('/spaces/admin')
}

const myReservationsDialogVisible = ref(false)
const myReservations = ref([])
const myReservationsLoading = ref(false)

const showMyReservations = async () => {
  myReservationsDialogVisible.value = true
  myReservationsLoading.value = true
  try {
    myReservations.value = await getMyReservations() || []
  } catch (error) {
    ElMessage.error(error?.message || '加载我的预约失败')
  } finally {
    myReservationsLoading.value = false
  }
}

const canCancel = (reservation) => {
  // 只有待审核和已通过的预约可以取消，已完成和已取消的不能取消
  return reservation.status === 'PENDING' || reservation.status === 'APPROVED'
}

const handleCancelReservation = async (reservation) => {
  try {
    const spaceDesc = reservation.spaceId != null ? `空间ID: ${reservation.spaceId}` : `空间: ${reservation.customSpaceName || '其他'}`
    await ElMessageBox.confirm(
      `确定要取消预约吗？\n${spaceDesc}\n预约日期: ${reservation.reservationDate}\n时间段: ${formatTime(reservation.startTime)}-${formatTime(reservation.endTime)}`,
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await cancelReservation(reservation.id)
    ElMessage.success('预约已取消')
    // 重新加载预约列表
    await showMyReservations()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '取消预约失败')
    }
  }
}

const handleReserve = () => {
  currentSpace.value = null
  reservationForm.spaceId = null
  reservationForm.otherSpaceName = ''
  spaceSelectValue.value = null
  reservationDialogVisible.value = true
}

const handleReserveSpace = (space) => {
  currentSpace.value = space
  reservationForm.spaceId = space.id
  reservationForm.otherSpaceName = ''
  spaceSelectValue.value = space.id
  reservationDialogVisible.value = true
}

const handleSubmitReservation = async () => {
  if (!reservationFormRef.value) return

  await reservationFormRef.value.validate(async (valid) => {
    if (valid) {
      // 结束时间由开始时间自动设为 +1 小时
      if (!reservationForm.endTime && reservationForm.startTime) {
        const h = parseInt(reservationForm.startTime.split(':')[0], 10)
        reservationForm.endTime = `${String(h + 1).padStart(2, '0')}:00:00`
      }

      submitting.value = true
      try {
        const payload = {
          spaceId: spaceSelectValue.value === 'OTHER' ? null : reservationForm.spaceId,
          reservationDate: reservationForm.reservationDate,
          startTime: reservationForm.startTime,
          endTime: reservationForm.endTime,
          purpose: reservationForm.purpose,
          attendeeCount: reservationForm.attendeeCount,
          contactPhone: reservationForm.contactPhone
        }
        if (spaceSelectValue.value === 'OTHER') {
          payload.customSpaceName = reservationForm.otherSpaceName?.trim() || ''
        }
        await createReservation(payload)
        ElMessage.success('预约申请提交成功')
        reservationDialogVisible.value = false
        // 重置表单
        Object.assign(reservationForm, {
          spaceId: null,
          otherSpaceName: '',
          reservationDate: '',
          startTime: '',
          endTime: '',
          purpose: '',
          attendeeCount: 1,
          contactPhone: ''
        })
        spaceSelectValue.value = null
      } catch (error) {
        ElMessage.error(error.message || '提交失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadSpaces()
})
</script>

<style scoped>
.space-reservation {
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

.time-slots-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.time-slot-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-slot-buttons .el-button.is-occupied:disabled {
  background-color: #e4e7ed;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

.status-select {
  margin-left: 8px;
  width: 110px;
}
</style>
