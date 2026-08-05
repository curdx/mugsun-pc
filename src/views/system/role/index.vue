<!-- 角色管理页面 -->
<template>
  <div class="role-page art-full-height">
    <!-- 查询栏：条件实时生效、重置回默认 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton v-perm="'sys:role:save'" @click="showDialog('add')" v-ripple>新增角色</ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <RoleDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :role-data="currentData"
        @submit="handleDialogSubmit"
      />

      <RolePermissionDialog
        v-model:visible="permissionVisible"
        :role-data="currentPermRole"
        @success="refreshData"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, nextTick } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchRolePage, saveRole, removeRole } from '@/api/role'
  import RoleDialog from './modules/role-dialog.vue'
  import RolePermissionDialog from './modules/role-permission-dialog.vue'
  import { ElButton, ElMessageBox, ElMessage } from 'element-plus'
  import { hasPerm } from '@/utils/permission'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Role' })

  // ===== 查询栏 =====
  const searchForm = ref({
    roleName: '',
    roleCode: ''
  })
  const searchItems = [
    {
      key: 'roleName',
      label: '角色名称',
      type: 'input',
      props: { placeholder: '请输入角色名称', clearable: true }
    },
    {
      key: 'roleCode',
      label: '角色编码',
      type: 'input',
      props: { placeholder: '请输入角色编码', clearable: true }
    }
  ]

  const SCOPE_LABELS: Record<number, string> = {
    1: '全部数据',
    2: '本部门数据',
    3: '本部门及子部门',
    4: '仅本人数据',
    5: '自定义部门'
  }

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})
  const permissionVisible = ref(false)
  const currentPermRole = ref<Record<string, any>>({})

  const showPermission = (row: Record<string, any>): void => {
    currentPermRole.value = row
    permissionVisible.value = true
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    fetchData,
    replaceSearchParams,
    resetSearchParams
  } = useTable({
    core: {
      apiFn: fetchRolePage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'roleName', label: '角色名称', minWidth: 140 },
        { prop: 'roleCode', label: '角色编码', minWidth: 140 },
        {
          prop: 'dataScope',
          label: '数据范围',
          minWidth: 140,
          formatter: (row: any) => SCOPE_LABELS[row.dataScope as number] ?? '-'
        },
        { prop: 'sort', label: '排序', width: 100 },
        {
          prop: 'operation',
          label: '操作',
          width: 180,
          fixed: 'right',
          // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控
          formatter: (row: any) =>
            h('div', [
              hasPerm('sys:role:save')
                ? h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) })
                : null,
              hasPerm('sys:role:remove')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => deleteRow(row) })
                : null,
              hasPerm('sys:role:grant')
                ? h(
                    ElButton,
                    {
                      link: true,
                      type: 'primary',
                      size: 'small',
                      style: 'margin-left:8px',
                      onClick: () => showPermission(row)
                    },
                    () => '授权'
                  )
                : null
            ])
        }
      ]
    },
    transform: {
      responseAdapter: (resp: any) => ({
        records: resp?.records ?? [],
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 20
      })
    }
  })

  // ===== 查询栏联动 =====
  const handleSearch = async (params: Record<string, any>): Promise<void> => {
    // 替换全部查询参数（防旧条件残留），回到第一页
    replaceSearchParams({ ...params, pageNum: 1, pageSize: 20 })
    await fetchData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      roleName: '',
      roleCode: ''
    }
    resetSearchParams()
    await fetchData()
  }

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = row ? { ...row } : {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除角色"${row.roleName}"吗？`, '删除角色', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await removeRole([row.id])
      ElMessage.success('删除成功')
      refreshData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await saveRole(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    refreshData()
  }
</script>
