<!-- 租户管理页面 -->
<template>
  <div class="tenant-page art-full-height">
    <ElCard class="art-table-card">
      <div class="tenant-toolbar">
        <ElButton type="primary" @click="openCreate" v-ripple>新增租户</ElButton>
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="tenantCode" label="租户编号" width="120" />
        <ElTableColumn prop="tenantName" label="租户名称" min-width="150" />
        <ElTableColumn label="套餐" min-width="130">
          <template #default="{ row }">
            <ElTag v-if="row.packageId" type="success">{{ packageName(row.packageId) }}</ElTag>
            <ElTag v-else type="info">不限功能</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="contactUser" label="联系人" min-width="110" />
        <ElTableColumn prop="contactPhone" label="联系电话" min-width="130" />
        <ElTableColumn label="账号上限" width="100" align="center">
          <template #default="{ row }">
            {{ row.accountCount == null || row.accountCount < 0 ? '不限' : row.accountCount }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.status === 0" type="danger">停用</ElTag>
            <ElTag v-else type="success">正常</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="expireTime" label="过期时间" min-width="170" />
        <ElTableColumn label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEdit(row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <TenantDialog
        v-model:visible="dialogVisible"
        :row="current"
        :packages="packages"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import {
    fetchTenantList,
    fetchCreateTenant,
    fetchUpdateTenant,
    fetchRemoveTenant,
    fetchTenantPackageList
  } from '@/api/system-manage'
  import TenantDialog from './modules/tenant-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'

  defineOptions({ name: 'Tenant' })

  const tableData = ref<any[]>([])
  const packages = ref<any[]>([])
  const dialogVisible = ref(false)
  const current = ref<Record<string, any> | null>(null)

  const packageName = (id: number | string): string =>
    packages.value.find((p) => String(p.id) === String(id))?.name ?? '—'

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchTenantList()) || []
  }

  const loadPackages = async (): Promise<void> => {
    packages.value = (await fetchTenantPackageList()) || []
  }

  onMounted(() => {
    loadData()
    loadPackages()
  })

  const openCreate = (): void => {
    current.value = null
    dialogVisible.value = true
  }

  const openEdit = (row: any): void => {
    current.value = { ...row }
    dialogVisible.value = true
  }

  const handleSubmit = async (form: Record<string, any>): Promise<void> => {
    if (form.id) {
      await fetchUpdateTenant(form)
      ElMessage.success('更新成功')
    } else {
      const code = await fetchCreateTenant(form)
      ElMessage.success(`租户创建成功，编号 ${code}，已初始化默认数据`)
    }
    dialogVisible.value = false
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
