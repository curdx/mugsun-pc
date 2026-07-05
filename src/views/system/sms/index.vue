<!-- 短信平台配置页面（对接后端 /system/sms，启用渠道运行时切换） -->
<template>
  <div class="sms-page art-full-height">
    <ElCard class="art-table-card">
      <div class="sms-toolbar">
        <ElButton @click="showDialog('add')" v-ripple>新增短信</ElButton>
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="name" label="名称" min-width="140" />
        <ElTableColumn prop="smsCode" label="配置标识" min-width="140" />
        <ElTableColumn prop="category" label="供应商" width="110" />
        <ElTableColumn prop="signature" label="签名" min-width="120" />
        <ElTableColumn prop="templateId" label="模板" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220">
          <template #default="{ row }">
            <ElButton link type="primary" :disabled="row.status === 1" @click="enableRow(row)">
              启用
            </ElButton>
            <ElButton link type="primary" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <SmsDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :sms-data="currentData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchSmsPage, fetchSaveSms, fetchRemoveSms, fetchEnableSms } from '@/api/system-manage'
  import SmsDialog from './modules/sms-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Sms' })

  const tableData = ref<any[]>([])
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    const resp = await fetchSmsPage({ pageNum: 1, pageSize: 50 })
    tableData.value = resp?.records ?? []
  }

  onMounted(loadData)

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = row ? { ...row } : {}
    dialogVisible.value = true
  }

  const enableRow = async (row: any): Promise<void> => {
    await fetchEnableSms(row.id)
    ElMessage.success('已启用')
    loadData()
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除短信配置"${row.name}"吗？`, '删除短信', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveSms(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveSms(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  }
</script>

<style scoped>
  .sms-toolbar {
    margin-bottom: 12px;
  }
</style>
