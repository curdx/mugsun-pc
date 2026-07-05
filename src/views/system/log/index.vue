<!-- 操作日志页面（只读，含错误日志按状态区分） -->
<template>
  <div class="log-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <ElDialog v-model="detailVisible" title="日志详情" width="640px" align-center>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="标题">{{ current.title }}</ElDescriptionsItem>
          <ElDescriptionsItem label="方法">{{ current.method }}</ElDescriptionsItem>
          <ElDescriptionsItem label="请求">
            {{ current.requestMethod }} {{ current.requestUri }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">{{ current.operator }}</ElDescriptionsItem>
          <ElDescriptionsItem label="IP">{{ current.ip }}</ElDescriptionsItem>
          <ElDescriptionsItem label="耗时">{{ current.duration }} ms</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">{{
            current.status === 1 ? '成功' : '失败'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="参数">
            <div class="log-params">{{ current.params }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="current.errorMsg" label="错误">
            <div class="log-params">{{ current.errorMsg }}</div>
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
  import { fetchOperLogPage } from '@/api/system-manage'
  import { ElTag } from 'element-plus'

  defineOptions({ name: 'OperLog' })

  const detailVisible = ref(false)
  const current = ref<Record<string, any>>({})

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
      apiFn: fetchOperLogPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'title', label: '操作', minWidth: 140 },
        { prop: 'requestMethod', label: '请求方式', width: 100 },
        { prop: 'requestUri', label: '请求地址', minWidth: 200, showOverflowTooltip: true },
        { prop: 'operator', label: '操作人', width: 180 },
        { prop: 'duration', label: '耗时(ms)', width: 100 },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: any) =>
            row.status === 1
              ? h(ElTag, { type: 'success' }, () => '成功')
              : h(ElTag, { type: 'danger' }, () => '失败')
        },
        { prop: 'createTime', label: '时间', minWidth: 180 },
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

  const showDetail = (row: Record<string, any>): void => {
    current.value = row
    detailVisible.value = true
  }
</script>

<style scoped>
  .log-params {
    max-height: 200px;
    overflow: auto;
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>
