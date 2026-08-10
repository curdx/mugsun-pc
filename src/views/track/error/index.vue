<!-- 错误监控：按指纹分组的错误列表 + 组内事件分页详情抽屉（堆栈/上下文展开，纯文本渲染防 XSS） -->
<template>
  <div class="track-error-page art-full-height">
    <!-- 工具栏：应用选择（5 页共享选中态）+ 统计天数 -->
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

    <!-- 指纹组内错误事件详情抽屉 -->
    <ElDrawer v-model="detailVisible" size="760px" :title="`错误详情 · ${currentMessage}`">
      <div class="track-detail-meta">
        <ElTag size="small" type="danger" effect="plain">指纹 {{ currentFingerprint }}</ElTag>
        <span class="track-detail-count">
          共 {{ detailPagination.total }} 次 · 影响会话 {{ current.sessionCount ?? '-' }}
        </span>
      </div>
      <ArtTable
        :loading="detailLoading"
        :data="detailData as any[]"
        :columns="detailColumns"
        :pagination="detailPagination"
        @pagination:size-change="handleDetailSizeChange"
        @pagination:current-change="handleDetailCurrentChange"
      >
      </ArtTable>
    </ElDrawer>

    <!-- 会话回放播放器抽屉（与回放列表页共用组件，嵌套于错误详情之上） -->
    <ReplayPlayerDrawer v-model:visible="replayVisible" :session-id="replaySessionId" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchTrackErrorDetail, fetchTrackErrorPage } from '@/api/track'
  import { fmtTrackTime, useTrackApp } from '@/views/track/shared/useTrackApp'
  import ReplayEntryButton from '@/views/track/shared/ReplayEntryButton.vue'
  import ReplayPlayerDrawer from '@/views/track/shared/ReplayPlayerDrawer.vue'
  import StackRestore from '@/views/track/error/modules/stack-restore.vue'
  import { hasPerm } from '@/utils/permission'
  import { ElOption, ElRadioButton, ElRadioGroup, ElSelect, ElTag } from 'element-plus'

  defineOptions({ name: 'TrackError' })

  const { appOptions, appKey, days, appsLoading } = useTrackApp()

  // ===== 指纹分组列表 =====
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
      apiFn: fetchTrackErrorPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      // 首载等 appKey 就绪后手动触发，避免空 appKey 打一次无效请求
      immediate: false,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'message', label: '错误摘要', minWidth: 260, showOverflowTooltip: true },
        { prop: 'eventCount', label: '次数', width: 100, align: 'right', headerAlign: 'right' },
        {
          prop: 'sessionCount',
          label: '影响会话',
          width: 100,
          align: 'right',
          headerAlign: 'right'
        },
        {
          prop: 'firstTime',
          label: '首次发生',
          minWidth: 150,
          formatter: (row: any) => fmtTrackTime(row.firstTime)
        },
        {
          prop: 'lastTime',
          label: '最近发生',
          minWidth: 150,
          formatter: (row: any) => fmtTrackTime(row.lastTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
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

  const loadPage = async (): Promise<void> => {
    if (!appKey.value) return
    replaceSearchParams({ appKey: appKey.value, days: days.value, pageNum: 1, pageSize: 20 })
    await fetchData()
  }

  // 应用/天数变化即重查（首载同样在 appKey 就绪后触发）
  watch([appKey, days], loadPage, { immediate: true })

  // ===== 组内事件分页（抽屉内独立 useTable 实例） =====
  const detailVisible = ref(false)
  const current = ref<Record<string, any>>({})
  const currentFingerprint = ref('')
  const currentMessage = ref('')

  /** props 为 JSON 字符串（含 breadcrumbs），美化展示；解析失败回退原文。纯文本渲染，不用 v-html */
  const prettyProps = (raw?: string): string => {
    if (!raw) return '-'
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  const expandRow = (row: Record<string, any>) =>
    h('div', { class: 'track-error-expand' }, [
      h('div', { class: 'track-error-kv' }, [
        h('span', { class: 'track-error-k' }, '页面'),
        h('span', `${row.urlPath || '-'}（路由 ${row.routePath || '-'}）`)
      ]),
      h('div', { class: 'track-error-kv' }, [
        h('span', { class: 'track-error-k' }, 'Release'),
        h('span', row.release || '-')
      ]),
      h('div', { class: 'track-error-kv' }, [
        h('span', { class: 'track-error-k' }, '会话'),
        h('span', `${row.sessionId || '-'} / 访客 ${row.distinctId || '-'}`)
      ]),
      // 会话回放联动（G100）：探测有回放块才渲染入口；点击打开共享播放器抽屉
      hasPerm('sys:track-replay:view')
        ? h('div', { class: 'track-error-kv' }, [
            h('span', { class: 'track-error-k' }, '会话回放'),
            h(ReplayEntryButton, { sessionId: row.sessionId, onOpen: openReplay })
          ])
        : null,
      h('div', { class: 'track-error-kv' }, [
        h('span', { class: 'track-error-k' }, '事件ID'),
        h('span', row.eventId || '-')
      ]),
      h('div', { class: 'track-error-kv' }, [
        h('span', { class: 'track-error-k' }, '堆栈'),
        h('pre', { class: 'track-error-pre' }, row.stack || '-')
      ]),
      // 堆栈还原（G101）：仅带 release 的错误行可定位符号表；组件内自查符号表存在性并给引导
      row.release
        ? h('div', { class: 'track-error-kv' }, [
            h('span', { class: 'track-error-k' }, '还原'),
            h(StackRestore, { appKey: appKey.value, release: row.release, stack: row.stack || '' })
          ])
        : null,
      h('div', { class: 'track-error-kv' }, [
        h('span', { class: 'track-error-k' }, '上下文'),
        h('pre', { class: 'track-error-pre' }, prettyProps(row.props))
      ])
    ])

  const {
    columns: detailColumns,
    data: detailData,
    loading: detailLoading,
    pagination: detailPagination,
    handleSizeChange: handleDetailSizeChange,
    handleCurrentChange: handleDetailCurrentChange,
    fetchData: fetchDetailData,
    replaceSearchParams: replaceDetailParams
  } = useTable({
    core: {
      apiFn: fetchTrackErrorDetail,
      apiParams: { pageNum: 1, pageSize: 10 },
      immediate: false,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'expand', formatter: (row: any) => expandRow(row) },
        {
          prop: 'time',
          label: '时间',
          width: 160,
          formatter: (row: any) => fmtTrackTime(row.time)
        },
        { prop: 'message', label: '消息', minWidth: 220, showOverflowTooltip: true },
        { prop: 'urlPath', label: '页面', minWidth: 160, showOverflowTooltip: true },
        { prop: 'release', label: 'Release', width: 110, showOverflowTooltip: true }
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

  const showDetail = async (row: Record<string, any>): Promise<void> => {
    current.value = row
    currentFingerprint.value = String(row.fingerprint ?? '')
    currentMessage.value = row.message || '-'
    detailVisible.value = true
    replaceDetailParams({
      appKey: appKey.value,
      fingerprint: currentFingerprint.value,
      days: days.value,
      pageNum: 1,
      pageSize: 10
    })
    await fetchDetailData()
  }

  // ===== 会话回放联动（G100）：展开行回放入口打开共享播放器抽屉 =====
  const replayVisible = ref(false)
  const replaySessionId = ref('')

  const openReplay = (sessionId: string): void => {
    replaySessionId.value = sessionId
    replayVisible.value = true
  }
</script>

<style lang="scss" scoped>
  .track-error-page {
    .track-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;

      .track-app-select {
        width: 220px;
      }
    }

    .track-detail-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;

      .track-detail-count {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    // 展开行内容渲染在 ArtTable 内部（无 scoped 属性），用 :deep 命中
    :deep(.track-error-expand) {
      padding: 8px 16px;

      .track-error-kv {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 13px;

        .track-error-k {
          flex-shrink: 0;
          width: 56px;
          color: var(--el-text-color-secondary);
        }
      }

      .track-error-pre {
        flex: 1;
        max-height: 240px;
        padding: 8px;
        margin: 0;
        overflow: auto;
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        white-space: pre-wrap;
        background: var(--el-fill-color-light);
        border-radius: 6px;
      }
    }
  }
</style>
