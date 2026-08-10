<!-- sourcemap 上传弹窗（G101）：release + 手动选 .map 文件 → multipart 上传；同 release 同名重传覆盖 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    title="上传符号表"
    width="520px"
    align-center
    @closed="resetState"
  >
    <ElForm label-width="96px">
      <ElFormItem label="所属应用">
        <span>{{ appKey || '-' }}</span>
      </ElFormItem>
      <ElFormItem label="Release" required>
        <ElInput
          v-model="release"
          placeholder="与错误事件 release 对齐，如 1.0.0"
          maxlength="128"
        />
      </ElFormItem>
      <ElFormItem label="符号表文件" required>
        <ElUpload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".map"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :on-exceed="handleFileExceed"
        >
          <ElButton>选择 .map 文件</ElButton>
          <template #tip>
            <div class="el-upload__tip">仅 .map 文件，≤ 20MB；同 Release 同名文件重传即覆盖</div>
          </template>
        </ElUpload>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="uploading" :disabled="!file" @click="handleUpload">
          上传
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { UploadFile, UploadInstance, UploadRawFile } from 'element-plus'

  interface Props {
    visible: boolean
    appKey: string
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', payload: { release: string; file: File }): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const MAX_BYTES = 20 * 1024 * 1024

  const uploadRef = ref<UploadInstance>()
  const release = ref('')
  const file = ref<File | null>(null)
  const uploading = ref(false)

  // 每次关闭后复位（release/文件/加载态），下次打开是干净表单
  const resetState = (): void => {
    uploadRef.value?.clearFiles()
    release.value = ''
    file.value = null
    uploading.value = false
  }

  /** 前端预检（后缀/大小），服务端校验链仍是最终裁定 */
  const checkFile = (raw: File): boolean => {
    if (!raw.name.endsWith('.map')) {
      ElMessage.warning('仅支持 .map 文件')
      return false
    }
    if (raw.size > MAX_BYTES) {
      ElMessage.warning('文件超过 20MB 上限')
      return false
    }
    return true
  }

  const handleFileChange = (uploadFile: UploadFile): void => {
    const raw = uploadFile.raw
    if (!raw || !checkFile(raw)) {
      uploadRef.value?.clearFiles()
      file.value = null
      return
    }
    file.value = raw
  }

  const handleFileRemove = (): void => {
    file.value = null
  }

  // 超出 limit 时替换为新选文件（避免「得先删再选」的两步操作）
  const handleFileExceed = (files: File[]): void => {
    uploadRef.value?.clearFiles()
    const raw = files[0] as UploadRawFile
    if (!checkFile(raw)) return
    uploadRef.value?.handleStart(raw)
    file.value = raw
  }

  const handleUpload = async (): Promise<void> => {
    if (!file.value || uploading.value) return
    if (!release.value.trim()) {
      ElMessage.warning('请输入 Release')
      return
    }
    uploading.value = true
    try {
      emit('submit', { release: release.value.trim(), file: file.value })
    } finally {
      // 父组件提交完成后负责关窗（复位由 @closed 兜底）；失败时仅解除加载态
      uploading.value = false
    }
  }
</script>
