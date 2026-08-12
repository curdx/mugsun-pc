<!-- 租户管理页面 -->
<template>
  <div class="tenant-page art-full-height">
    <!-- 查询栏：条件实时生效、重置回默认 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <div class="tenant-toolbar">
        <ElButton v-perm="'sys:tenant:save'" type="primary" @click="openCreate" v-ripple
          >新增租户</ElButton
        >
      </div>

      <!-- 表格为自由增长内容：art-table-card 卡片体是 height:100%+overflow:hidden 裁剪，
           内部须自备滚动，否则矮视口下底部行被切断且不可达（同 track/user 修法） -->
      <div v-loading="loading" class="tenant-table-wrap">
        <ElTable :data="tableData" border>
          <ElTableColumn type="index" label="序号" width="60" />
          <ElTableColumn prop="tenantCode" label="租户编号" width="120" />
          <ElTableColumn prop="tenantName" label="租户名称" min-width="140" />
          <ElTableColumn label="套餐" min-width="100">
            <template #default="{ row }">
              <ElTag v-if="row.packageId" type="success">{{ packageName(row.packageId) }}</ElTag>
              <ElTag v-else type="info">不限功能</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="contactUser" label="联系人" min-width="100" />
          <ElTableColumn prop="contactPhone" label="联系电话" min-width="110" />
          <ElTableColumn label="账号上限" width="90" align="center" header-align="center">
            <template #default="{ row }">
              {{ row.accountCount == null || row.accountCount < 0 ? '不限' : row.accountCount }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="90" align="center" header-align="center">
            <template #default="{ row }">
              <ElTag v-if="row.status === 0" type="danger">停用</ElTag>
              <ElTag v-else type="success">正常</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="过期时间" min-width="180">
            <template #default="{ row }">
              {{ row.expireTime ? formatTableTime(row.expireTime) : '永不过期' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ElButton v-perm="'sys:tenant:save'" link type="primary" @click="openEdit(row)"
                >编辑</ElButton
              >
              <ElButton v-perm="'sys:tenant:remove'" link type="danger" @click="deleteRow(row)"
                >删除</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <TenantDialog
        v-model:visible="dialogVisible"
        :row="current"
        :packages="packages"
        :saving="dialogSaving"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import {
    fetchTenantList,
    fetchCreateTenant,
    fetchUpdateTenant,
    fetchRemoveTenant,
    fetchTenantPackageList
  } from '@/api/system-manage'
  import TenantDialog from './modules/tenant-dialog.vue'
  import { formatTableTime } from '@/utils/date'
  import { ElMessageBox, ElMessage } from 'element-plus'

  defineOptions({ name: 'Tenant' })

  // ===== 查询栏 =====
  const searchForm = ref({
    tenantName: '',
    tenantCode: '',
    status: undefined as number | undefined
  })
  const searchItems = computed(() => [
    {
      key: 'tenantName',
      label: '租户名称',
      type: 'input',
      props: { placeholder: '请输入租户名称', clearable: true }
    },
    {
      key: 'tenantCode',
      label: '租户编号',
      type: 'input',
      props: { placeholder: '请输入租户编号', clearable: true }
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '正常', value: 1 },
          { label: '停用', value: 0 }
        ]
      }
    }
  ])

  const tableData = ref<any[]>([])
  const packages = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const dialogSaving = ref(false)
  const current = ref<Record<string, any> | null>(null)

  const packageName = (id: number | string): string =>
    packages.value.find((p) => String(p.id) === String(id))?.name ?? '—'

  // 查询条件以 searchForm 为唯一事实源（v-model 已同步），CRUD 刷新后过滤仍生效
  const currentParams = (): Record<string, any> => ({
    tenantName: searchForm.value.tenantName || undefined,
    tenantCode: searchForm.value.tenantCode || undefined,
    status: searchForm.value.status
  })

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchTenantList(currentParams())) || []
    } finally {
      loading.value = false
    }
  }

  const loadPackages = async (): Promise<void> => {
    packages.value = (await fetchTenantPackageList()) || []
  }

  onMounted(() => {
    loadData()
    loadPackages()
  })

  // ===== 查询栏联动 =====
  const handleSearch = async (): Promise<void> => {
    await loadData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      tenantName: '',
      tenantCode: '',
      status: undefined
    }
    await loadData()
  }

  const openCreate = (): void => {
    current.value = null
    dialogVisible.value = true
  }

  const openEdit = (row: any): void => {
    current.value = { ...row }
    dialogVisible.value = true
  }

  const handleSubmit = async (form: Record<string, any>): Promise<void> => {
    dialogSaving.value = true
    try {
      if (form.id) {
        await fetchUpdateTenant(form)
        ElMessage.success('更新成功')
      } else {
        const code = await fetchCreateTenant(form)
        ElMessage.success(`租户创建成功，编号 ${code}，已初始化默认数据`)
      }
      dialogVisible.value = false
      loadData()
    } finally {
      dialogSaving.value = false
    }
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
  /* 卡片体改为纵向 flex，表格滚动区占满剩余高度（滚动区见模板注释） */
  .tenant-page :deep(.art-table-card > .el-card__body) {
    display: flex;
    flex-direction: column;
  }

  .tenant-toolbar {
    flex-shrink: 0;
    margin-bottom: 12px;
  }

  .tenant-table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
</style>
