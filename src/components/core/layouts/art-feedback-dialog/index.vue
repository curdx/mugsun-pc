<!-- 全局意见反馈弹窗：任意页面经顶栏用户菜单触发，支持附件上传 -->
<template>
  <ElDialog v-model="visible" title="意见反馈" width="520px">
    <ElForm :model="form" label-width="80px">
      <ElFormItem label="反馈内容" required>
        <ElInput
          v-model="form.content"
          type="textarea"
          :rows="5"
          maxlength="500"
          show-word-limit
          placeholder="请描述你的问题或建议"
        />
      </ElFormItem>
      <ElFormItem label="联系方式">
        <ElInput v-model="form.contact" placeholder="邮箱/手机（选填，便于回复）" />
      </ElFormItem>
      <ElFormItem label="附件">
        <ElUpload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept="image/*"
          :on-change="handleFileChange"
          :on-remove="handleRemove"
          :on-exceed="handleExceed"
        >
          <ElButton :loading="uploading">选择图片</ElButton>
          <template #tip>
            <span class="upload-tip">支持上传截图（JPG/PNG 等图片，≤5MB，可选）</span>
          </template>
        </ElUpload>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="submit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { ElMessage, type UploadFile, type UploadInstance } from 'element-plus'
  import { mittBus } from '@/utils/sys'
  import { uploadFeedbackFile, submitFeedback } from '@/api/feedback'

  defineOptions({ name: 'ArtFeedbackDialog' })

  const visible = ref(false)
  const uploading = ref(false)
  const submitting = ref(false)
  const uploadRef = ref<UploadInstance>()
  const form = reactive<any>({
    content: '',
    contact: '',
    attachId: null,
    attachName: '',
    attachUrl: ''
  })

  const reset = () => {
    Object.assign(form, { content: '', contact: '', attachId: null, attachName: '', attachUrl: '' })
  }

  const open = () => {
    reset()
    visible.value = true
  }

  // 选择文件后立即上传，回填附件引用
  const handleFileChange = async (uploadFile: UploadFile) => {
    if (!uploadFile.raw) return
    // 类型与大小校验：仅图片、≤5MB
    if (!uploadFile.raw.type.startsWith('image/')) {
      ElMessage.warning('仅支持上传图片附件')
      uploadRef.value?.clearFiles()
      handleRemove()
      return
    }
    if (uploadFile.raw.size > 5 * 1024 * 1024) {
      ElMessage.warning('附件大小不能超过 5MB')
      uploadRef.value?.clearFiles()
      handleRemove()
      return
    }
    uploading.value = true
    try {
      const attach = await uploadFeedbackFile(uploadFile.raw)
      form.attachId = attach?.id
      form.attachName = attach?.name
      form.attachUrl = attach?.url
    } catch {
      ElMessage.error('附件上传失败')
    } finally {
      uploading.value = false
    }
  }

  const handleRemove = () => {
    form.attachId = null
    form.attachName = ''
    form.attachUrl = ''
  }

  const handleExceed = () => {
    ElMessage.warning('仅支持上传一个附件')
  }

  const submit = async () => {
    if (!form.content?.trim()) return ElMessage.warning('请填写反馈内容')
    submitting.value = true
    try {
      await submitFeedback({ ...form })
      ElMessage.success('感谢你的反馈！')
      visible.value = false
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => mittBus.on('openFeedback', open))
  onUnmounted(() => mittBus.off('openFeedback', open))
</script>

<style lang="scss" scoped>
  .upload-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
