<template>
  <el-dialog
    v-model="visible"
    title="发布项目招募"
    width="620px"
    :close-on-click-modal="false"
    @close="reset"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="招募职位" prop="positionName">
        <el-input v-model="form.positionName" placeholder="请输入招募职位" />
      </el-form-item>
      <el-form-item label="任务说明" prop="taskDescription">
        <el-input
          v-model="form.taskDescription"
          type="textarea"
          :rows="4"
          placeholder="请输入该职位需要承担的任务"
        />
      </el-form-item>
      <el-form-item label="学院偏好">
        <el-input v-model="form.collegePreference" placeholder="可填写学院偏好" />
      </el-form-item>
      <el-form-item label="专业偏好">
        <el-input v-model="form.majorPreference" placeholder="可填写专业偏好" />
      </el-form-item>
      <el-form-item label="需回答问题">
        <el-input
          v-model="form.questionContent"
          type="textarea"
          :rows="3"
          placeholder="如有需要，可填写申请者必须回答的问题"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createProjectRecruitment } from '@/api/modules/projectDocking'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  positionName: '',
  taskDescription: '',
  collegePreference: '',
  majorPreference: '',
  questionContent: ''
})

const rules = {
  positionName: [{ required: true, message: '请输入招募职位', trigger: 'blur' }],
  taskDescription: [{ required: true, message: '请输入任务说明', trigger: 'blur' }]
}

watch(
  () => props.modelValue,
  value => {
    visible.value = value
  },
  { immediate: true }
)

watch(visible, value => {
  emit('update:modelValue', value)
})

function reset() {
  form.positionName = ''
  form.taskDescription = ''
  form.collegePreference = ''
  form.majorPreference = ''
  form.questionContent = ''
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await createProjectRecruitment(props.projectId, { ...form })
    ElMessage.success('招募发布成功')
    visible.value = false
    emit('success')
  } catch (error) {
    ElMessage.error(error?.message || '发布失败')
  } finally {
    submitting.value = false
  }
}
</script>
