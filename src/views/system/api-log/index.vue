<!-- 访问日志：全量请求流水（含 GET 采样），慢接口标红；参数经服务端结构化递归脱敏 -->
<template>
  <div class="api-log-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElRadioGroup v-model="slowFilter" size="small" @change="onSlowFilterChange">
            <ElRadioButton :value="undefined">全部</ElRadioButton>
            <ElRadioButton :value="1">仅慢接口</ElRadioButton>
          </ElRadioGroup>
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

      <ElDialog v-model="detailVisible" title="访问日志详情" width="680px" align-center>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="链路号">{{ current.traceId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="标题">{{ current.title }}</ElDescriptionsItem>
          <ElDescriptionsItem label="处理器">{{ current.method }}</ElDescriptionsItem>
          <ElDescriptionsItem label="请求">
            {{ current.requestMethod }} {{ current.requestUri }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">{{ current.operator || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="IP">{{ current.ip }}</ElDescriptionsItem>
          <ElDescriptionsItem label="UA">{{ current.userAgent || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态码">{{ current.status }}</ElDescriptionsItem>
          <ElDescriptionsItem label="耗时">{{ current.duration }} ms</ElDescriptionsItem>
          <ElDescriptionsItem label="参数">
            <div class="api-log-params">{{ current.params }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="current.errorMsg" label="异常摘要">
            <div class="api-log-params">{{ current.errorMsg }}</div>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchApiLogPage } from '@/api/system-manage'
  import { formatTableTime } from '@/utils/date'
  import { ElRadioButton, ElRadioGroup, ElTag } from 'element-plus'

  defineOptions({ name: 'ApiLog' })

  const detailVisible = ref(false)
  const current = ref<Record<string, any>>({})
  const slowFilter = ref<number | undefined>(undefined)

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchApiLogPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'title', label: '接口', minWidth: 150, showOverflowTooltip: true },
        { prop: 'requestMethod', label: '方式', width: 80 },
        { prop: 'requestUri', label: '请求地址', minWidth: 200, showOverflowTooltip: true },
        { prop: 'operator', label: '操作人', width: 110 },
        { prop: 'ip', label: 'IP', width: 120 },
        {
          prop: 'status',
          label: '状态码',
          width: 90,
          formatter: (row: any) => statusTag(row.status)
        },
        {
          prop: 'duration',
          label: '耗时(ms)',
          width: 110,
          formatter: (row: any) =>
            h('div', [
              h('span', String(row.duration ?? '-')),
              row.slow === 1
                ? h(ElTag, { type: 'danger', size: 'small', style: 'margin-left:6px' }, () => '慢')
                : null
            ])
        },
        {
          prop: 'createTime',
          label: '时间',
          minWidth: 170,
          formatter: (row: any) => formatTableTime(row.createTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 90,
          fixed: 'right',
          formatter: (row: any) =>
            h(ArtButtonTable, { type: 'view', onClick: () => showDetail(row) })
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

  const statusTag = (status: number) => {
    if (status == null) return h(ElTag, { type: 'info' }, () => '-')
    if (status < 400) return h(ElTag, { type: 'success' }, () => String(status))
    if (status < 500) return h(ElTag, { type: 'warning' }, () => String(status))
    return h(ElTag, { type: 'danger' }, () => String(status))
  }

  const onSlowFilterChange = (): void => {
    const params = searchParams as Record<string, unknown>
    if (slowFilter.value === undefined) {
      delete params.slow
    } else {
      params.slow = slowFilter.value
    }
    refreshData()
  }

  const showDetail = (row: Record<string, any>): void => {
    current.value = row
    detailVisible.value = true
  }
</script>

<style scoped>
  .api-log-params {
    max-height: 200px;
    overflow: auto;
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>
