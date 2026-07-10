<!-- 客户管理（演示业务，对接 /system/customer）：数据按当前租户的独立数据源路由 -->
<template>
  <div class="customer-page art-full-height">
    <ElCard class="art-table-card">
      <div class="customer-toolbar">
        <ElButton type="primary" @click="showCreate">新增客户</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="tenantId" label="租户" width="120" />
        <ElTableColumn prop="name" label="客户名称" min-width="160" />
        <ElTableColumn prop="phone" label="电话" min-width="140" />
        <ElTableColumn prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" title="新增客户" width="500px" align-center>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="客户名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入客户名称" />
        </ElFormItem>
        <ElFormItem label="电话" prop="phone">
          <ElInput v-model="form.phone" placeholder="请输入电话" />
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
  import { fetchCustomerPage, fetchSubmitCustomer, fetchRemoveCustomer } from '@/api/datasource'

  defineOptions({ name: 'Customer' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive<Record<string, any>>({ name: '', phone: '', remark: '' })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchCustomerPage({ pageNum: 1, pageSize: 50 })
      tableData.value = resp?.records ?? []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const showCreate = (): void => {
    Object.assign(form, { name: '', phone: '', remark: '' })
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSubmitCustomer({ ...form })
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    })
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除客户"${row.name}"吗？`, '删除客户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveCustomer(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .customer-toolbar {
    margin-bottom: 12px;
  }
</style>
