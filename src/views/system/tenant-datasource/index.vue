<!-- 租户独立数据源配置（对接 /system/tenant-datasource）：配置后该租户业务数据落独立库 -->
<template>
  <div class="tds-page art-full-height">
    <ElCard class="art-table-card">
      <div class="tds-toolbar">
        <ElButton type="primary" @click="showCreate">新增数据源</ElButton>
        <ElAlert
          type="info"
          :closable="false"
          title="为租户配置独立库后，该租户的业务数据（客户管理）将写入其独立数据库，实现多源隔离。"
        />
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="tenantCode" label="租户编号" width="120" />
        <ElTableColumn prop="dsUrl" label="数据源 URL" min-width="280" show-overflow-tooltip />
        <ElTableColumn prop="dsUsername" label="用户名" width="120" />
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showEdit(row)">编辑</ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑数据源' : '新增数据源'"
      width="560px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="租户编号" prop="tenantCode">
          <ElInput v-model="form.tenantCode" placeholder="如 866786" :disabled="!!form.id" />
        </ElFormItem>
        <ElFormItem label="数据源 URL" prop="dsUrl">
          <ElInput v-model="form.dsUrl" placeholder="jdbc:postgresql://host:5432/db" />
        </ElFormItem>
        <ElFormItem label="用户名" prop="dsUsername">
          <ElInput v-model="form.dsUsername" placeholder="数据库用户名" />
        </ElFormItem>
        <ElFormItem label="密码" prop="dsPassword">
          <ElInput
            v-model="form.dsPassword"
            type="password"
            show-password
            placeholder="数据库密码"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="备注" />
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
  import { ref, reactive, onMounted } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchTenantDatasourcePage,
    fetchSubmitTenantDatasource,
    fetchRemoveTenantDatasource
  } from '@/api/datasource'

  defineOptions({ name: 'TenantDatasource' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive<Record<string, any>>({
    id: null,
    tenantCode: '',
    dsUrl: '',
    dsUsername: '',
    dsPassword: '',
    status: 1,
    remark: ''
  })

  const rules: FormRules = {
    tenantCode: [{ required: true, message: '请输入租户编号', trigger: 'blur' }],
    dsUrl: [{ required: true, message: '请输入数据源 URL', trigger: 'blur' }],
    dsUsername: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchTenantDatasourcePage({ pageNum: 1, pageSize: 50 })
      tableData.value = resp?.records ?? []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const showCreate = (): void => {
    Object.assign(form, {
      id: null,
      tenantCode: '',
      dsUrl: '',
      dsUsername: '',
      dsPassword: '',
      status: 1,
      remark: ''
    })
    dialogVisible.value = true
  }

  const showEdit = (row: any): void => {
    Object.assign(form, {
      id: row.id,
      tenantCode: row.tenantCode,
      dsUrl: row.dsUrl,
      dsUsername: row.dsUsername,
      dsPassword: '******',
      status: row.status,
      remark: row.remark
    })
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSubmitTenantDatasource({ ...form })
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    })
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除租户"${row.tenantCode}"的独立数据源吗？`, '删除数据源', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveTenantDatasource(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .tds-toolbar {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
  }
</style>
