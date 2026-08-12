<!-- 邮件模板管理页面（对接后端 /system/mail-template） -->
<template>
  <div class="mail-template-page art-full-height">
    <ElCard class="art-table-card">
      <!-- 列布局容器：工具栏/分页器固定，表格区 flex:1 + height:100% 内部滚动，
           防卡片体 overflow:hidden 裁掉分页器（同全局 .art-table-card 契约） -->
      <div class="mail-template-body">
        <div class="mt-toolbar">
          <ElButton
            v-perm="'sys:mail-template:save'"
            type="primary"
            @click="showDialog('add')"
            v-ripple
            >新增模板</ElButton
          >
        </div>

        <div class="mt-table-wrap">
          <ElTable v-loading="loading" :data="tableData" border height="100%">
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
                <ElButton
                  v-perm="'sys:mail-template:save'"
                  link
                  type="primary"
                  @click="showDialog('edit', row)"
                  >编辑</ElButton
                >
                <ElButton
                  v-perm="'sys:mail-template:send'"
                  link
                  type="success"
                  @click="sendTest(row)"
                  >发送测试</ElButton
                >
                <ElButton
                  v-perm="'sys:mail-template:remove'"
                  link
                  type="danger"
                  @click="deleteRow(row)"
                  >删除</ElButton
                >
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <div class="mt-pager">
          <ElPagination
            v-model:current-page="pageNum"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            background
            @current-change="loadData"
          />
        </div>
      </div>

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
  const loading = ref(false)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const res = await fetchMailTemplatePage({
        pageNum: pageNum.value,
        pageSize: pageSize.value
      })
      tableData.value = res?.records || []
      total.value = res?.totalRow ?? 0
    } finally {
      loading.value = false
    }
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
        inputValue: 'demo@mugsun.local',
        inputPattern: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
        inputErrorMessage: '请输入正确的邮箱地址'
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

<style lang="scss" scoped>
  .mail-template-body {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .mt-table-wrap {
    flex: 1;
    min-height: 0;
  }

  .mt-toolbar {
    margin-bottom: 12px;
  }

  .mt-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
