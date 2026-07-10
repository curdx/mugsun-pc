<!-- 用户管理页面 -->
<template>
  <div class="user-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton v-perm="'sys:user:add'" @click="showDialog('add')" v-ripple>新增用户</ElButton>
          <ElButton @click="handleExport" v-ripple>导出</ElButton>
          <ElButton v-perm="'sys:user:add'" @click="triggerImport" v-ripple>导入</ElButton>
          <ElButton @click="handleResetColumns" v-ripple>恢复默认列</ElButton>
          <input
            ref="importInput"
            type="file"
            accept=".xlsx,.xls"
            style="display: none"
            @change="handleImport"
          />
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        border
        @header-dragend="onHeaderDragend"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />

      <UserRoleDialog v-model:visible="userRoleVisible" :user-data="currentRoleUser" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, nextTick } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDictTag from '@/components/core/base/art-dict-tag/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useTableColumnPersist } from '@/hooks/core/useTableColumnPersist'
  import {
    fetchGetUserList,
    fetchSaveUser,
    fetchRemoveUser,
    exportUser,
    importUser,
    fetchResetPassword
  } from '@/api/system-manage'
  import UserDialog from './modules/user-dialog.vue'
  import UserRoleDialog from './modules/user-role-dialog.vue'
  import { ElButton, ElMessageBox, ElMessage } from 'element-plus'
  import { DICT_CODE } from '@/utils/constants'
  import { hasPerm } from '@/utils/permission'
  import { DialogType } from '@/types'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'User' })

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Record<string, any>>({})
  const importInput = ref<HTMLInputElement>()
  const userRoleVisible = ref(false)
  const currentRoleUser = ref<Record<string, any>>({})

  const showUserRole = (row: Record<string, any>): void => {
    currentRoleUser.value = row
    userRoleVisible.value = true
  }

  const resetPwd = (row: any): void => {
    ElMessageBox.confirm(`确定重置用户"${row.username}"的密码为 123456 吗？`, '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchResetPassword(row.id)
      ElMessage.success('密码已重置为 123456')
    })
  }

  // 导出用户
  const handleExport = async (): Promise<void> => {
    await exportUser()
  }

  // 触发导入文件选择
  const triggerImport = (): void => {
    importInput.value?.click()
  }

  // 导入用户
  const handleImport = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    await importUser(file)
    ElMessage.success('导入成功')
    input.value = ''
    refreshData()
  }

  // 表格列工厂（与列持久化共用同一份出厂默认）
  const columnsFactory = (): ColumnOption[] => [
    { type: 'index', width: 60, label: '序号' },
    { prop: 'username', label: '用户名', minWidth: 120 },
    { prop: 'nickname', label: '昵称', minWidth: 120 },
    { prop: 'phone', label: '手机号', minWidth: 130 },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      // 字典运行时驱动：改用 ArtDictTag，不再硬编码 h(ElSwitch)/手写 options（状态切换归编辑弹窗）
      formatter: (row: any) => h(ArtDictTag, { code: DICT_CODE.USER_STATUS, value: row.status })
    },
    { prop: 'createTime', label: '创建时间', minWidth: 180 },
    {
      prop: 'operation',
      label: '操作',
      width: 220,
      fixed: 'right',
      // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控
      formatter: (row: any) =>
        h('div', [
          hasPerm('sys:user:edit')
            ? h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) })
            : null,
          hasPerm('sys:user:remove')
            ? h(ArtButtonTable, { type: 'delete', onClick: () => deleteUser(row) })
            : null,
          hasPerm('sys:user:grant')
            ? h(
                ElButton,
                {
                  link: true,
                  type: 'primary',
                  size: 'small',
                  style: 'margin-left:8px',
                  onClick: () => showUserRole(row)
                },
                () => '授权'
              )
            : null,
          hasPerm('sys:user:reset')
            ? h(
                ElButton,
                { link: true, type: 'warning', size: 'small', onClick: () => resetPwd(row) },
                () => '重置密码'
              )
            : null
        ])
    }
  ]

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    setColumns,
    resetColumns
  } = useTable({
    core: {
      apiFn: fetchGetUserList,
      apiParams: { pageNum: 1, pageSize: 20 },
      // 后端分页参数为 pageNum/pageSize
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory
    },
    transform: {
      // 适配后端 mybatis-flex Page：records + totalRow
      responseAdapter: (resp: any) => ({
        records: resp?.records ?? [],
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 20
      })
    }
  })

  // 列配置持久化：每用户 + 本表（system-user）
  const { resetToDefault, onHeaderDragend } = useTableColumnPersist({
    tableKey: 'system-user',
    columnChecks,
    columnsFactory,
    setColumns: setColumns!,
    resetColumns: resetColumns!
  })

  // 恢复默认列
  const handleResetColumns = async (): Promise<void> => {
    await resetToDefault()
    ElMessage.success('已恢复默认列')
  }

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentUserData.value = row ? { ...row } : {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const deleteUser = (row: any): void => {
    ElMessageBox.confirm('确定要删除该用户吗？', '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveUser(row.id)
      ElMessage.success('删除成功')
      refreshData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveUser(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    refreshData()
  }
</script>
