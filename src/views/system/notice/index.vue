<!-- 通知公告管理页面 -->
<template>
  <div class="notice-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton @click="showDialog('add')" v-ripple>新增公告</ElButton>
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

      <NoticeDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :notice-data="currentData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, nextTick } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchNoticePage, fetchSaveNotice, fetchRemoveNotice } from '@/api/system-manage'
  import NoticeDialog from './modules/notice-dialog.vue'
  import { ElTag, ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Notice' })

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

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
      apiFn: fetchNoticePage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'title', label: '标题', minWidth: 200 },
        { prop: 'category', label: '分类', width: 120 },
        {
          prop: 'isTop',
          label: '置顶',
          width: 100,
          formatter: (row: any) =>
            row.isTop === 1
              ? h(ElTag, { type: 'danger' }, () => '置顶')
              : h(ElTag, { type: 'info' }, () => '普通')
        },
        { prop: 'releaseTime', label: '发布时间', minWidth: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 120,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
              h(ArtButtonTable, { type: 'delete', onClick: () => deleteRow(row) })
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

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = row ? { ...row } : {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除公告"${row.title}"吗？`, '删除公告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveNotice(row.id)
      ElMessage.success('删除成功')
      refreshData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveNotice(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    refreshData()
  }
</script>
