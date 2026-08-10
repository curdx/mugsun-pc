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
  import { ElButton, ElMessage, ElMessageBox, ElTooltip } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtDictTag from '@/components/core/base/art-dict-tag/index.vue'
  import request from '@/utils/http'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchFeedbackPage, fetchFeedbackStatus, fetchRemoveFeedback } from '@/api/feedback'
  import { DICT_CODE } from '@/utils/constants'
  import { hasPerm } from '@/utils/permission'
  import { formatTableTime } from '@/utils/date'

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
        { prop: 'contact', label: '联系方式', width: 150, showOverflowTooltip: true },
        {
          prop: 'attachName',
          label: '附件',
          width: 160,
          // 附件名截断补省略号 + tooltip（link 按钮无内建省略，样式内联：scoped 够不到 h() 渲染的 vnode）
          formatter: (row: any) =>
            row.attachId
              ? h(ElTooltip, { content: row.attachName || '下载附件', placement: 'top' }, () =>
                  h(
                    ElButton,
                    {
                      link: true,
                      type: 'primary',
                      style:
                        'max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle',
                      onClick: () =>
                        request.download({
                          url: `/api/system/file/download-stream/${row.attachId}`
                        })
                    },
                    () => row.attachName || '下载附件'
                  )
                )
              : '—'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          // 字典运行时驱动：改用 ArtDictTag，不再手写 已处理/未处理 判断
          formatter: (row: any) =>
            h(ArtDictTag, { code: DICT_CODE.FEEDBACK_STATUS, value: row.status })
        },
        {
          prop: 'createTime',
          label: '提交时间',
          minWidth: 170,
          formatter: (row: any) => formatTableTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控
          formatter: (row: any) =>
            h('div', [
              hasPerm('sys:feedback:manage')
                ? h(
                    ElButton,
                    {
                      link: true,
                      type: 'primary',
                      size: 'small',
                      onClick: () => toggleStatus(row)
                    },
                    () => (row.status === 1 ? '标为未处理' : '标为已处理')
                  )
                : null,
              hasPerm('sys:feedback:manage')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => remove(row) })
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
