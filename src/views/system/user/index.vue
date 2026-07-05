<!-- 用户管理页面 -->
<template>
  <div class="user-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton @click="showDialog('add')" v-ripple>新增用户</ElButton>
          <ElButton @click="handleExport" v-ripple>导出</ElButton>
          <ElButton @click="triggerImport" v-ripple>导入</ElButton>
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
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, nextTick } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchGetUserList,
    fetchSaveUser,
    fetchRemoveUser,
    exportUser,
    importUser
  } from '@/api/system-manage'
  import UserDialog from './modules/user-dialog.vue'
  import { ElTag, ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'User' })

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Record<string, any>>({})
  const importInput = ref<HTMLInputElement>()

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

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchGetUserList,
      apiParams: { pageNum: 1, pageSize: 20 },
      // 后端分页参数为 pageNum/pageSize
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'username', label: '用户名', minWidth: 120 },
        { prop: 'nickname', label: '昵称', minWidth: 120 },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: any) =>
            h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
              row.status === 1 ? '启用' : '停用'
            )
        },
        { prop: 'createTime', label: '创建时间', minWidth: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
              h(ArtButtonTable, { type: 'delete', onClick: () => deleteUser(row) })
            ])
        }
      ]
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
