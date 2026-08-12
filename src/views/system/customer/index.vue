<!-- 客户管理（演示业务，对接 /system/customer）：数据按当前租户的独立数据源路由 -->
<template>
  <div class="customer-page art-full-height">
    <ElCard class="art-table-card">
      <div class="customer-toolbar">
        <ElButton type="primary" @click="showCreate">新增客户</ElButton>
      </div>

      <!-- 表格为自由增长内容：art-table-card 卡片体是 height:100%+overflow:hidden 裁剪，
           内部须自备滚动，否则矮视口下底部行被切断且不可达（同 track/user 修法） -->
      <div v-loading="loading" class="customer-table-wrap">
        <ElTable :data="tableData" border>
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
      </div>

      <!-- 分页器放滚动区外并禁止收缩：翻页始终可见可达（同 mail-template 范式） -->
      <div class="customer-pager">
        <ElPagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          background
          @current-change="loadData"
        />
      </div>
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
        <ElButton type="primary" :loading="dialogSaving" @click="submit">保存</ElButton>
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
  const pageNum = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const dialogVisible = ref(false)
  const dialogSaving = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive<Record<string, any>>({ name: '', phone: '', remark: '' })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }]
  }

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchCustomerPage({ pageNum: pageNum.value, pageSize: pageSize.value })
      tableData.value = resp?.records ?? []
      total.value = resp?.totalRow ?? 0
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
      dialogSaving.value = true
      try {
        await fetchSubmitCustomer({ ...form })
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      } finally {
        dialogSaving.value = false
      }
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
  /* 卡片体改为纵向 flex，表格滚动区占满剩余高度（滚动区见模板注释） */
  .customer-page :deep(.art-table-card > .el-card__body) {
    display: flex;
    flex-direction: column;
  }

  .customer-toolbar {
    flex-shrink: 0;
    margin-bottom: 12px;
  }

  .customer-table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .customer-pager {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
