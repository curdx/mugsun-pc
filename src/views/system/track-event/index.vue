<!-- 事件分析：事件名筛选 + 次数/会话/UV/最近发生 + 抽屉趋势图 + 实时事件流（5s 轮询可暂停） -->
<template>
  <div class="track-event-page art-full-height">
    <!-- 工具栏：应用选择（5 页共享选中态）+ 统计天数 + 事件名筛选 -->
    <div class="track-toolbar">
      <ElSelect
        v-model="appKey"
        :loading="appsLoading"
        placeholder="请选择应用"
        class="track-app-select"
      >
        <ElOption v-for="o in appOptions" :key="o.value" :label="o.label" :value="o.value" />
      </ElSelect>
      <ElRadioGroup v-model="days">
        <ElRadioButton :value="1">今天</ElRadioButton>
        <ElRadioButton :value="7">近 7 天</ElRadioButton>
        <ElRadioButton :value="30">近 30 天</ElRadioButton>
      </ElRadioGroup>
      <ElInput
        v-model="eventName"
        placeholder="事件名筛选，回车生效"
        clearable
        class="track-event-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <ElButton @click="handleSearch" v-ripple>查询</ElButton>
    </div>

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
    </ElCard>

    <!-- 实时事件流 -->
    <ElCard class="art-table-card track-realtime-card">
      <div class="track-realtime-head">
        <span class="track-card-title">实时事件流</span>
        <div class="track-realtime-ops">
          <ElTag :type="paused ? 'info' : 'success'" size="small">
            {{ paused ? '已暂停' : '直播中' }}
          </ElTag>
          <ElButton size="small" @click="togglePause">{{ paused ? '继续' : '暂停' }}</ElButton>
        </div>
      </div>
      <ElTable :data="realtimeList" v-loading="realtimeLoading && !realtimeLoaded" max-height="320">
        <ElTableColumn label="时间" width="110">
          <template #default="{ row }">{{ fmtTrackClock(row.ts) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="eventName" label="事件" min-width="160" show-overflow-tooltip />
        <ElTableColumn prop="distinctId" label="访客" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="会话" min-width="140">
          <template #default="{ row }">{{ shortId(row.sessionId) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="urlPath" label="页面" min-width="180" show-overflow-tooltip />
        <template #empty><ElEmpty description="暂无实时事件" :image-size="60" /></template>
      </ElTable>
    </ElCard>

    <!-- 事件趋势抽屉 -->
    <ElDrawer v-model="trendVisible" :title="`事件趋势 · ${trendEventName}`" size="560px">
      <ArtLineChart
        :data="trendSeries"
        :x-axis-data="trendLabels"
        :loading="trendLoading"
        height="320px"
        show-legend
        show-area-color
      />
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchTrackEventPage, fetchTrackEventRealtime, fetchTrackTrend } from '@/api/track'
  import { fmtTrackClock, fmtTrackTime, useTrackApp } from '@/views/system/track-shared/useTrackApp'
  import type { LineDataItem } from '@/types/component/chart'
  import {
    ElButton,
    ElInput,
    ElOption,
    ElRadioButton,
    ElRadioGroup,
    ElSelect,
    ElTag
  } from 'element-plus'

  defineOptions({ name: 'TrackEvent' })

  const { appOptions, appKey, days, appsLoading } = useTrackApp()
  const eventName = ref('')

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
    replaceSearchParams
  } = useTable({
    core: {
      apiFn: fetchTrackEventPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      // 首载等 appKey 就绪后手动触发，避免空 appKey 打一次无效请求
      immediate: false,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'eventName', label: '事件名', minWidth: 180, showOverflowTooltip: true },
        { prop: 'eventCount', label: '次数', width: 110, align: 'right' },
        { prop: 'sessionCount', label: '会话数', width: 110, align: 'right' },
        { prop: 'uv', label: 'UV', width: 100, align: 'right' },
        {
          prop: 'lastTime',
          label: '最近发生',
          minWidth: 170,
          formatter: (row: any) => fmtTrackTime(row.lastTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row: any) =>
            h(ArtButtonTable, { type: 'view', onClick: () => showTrend(row) })
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

  const buildParams = (): Record<string, any> => {
    const params: Record<string, any> = {
      appKey: appKey.value,
      days: days.value,
      pageNum: 1,
      pageSize: 20
    }
    if (eventName.value) params.eventName = eventName.value
    return params
  }

  const handleSearch = async (): Promise<void> => {
    if (!appKey.value) return
    // 替换全部查询参数（防旧条件残留），回到第一页
    replaceSearchParams(buildParams())
    await fetchData()
  }

  // 应用/天数变化即重查（首载同样在 appKey 就绪后触发）
  watch([appKey, days], handleSearch, { immediate: true })

  // ===== 事件趋势抽屉（days≤2 小时粒度 time=epochMs；days>2 天粒度 date） =====
  const trendVisible = ref(false)
  const trendEventName = ref('')
  const trendLoading = ref(false)
  const trendLabels = ref<string[]>([])
  const trendSeries = ref<LineDataItem[]>([])

  const showTrend = async (row: Record<string, any>): Promise<void> => {
    trendEventName.value = row.eventName
    trendVisible.value = true
    trendLoading.value = true
    try {
      const rows =
        (await fetchTrackTrend({
          appKey: appKey.value,
          days: days.value,
          dimType: 'event',
          dimKey: row.eventName
        })) ?? []
      const byDay = rows.some((r: any) => r.date !== undefined)
      trendLabels.value = rows.map((r: any) =>
        byDay ? String(r.date).slice(5) : fmtTrackClock(r.time)
      )
      trendSeries.value = [
        {
          name: '次数',
          data: rows.map((r: any) => Number(r.eventCount ?? 0)),
          showAreaColor: true
        },
        { name: '会话数', data: rows.map((r: any) => Number(r.sessionCount ?? 0)) }
      ]
    } finally {
      trendLoading.value = false
    }
  }

  // ===== 实时事件流（5s 轮询，可暂停） =====
  const realtimeList = ref<any[]>([])
  const realtimeLoading = ref(false)
  const realtimeLoaded = ref(false)
  const paused = ref(false)

  const loadRealtime = async (): Promise<void> => {
    if (!appKey.value) return
    realtimeLoading.value = true
    try {
      realtimeList.value =
        (await fetchTrackEventRealtime({ appKey: appKey.value, limit: 20 })) ?? []
      realtimeLoaded.value = true
    } finally {
      realtimeLoading.value = false
    }
  }

  const { pause, resume } = useIntervalFn(loadRealtime, 5000)

  const togglePause = (): void => {
    paused.value = !paused.value
    if (paused.value) {
      pause()
    } else {
      loadRealtime()
      resume()
    }
  }

  const shortId = (id?: string): string => (id ? `${id.slice(0, 8)}…` : '-')

  // keepAlive 页面切走暂停轮询，切回且未手动暂停时恢复并立即拉一次
  onDeactivated(pause)
  onActivated(() => {
    if (!paused.value) {
      loadRealtime()
      resume()
    }
  })

  watch(appKey, loadRealtime, { immediate: true })
</script>

<style lang="scss" scoped>
  .track-event-page {
    .track-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;

      .track-app-select {
        width: 220px;
      }

      .track-event-input {
        width: 240px;
      }
    }

    .track-card-title {
      font-size: 16px;
      font-weight: 500;
    }

    .track-realtime-card {
      margin-top: 16px;

      .track-realtime-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .track-realtime-ops {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }
  }
</style>
