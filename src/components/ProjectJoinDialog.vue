<template>
  <el-dialog
    v-model="visible"
    title="主动申请加入项目"
    width="600px"
    :close-on-click-modal="false"
    @close="reset"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="申请职位" prop="desiredPosition">
        <el-input v-model="form.desiredPosition" placeholder="请输入申请职位" />
      </el-form-item>
      <el-form-item label="我的专业" prop="applicantMajor">
        <el-input v-model="form.applicantMajor" placeholder="请输入专业" />
      </el-form-item>
      <el-form-item label="我的特长" prop="qualifications">
        <el-input
          v-model="form.qualifications"
          type="textarea"
          :rows="4"
          placeholder="请输入与你申请职位相关的特长、技能或经历"
        />
      </el-form-item>
      <el-form-item label="简历附件">
        <el-upload
          :auto-upload="false"
          :limit="1"
          :on-change="onFileChange"
          :on-remove="onFileRemove"
          accept=".pdf,.doc,.docx"
        >
          <el-button type="primary" size="small">选择文件</el-button>
        </el-upload>
        <div v-if="uploading" class="upload-tip">正在上传...</div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.applicationContent"
          type="textarea"
          :rows="3"
          placeholder="可补充说明你的加入意向"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { applyToProject } from '@/api/modules/projectDocking'
import { uploadFile } from '@/api/modules/upload'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const formRef = ref(null)
const submitting = ref(false)
const uploading = ref(false)
const resumeFile = ref(null)

const form = reactive({
  desiredPosition: '',
  applicantMajor: '',
  qualifications: '',
  applicationContent: ''
})

const rules = {
  desiredPosition: [{ required: true, message: '请输入申请职位', trigger: 'blur' }],
  applicantMajor: [{ required: true, message: '请输入专业', trigger: 'blur' }],
  qualifications: [{ required: true, message: '请输入特长', trigger: 'blur' }]
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

function onFileChange(file) {
  resumeFile.value = file.raw
}

function onFileRemove() {
  resumeFile.value = null
}

function reset() {
  form.desiredPosition = ''
  form.applicantMajor = ''
  form.qualifications = ''
  form.applicationContent = ''
  resumeFile.value = null
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
    let resumeUrl = ''
    if (resumeFile.value) {
      uploading.value = true
      try {
        resumeUrl = await uploadFile(resumeFile.value)
      } finally {
        uploading.value = false
      }
    }

    const payload = {
      projectId: props.projectId,
      desiredPosition: form.desiredPosition,
      applicantMajor: form.applicantMajor,
      qualifications: form.qualifications,
      applicationContent: form.applicationContent
    }
    if (resumeUrl) {
      payload.resumeUrl = resumeUrl
    }

    await applyToProject(props.projectId, payload)
    ElMessage.success('申请已提交')
    visible.value = false
    emit('success')
  } catch (error) {
    ElMessage.error(error?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
