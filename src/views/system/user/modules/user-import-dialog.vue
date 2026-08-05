<!-- 用户导入弹窗：模板下载 + 覆盖开关 + 上传 + 结构化结果（成败计数/失败明细/明细下载） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    title="导入用户"
    width="620px"
    align-center
    @closed="resetState"
  >
    <div class="import-tips">
      <span>请按模板填写后上传，部门/岗位按名称匹配，新用户初始密码为系统初始密码。</span>
      <ElButton link type="primary" @click="downloadUserImportTemplate()">下载模板</ElButton>
    </div>
    <ElCheckbox v-model="updateSupport">
      覆盖已存在的账号（按用户名更新昵称/状态/邮箱/部门/岗位，不更新密码与手机号）
    </ElCheckbox>
    <ElUpload
      ref="uploadRef"
      drag
      :auto-upload="false"
      :limit="1"
      accept=".xlsx,.xls"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :on-exceed="handleFileExceed"
      style="margin-top: 12px"
    >
      <ElIcon class="el-icon--upload"><UploadFilled /></ElIcon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
    </ElUpload>

    <!-- 导入结果：成败计数 + 失败明细 -->
    <div v-if="result" class="import-result">
      <ElAlert
        :type="result.failCount > 0 ? 'warning' : 'success'"
        :closable="false"
        :title="`导入完成：成功 ${result.successCount} 条，失败 ${result.failCount} 条`"
      />
      <template v-if="result.failList.length > 0">
        <div class="fail-header">
          <span>失败明细</span>
          <ElButton link type="primary" @click="downloadFailList">下载失败明细</ElButton>
        </div>
        <ElTable :data="result.failList" border size="small" max-height="240">
          <ElTableColumn prop="rowIndex" label="行号" width="80" />
          <ElTableColumn prop="username" label="用户名" min-width="120" show-overflow-tooltip />
          <ElTableColumn prop="reason" label="失败原因" min-width="180" show-overflow-tooltip />
        </ElTable>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
        <ElButton type="primary" :loading="importing" :disabled="!file" @click="handleImport">
          开始导入
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import FileSaver from 'file-saver'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import type { UploadFile, UploadInstance, UploadRawFile } from 'element-plus'
  import { downloadUserImportTemplate, importUser } from '@/api/user'
  import type { UserImportResult } from '@/api/user/type'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const uploadRef = ref<UploadInstance>()
  const updateSupport = ref(false)
  const file = ref<File | null>(null)
  const importing = ref(false)
  const result = ref<UserImportResult | null>(null)

  // 每次关闭后复位（文件/结果/开关），下次打开是干净表单
  const resetState = (): void => {
    uploadRef.value?.clearFiles()
    file.value = null
    result.value = null
    updateSupport.value = false
    importing.value = false
  }

  const handleFileChange = (uploadFile: UploadFile): void => {
    file.value = uploadFile.raw ?? null
    result.value = null
  }

  const handleFileRemove = (): void => {
    file.value = null
  }

  // 超出 limit 时替换为新选文件（避免「得先删再选」的两步操作）
  const handleFileExceed = (files: File[]): void => {
    uploadRef.value?.clearFiles()
    const raw = files[0] as UploadRawFile
    uploadRef.value?.handleStart(raw)
    file.value = raw
    result.value = null
  }

  const handleImport = async (): Promise<void> => {
    if (!file.value || importing.value) return
    importing.value = true
    try {
      const data = await importUser(file.value, updateSupport.value)
      result.value = data ?? { successCount: 0, failCount: 0, failList: [] }
      if (result.value.failCount === 0) {
        ElMessage.success(`导入成功 ${result.value.successCount} 条`)
      }
      // 有成功写入即刷新列表（含部分成功）
      if (result.value.successCount > 0) {
        emit('success')
      }
    } finally {
      importing.value = false
    }
  }

  // 失败明细前端生成 xlsx（复用 xlsx + file-saver，与 art-excel-export 同链路）
  const downloadFailList = (): void => {
    if (!result.value?.failList.length) return
    const rows = result.value.failList.map((f) => ({
      行号: f.rowIndex,
      用户名: f.username,
      失败原因: f.reason
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入失败明细')
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    FileSaver.saveAs(blob, '用户导入失败明细.xlsx')
  }
</script>

<style scoped>
  .import-tips {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
  }

  .import-result {
    margin-top: 16px;
  }

  .fail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 12px 0 8px;
  }
</style>
