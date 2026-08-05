<!-- 操作日志页面（只读，含错误日志按状态区分） -->
<template>
  <div class="log-page art-full-height">
    <!-- 查询栏：模块/操作人/状态/时间范围，条件实时生效、重置回默认 -->
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
          <ElButton v-perm="'sys:oper-log:verify'" :loading="verifyLoading" @click="verify" v-ripple
            >完整性验签</ElButton
          >
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

      <ElDialog v-model="verifyVisible" title="审计完整性验签" width="480px" align-center>
        <ElAlert
          :type="verifyResult.valid ? 'success' : 'error'"
          :title="verifyResult.valid ? verifyResult.message : '检测到篡改'"
          :closable="false"
          show-icon
        />
        <ElDescriptions v-if="!verifyResult.valid" :column="1" border class="verify-detail">
          <ElDescriptionsItem label="首个被篡改记录">{{
            verifyResult.tamperedId
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="原因">{{ verifyResult.reason }}</ElDescriptionsItem>
          <ElDescriptionsItem label="此前已验签"
            >{{ verifyResult.verifiedBefore }} 条</ElDescriptionsItem
          >
        </ElDescriptions>
      </ElDialog>

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
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchOperLogPage, fetchOperLogVerify } from '@/api/system-manage'
  import { ElMessage, ElTag } from 'element-plus'

  defineOptions({ name: 'OperLog' })

  const detailVisible = ref(false)
  const current = ref<Record<string, any>>({})
  const verifyVisible = ref(false)
  const verifyLoading = ref(false)
  const verifyResult = ref<Record<string, any>>({})

  // ===== 查询栏 =====
  const searchForm = ref({
    title: '',
    operator: '',
    status: undefined as number | undefined,
    timeRange: undefined as string[] | undefined
  })
  const searchItems = computed(() => [
    {
      key: 'title',
      label: '模块',
      type: 'input',
      props: { placeholder: '请输入操作模块', clearable: true }
    },
    {
      key: 'operator',
      label: '操作人',
      type: 'input',
      props: { placeholder: '请输入操作人', clearable: true }
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '成功', value: 1 },
          { label: '失败', value: 0 }
        ]
      }
    },
    {
      key: 'timeRange',
      label: '时间范围',
      type: 'datetimerange',
      span: 8,
      props: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        clearable: true
      }
    }
  ])

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
      apiFn: fetchOperLogPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'title', label: '操作', minWidth: 140 },
        { prop: 'requestMethod', label: '请求方式', width: 100 },
        { prop: 'requestUri', label: '请求地址', minWidth: 200, showOverflowTooltip: true },
        {
          prop: 'operator',
          label: '操作人',
          width: 120,
          // 后端富化 operatorName（昵称/用户名），历史/已删用户回退原 id
          formatter: (row: any) => row.operatorName || row.operator || '—'
        },
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

  // ===== 查询栏联动 =====
  const handleSearch = async (params: Record<string, any>): Promise<void> => {
    // 时间范围数组展开为 beginTime/endTime（后端 create_time 区间），其余条件原样透传
    const { timeRange, ...rest } = params
    const query: Record<string, any> = { ...rest, pageNum: 1, pageSize: 20 }
    if (Array.isArray(timeRange) && timeRange.length === 2) {
      query.beginTime = timeRange[0]
      query.endTime = timeRange[1]
    }
    // 替换全部查询参数（防旧条件残留），回到第一页
    replaceSearchParams(query)
    await fetchData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      title: '',
      operator: '',
      status: undefined,
      timeRange: undefined
    }
    resetSearchParams()
    await fetchData()
  }

  /** 审计完整性验签：全量校验（不传 limit），检出篡改精确定位首个被篡改记录 */
  const verify = async (): Promise<void> => {
    verifyLoading.value = true
    try {
      verifyResult.value = (await fetchOperLogVerify()) ?? {}
      verifyVisible.value = true
      if (verifyResult.value.valid) {
        ElMessage.success(verifyResult.value.message || '审计链完整')
      }
    } finally {
      verifyLoading.value = false
    }
  }
</script>

<style scoped>
  .log-params {
    max-height: 200px;
    overflow: auto;
    word-break: break-all;
    white-space: pre-wrap;
  }

  .verify-detail {
    margin-top: 12px;
  }
</style>
