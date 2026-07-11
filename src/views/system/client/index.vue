<!-- 登录客户端差异化策略：验证码开关 / 并发在线数 / 令牌有效期，一 client 一套 -->
<template>
  <div class="client-page art-full-height">
    <ElCard class="art-table-card">
      <div class="client-toolbar">
        <span class="client-title">登录客户端</span>
        <ElButton type="primary" @click="openCreate">新增客户端</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn prop="clientId" label="客户端码" min-width="120" />
        <ElTableColumn prop="clientName" label="名称" min-width="140" />
        <ElTableColumn label="图形验证码" width="110">
          <template #default="{ row }">
            <ElTag :type="row.captchaEnabled === 1 ? 'success' : 'info'" size="small">
              {{ row.captchaEnabled === 1 ? '开启' : '关闭' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="maxOnline" label="最大在线(0不限)" width="130" />
        <ElTableColumn prop="tokenTimeout" label="令牌有效期(秒)" width="130" />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="openEdit(row)">编辑</ElButton>
            <ElButton
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </ElButton>
            <ElButton link type="danger" size="small" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

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
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="客户端码" required>
          <ElInput
            v-model="form.clientId"
            :disabled="dialogType === 'edit'"
            placeholder="如 app / miniapp"
          />
        </ElFormItem>
        <ElFormItem label="名称" required>
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
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchClientPage,
    fetchSaveClient,
    fetchRemoveClient,
    fetchEnableClient,
    fetchDisableClient
  } from '@/api/client'

  defineOptions({ name: 'Client' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = 10

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const form = reactive<any>({
    id: undefined,
    clientId: '',
    clientName: '',
    captchaEnabled: 1,
    maxOnline: 0,
    tokenTimeout: 2592000
  })

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
  }

  const openEdit = (row: any): void => {
    dialogType.value = 'edit'
    Object.assign(form, row)
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!form.clientId || !form.clientName) {
      ElMessage.warning('客户端码与名称必填')
      return
    }
    await fetchSaveClient(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  }

  const toggleStatus = async (row: any): Promise<void> => {
    if (row.status === 1) {
      await fetchDisableClient(row.id)
    } else {
      await fetchEnableClient(row.id)
    }
    ElMessage.success('操作成功')
    loadData()
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
  .client-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .client-title {
    font-size: 15px;
    font-weight: 500;
  }

  .client-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
