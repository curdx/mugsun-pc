<!-- 邮件模板管理页面（对接后端 /system/mail-template） -->
<template>
  <div class="mail-template-page art-full-height">
    <ElCard class="art-table-card">
      <div class="mt-toolbar">
        <ElButton type="primary" @click="showDialog('add')" v-ripple>新增模板</ElButton>
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="code" label="模板编码" min-width="140" />
        <ElTableColumn prop="name" label="模板名称" min-width="160" />
        <ElTableColumn prop="subject" label="邮件主题" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="status" label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="success" @click="sendTest(row)">发送测试</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <MailTemplateDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :template-data="currentData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import {
    fetchMailTemplatePage,
    fetchSaveMailTemplate,
    fetchRemoveMailTemplate,
    fetchSendTestMail
  } from '@/api/system-manage'
  import MailTemplateDialog from './modules/mail-template-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'MailTemplate' })

  const tableData = ref<any[]>([])
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    const res = await fetchMailTemplatePage({ pageNum: 1, pageSize: 100 })
    tableData.value = res?.records || []
  }

  onMounted(loadData)

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = row ? { ...row } : {}
    dialogVisible.value = true
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除模板"${row.name}"吗？`, '删除模板', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveMailTemplate(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const sendTest = async (row: any): Promise<void> => {
    const { value } = await ElMessageBox.prompt(
      '请输入接收邮箱（无凭证时降级为日志）',
      '发送测试',
      {
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        inputValue: 'demo@mugsun.local'
      }
    )
    const content = await fetchSendTestMail({ code: row.code, to: value })
    ElMessageBox.alert(String(content), '已发送（渲染内容）', { confirmButtonText: '知道了' })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveMailTemplate(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  }
</script>

<style scoped>
  .mt-toolbar {
    margin-bottom: 12px;
  }
</style>
