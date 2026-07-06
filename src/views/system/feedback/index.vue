<!-- 意见反馈管理：查看用户反馈、附件、处理状态 -->
<template>
  <div class="feedback-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />
      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { ElButton, ElTag, ElMessage, ElMessageBox } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchFeedbackPage, fetchFeedbackStatus, fetchRemoveFeedback } from '@/api/feedback'

  defineOptions({ name: 'Feedback' })

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
      apiFn: fetchFeedbackPage,
      apiParams: { pageNum: 1, pageSize: 10 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { prop: 'content', label: '反馈内容', minWidth: 260, showOverflowTooltip: true },
        { prop: 'contact', label: '联系方式', width: 140 },
        {
          prop: 'attachName',
          label: '附件',
          width: 160,
          formatter: (row: any) =>
            row.attachUrl
              ? h(
                  'a',
                  { href: row.attachUrl, target: '_blank', class: 'text-theme' },
                  row.attachName || '查看附件'
                )
              : '—'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: any) =>
            h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
              row.status === 1 ? '已处理' : '未处理'
            )
        },
        { prop: 'createTime', label: '提交时间', minWidth: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(
                ElButton,
                { link: true, type: 'primary', size: 'small', onClick: () => toggleStatus(row) },
                () => (row.status === 1 ? '标为未处理' : '标为已处理')
              ),
              h(ArtButtonTable, { type: 'delete', onClick: () => remove(row) })
            ])
        }
      ]
    },
    transform: {
      responseAdapter: (resp: any) => ({
        records: resp?.records ?? [],
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 10
      })
    }
  })

  const toggleStatus = async (row: any) => {
    await fetchFeedbackStatus(row.id)
    ElMessage.success('操作成功')
    refreshData()
  }

  const remove = (row: any) => {
    ElMessageBox.confirm('确定删除该反馈吗？', '删除', { type: 'warning' }).then(async () => {
      await fetchRemoveFeedback([row.id])
      ElMessage.success('删除成功')
      refreshData()
    })
  }
</script>
