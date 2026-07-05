<!-- 租户管理页面 -->
<template>
  <div class="tenant-page art-full-height">
    <ElCard class="art-table-card">
      <div class="tenant-toolbar">
        <ElButton @click="dialogVisible = true" v-ripple>新增租户</ElButton>
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="tenantCode" label="租户编号" width="120" />
        <ElTableColumn prop="tenantName" label="租户名称" min-width="160" />
        <ElTableColumn prop="contactUser" label="联系人" min-width="120" />
        <ElTableColumn prop="contactPhone" label="联系电话" min-width="140" />
        <ElTableColumn prop="expireTime" label="过期时间" min-width="180" />
        <ElTableColumn label="操作" width="100">
          <template #default="{ row }">
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <TenantDialog v-model:visible="dialogVisible" @submit="handleCreate" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchTenantList, fetchCreateTenant, fetchRemoveTenant } from '@/api/system-manage'
  import TenantDialog from './modules/tenant-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'

  defineOptions({ name: 'Tenant' })

  const tableData = ref<any[]>([])
  const dialogVisible = ref(false)

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchTenantList()) || []
  }

  onMounted(loadData)

  const handleCreate = async (form: Record<string, any>): Promise<void> => {
    const code = await fetchCreateTenant(form)
    dialogVisible.value = false
    ElMessage.success(`租户创建成功，编号 ${code}，已初始化默认数据`)
    loadData()
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除租户"${row.tenantName}"吗？`, '删除租户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveTenant(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .tenant-toolbar {
    margin-bottom: 12px;
  }
</style>
