<!-- 登录客户端差异化策略：验证码开关 / 并发在线数 / 令牌有效期，一 client 一套 -->
<template>
  <div class="client-page art-full-height">
    <ElCard class="art-table-card">
      <div class="client-toolbar">
        <span class="client-title">登录客户端</span>
        <ElButton v-perm="'sys:client:save'" type="primary" @click="openCreate"
          >新增客户端</ElButton
        >
      </div>

      <div class="client-table-scroll">
        <ElTable :data="tableData" border v-loading="loading">
          <ElTableColumn prop="clientId" label="客户端码" min-width="120" />
          <ElTableColumn prop="clientName" label="名称" min-width="140" show-overflow-tooltip />
          <ElTableColumn label="图形验证码" width="110">
            <template #default="{ row }">
              <ElTag :type="row.captchaEnabled === 1 ? 'success' : 'info'" size="small">
                {{ row.captchaEnabled === 1 ? '开启' : '关闭' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="maxOnline" label="最大在线(0不限)" width="130" />
          <ElTableColumn label="令牌有效期" width="120">
            <template #default="{ row }">{{ formatSecondsDuration(row.tokenTimeout) }}</template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="90">
            <template #default="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? '启用' : '停用' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <ElButton
                v-perm="'sys:client:save'"
                link
                type="primary"
                size="small"
                @click="openEdit(row)"
                >编辑</ElButton
              >
              <ElButton
                v-perm="'sys:client:edit'"
                link
                :type="row.status === 1 ? 'warning' : 'success'"
                size="small"
                @click="toggleStatus(row)"
              >
                {{ row.status === 1 ? '停用' : '启用' }}
              </ElButton>
              <ElButton
                v-perm="'sys:client:remove'"
                link
                type="danger"
                size="small"
                @click="remove(row)"
                >删除</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <div class="client-pager">
        <ElPagination
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="pageNum"
          @current-change="onPage"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增客户端' : '编辑客户端'"
      width="480px"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
        <ElFormItem label="客户端码" prop="clientId">
          <ElInput
            v-model="form.clientId"
            :disabled="dialogType === 'edit'"
            placeholder="如 app / miniapp"
          />
        </ElFormItem>
        <ElFormItem label="名称" prop="clientName">
          <ElInput v-model="form.clientName" />
        </ElFormItem>
        <ElFormItem label="图形验证码">
          <ElSwitch v-model="form.captchaEnabled" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="最大在线(0不限)">
          <ElInputNumber v-model="form.maxOnline" :min="0" />
        </ElFormItem>
        <ElFormItem label="令牌有效期(秒)">
          <ElInputNumber v-model="form.tokenTimeout" :min="60" :step="600" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, reactive, ref } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchClientPage,
    fetchSaveClient,
    fetchRemoveClient,
    fetchEnableClient,
    fetchDisableClient
  } from '@/api/client'
  import { formatSecondsDuration } from '@/utils/date'

  defineOptions({ name: 'Client' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = 10

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()
  const form = reactive<any>({
    id: undefined,
    clientId: '',
    clientName: '',
    captchaEnabled: 1,
    maxOnline: 0,
    tokenTimeout: 2592000
  })

  const rules: FormRules = {
    clientId: [{ required: true, message: '请输入客户端码', trigger: 'blur' }],
    clientName: [{ required: true, message: '请输入名称', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const res: any = await fetchClientPage({ pageNum: pageNum.value, pageSize })
      tableData.value = res?.records ?? []
      total.value = res?.totalRow ?? 0
    } finally {
      loading.value = false
    }
  }

  const onPage = (p: number): void => {
    pageNum.value = p
    loadData()
  }

  const openCreate = (): void => {
    dialogType.value = 'add'
    Object.assign(form, {
      id: undefined,
      clientId: '',
      clientName: '',
      captchaEnabled: 1,
      maxOnline: 0,
      tokenTimeout: 2592000
    })
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const openEdit = (row: any): void => {
    dialogType.value = 'edit'
    Object.assign(form, row)
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSaveClient(form)
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    })
  }

  const toggleStatus = async (row: any): Promise<void> => {
    // 启用无风险直接执行；停用后该客户端将无法登录，属危险操作须二次确认
    if (row.status !== 1) {
      await fetchEnableClient(row.id)
      ElMessage.success('操作成功')
      loadData()
      return
    }
    ElMessageBox.confirm(`确定停用客户端「${row.clientName}」吗？停用后该端将无法登录。`, '停用', {
      type: 'warning'
    }).then(async () => {
      await fetchDisableClient(row.id)
      ElMessage.success('操作成功')
      loadData()
    })
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除客户端「${row.clientName}」吗？`, '删除', {
      type: 'warning'
    }).then(async () => {
      await fetchRemoveClient([row.id])
      ElMessage.success('删除成功')
      loadData()
    })
  }

  onMounted(loadData)
</script>

<style scoped>
  /* 表格为自由增长内容：.art-table-card 定高 + .el-card__body 裁剪，
     须自备内部滚动，否则矮视口多行时底部行被切断不可达（范式同 monitor/track-user） */
  .art-table-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
  }

  .client-toolbar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .client-title {
    font-size: 15px;
    font-weight: 500;
  }

  .client-table-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .client-pager {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
