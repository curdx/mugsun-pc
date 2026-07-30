<!-- 附件管理页面 -->
<template>
  <div class="attach-page art-full-height">
    <ElCard class="art-table-card">
      <div class="attach-toolbar">
        <ElButton :loading="uploading" @click="triggerUpload" v-ripple>上传附件</ElButton>
        <input ref="uploadInput" type="file" style="display: none" @change="handleUpload" />
        <ElProgress
          v-if="uploading && directUploading"
          :percentage="uploadPercent"
          class="attach-progress"
        />
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="name" label="文件名" min-width="220" show-overflow-tooltip />
        <ElTableColumn prop="ext" label="类型" width="100" />
        <ElTableColumn label="大小" width="120">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="platform" label="存储平台" width="140" />
        <ElTableColumn label="操作" width="160">
          <template #default="{ row }">
            <ElButton link type="primary" @click="download(row)">下载</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import {
    fetchAttachList,
    fetchUploadFile,
    fetchPresignedPut,
    fetchCreateAttach,
    fetchRemoveAttach
  } from '@/api/system-manage'
  import request from '@/utils/http'
  import { ElMessageBox, ElMessage } from 'element-plus'

  defineOptions({ name: 'Attach' })

  const tableData = ref<any[]>([])
  const uploadInput = ref<HTMLInputElement>()
  const uploading = ref(false)
  /** 是否命中两段式直传（云存储平台），决定进度条可见性 */
  const directUploading = ref(false)
  const uploadPercent = ref(0)

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchAttachList()) || []
  }

  onMounted(loadData)

  const formatSize = (size: number): string => {
    if (!size) return '-'
    if (size < 1024) return size + ' B'
    if (size < 1048576) return (size / 1024).toFixed(1) + ' KB'
    return (size / 1048576).toFixed(1) + ' MB'
  }

  const triggerUpload = (): void => {
    uploadInput.value?.click()
  }

  /** XHR PUT 直传云存储（带上传进度；仅携带签发回执的 headers） */
  const putToCloud = (url: string, headers: Record<string, string>, file: File): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url)
      Object.entries(headers || {}).forEach(([key, value]) => xhr.setRequestHeader(key, value))
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) uploadPercent.value = Math.round((e.loaded / e.total) * 100)
      }
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`直传失败 HTTP ${xhr.status}`))
      xhr.onerror = () => reject(new Error('直传网络错误'))
      xhr.send(file)
    })

  /**
   * 两段式直传：先求 presigned-put 签发 → 命中（云存储平台）则 PUT 直传 + create 回填；
   * supported=false（本地存储不支持预签名）回退既有 multipart 上传。
   */
  const handleUpload = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploading.value = true
    directUploading.value = false
    uploadPercent.value = 0
    try {
      const sign = await fetchPresignedPut({ filename: file.name, access: 'private' })
      if (sign?.supported && sign.uploadUrl && sign.ticket) {
        directUploading.value = true
        await putToCloud(sign.uploadUrl, sign.headers || {}, file)
        await fetchCreateAttach({ ticket: sign.ticket, size: file.size })
      } else {
        await fetchUploadFile(file)
      }
      ElMessage.success('上传成功')
      loadData()
    } finally {
      uploading.value = false
      directUploading.value = false
      input.value = ''
    }
  }

  const download = (row: any): Promise<void> =>
    // 授权流式下载：统一走 request.download（带 token + 真实文件名 + 失败 toast）
    request.download({
      url: `/api/system/file/download-stream/${row.id}`,
      filename: row.name || row.filename
    })

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除附件"${row.name}"吗？`, '删除附件', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveAttach(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .attach-toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .attach-progress {
    flex: 1;
    max-width: 320px;
  }
</style>
