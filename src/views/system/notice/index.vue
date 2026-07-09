<!-- 通知公告管理页面：CRUD + 可见范围 + 阅读记录/UV -->
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

      <ReadRecordDialog v-model:visible="readVisible" :notice="currentData" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, nextTick } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchNoticePage, fetchSaveNotice, fetchRemoveNotice } from '@/api/system-manage'
  import NoticeDialog from './modules/notice-dialog.vue'
  import ReadRecordDialog from './modules/read-record-dialog.vue'
  import { ElButton, ElTag, ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Notice' })

  type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'
  const CATEGORY_MAP: Record<string, { text: string; type: TagType }> = {
    notice: { text: '通知', type: 'primary' },
    announcement: { text: '公告', type: 'success' },
    warning: { text: '预警', type: 'warning' }
  }

  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const readVisible = ref(false)
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
        {
          prop: 'category',
          label: '分类',
          width: 100,
          formatter: (row: any) => {
            const c = CATEGORY_MAP[row.category] || {
              text: row.category || '-',
              type: 'info' as TagType
            }
            return h(ElTag, { type: c.type }, () => c.text)
          }
        },
        {
          prop: 'isTop',
          label: '置顶',
          width: 90,
          formatter: (row: any) =>
            row.isTop === 1
              ? h(ElTag, { type: 'danger' }, () => '置顶')
              : h(ElTag, { type: 'info' }, () => '普通')
        },
        {
          prop: 'allVisible',
          label: '可见范围',
          width: 100,
          formatter: (row: any) =>
            row.allVisible === 0
              ? h(ElTag, { type: 'warning' }, () => '指定范围')
              : h(ElTag, { type: 'success' }, () => '全部可见')
        },
        { prop: 'viewUv', label: '阅读人数', width: 90 },
        { prop: 'viewPv', label: '阅读次数', width: 90 },
        { prop: 'releaseTime', label: '发布时间', minWidth: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 180,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
              h(
                ElButton,
                { size: 'small', link: true, type: 'primary', onClick: () => showRead(row) },
                () => '阅读记录'
              ),
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

  const showRead = (row: Record<string, any>): void => {
    currentData.value = { ...row }
    nextTick(() => {
      readVisible.value = true
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
