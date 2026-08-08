<!-- 埋点应用：应用 CRUD（appKey 复制 + 新增成功展示接入片段）+ 事件定义管理 tab -->
<template>
  <div class="track-app-page art-full-height">
    <ElCard class="art-table-card">
      <ElTabs v-model="tab">
        <!-- ===== 应用管理 ===== -->
        <ElTabPane label="应用管理" name="app">
          <div class="track-app-toolbar">
            <ElButton v-perm="'sys:track-app:add'" @click="showDialog('add')" v-ripple>
              新增应用
            </ElButton>
          </div>

          <ArtTable
            :loading="loading"
            :data="data as any[]"
            :columns="columns"
            :pagination="pagination"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
          </ArtTable>
        </ElTabPane>

        <!-- ===== 事件定义 ===== -->
        <ElTabPane label="事件定义" name="eventDef" lazy>
          <div class="track-app-toolbar">
            <ElSelect
              v-model="appKey"
              :loading="appsLoading"
              placeholder="请选择应用"
              class="track-app-select"
            >
              <ElOption v-for="o in appOptions" :key="o.value" :label="o.label" :value="o.value" />
            </ElSelect>
            <ElInput
              v-model="defEventName"
              placeholder="事件名筛选，回车生效"
              clearable
              class="track-def-input"
              @keyup.enter="loadDefs"
              @clear="loadDefs"
            />
            <ElSelect v-model="defStatus" placeholder="状态" clearable class="track-def-status">
              <ElOption label="启用" :value="1" />
              <ElOption label="停用" :value="0" />
            </ElSelect>
            <ElButton @click="loadDefs" v-ripple>查询</ElButton>
          </div>

          <ArtTable
            :loading="defLoading"
            :data="defData as any[]"
            :columns="defColumns"
            :pagination="defPagination"
            @pagination:size-change="handleDefSizeChange"
            @pagination:current-change="handleDefCurrentChange"
          >
          </ArtTable>
        </ElTabPane>
      </ElTabs>

      <AppDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :app-data="currentRow"
        @submit="onSubmitApp"
      />

      <EventDefDialog
        v-model:visible="defDialogVisible"
        :def-data="currentDef"
        @submit="onSubmitDef"
      />

      <!-- 新增成功：展示 appKey + 接入代码片段 -->
      <ElDialog v-model="createdVisible" title="应用创建成功" width="560px" align-center>
        <ElAlert
          type="success"
          :closable="false"
          show-icon
          title="请妥善保存 AppKey，接入 SDK 时使用"
        />
        <div class="track-created-appkey">
          <span class="track-created-value">{{ createdApp.appKey }}</span>
          <ElButton size="small" @click="copyAppKey(createdApp.appKey)">复制</ElButton>
        </div>
        <p class="track-created-tip">接入代码片段：</p>
        <pre class="track-created-snippet">{{ createdSnippet }}</pre>
        <template #footer>
          <ElButton type="primary" @click="createdVisible = false">知道了</ElButton>
        </template>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useCrud } from '@/hooks/core/useCrud'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchRemoveTrackApp,
    fetchSaveTrackApp,
    fetchSaveTrackEventDef,
    fetchTrackAppPage,
    fetchTrackEventDefPage
  } from '@/api/track'
  import { fmtTrackTimeAuto, useTrackApp } from '@/views/track/shared/useTrackApp'
  import { hasPerm } from '@/utils/permission'
  import AppDialog from './modules/app-dialog.vue'
  import EventDefDialog from './modules/event-def-dialog.vue'
  import { ElButton, ElInput, ElMessage, ElOption, ElSelect, ElTag } from 'element-plus'

  defineOptions({ name: 'TrackApp' })

  const tab = ref('app')
  // legacy: true 兜底非安全上下文（http 内网）下 navigator.clipboard 不可用
  const { copy } = useClipboard({ legacy: true })

  const copyAppKey = async (appKey: string): Promise<void> => {
    if (!appKey) return
    try {
      await copy(appKey)
      ElMessage.success('AppKey 已复制')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    }
  }

  // ===== 应用 CRUD（列表/弹窗/删除由 useCrud 收敛；提交自处理以拿到新增返回的完整实体） =====
  const enabledTag = (v: any) =>
    v === 1 || v === true
      ? h(ElTag, { type: 'success' }, () => '启用')
      : h(ElTag, { type: 'info' }, () => '停用')

  const {
    columns,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    dialogVisible,
    dialogType,
    currentRow,
    showDialog,
    handleDelete,
    refreshCreate,
    refreshUpdate
  } = useCrud({
    listApi: fetchTrackAppPage,
    removeApi: fetchRemoveTrackApp,
    label: '应用',
    rowName: (row) => row.appName,
    columnsFactory: () => [
      { type: 'index', width: 60, label: '序号' },
      { prop: 'appName', label: '应用名称', minWidth: 140, showOverflowTooltip: true },
      {
        prop: 'appKey',
        label: 'AppKey',
        minWidth: 240,
        formatter: (row: any) =>
          h('div', { class: 'track-appkey-cell' }, [
            h('span', { class: 'track-appkey-value' }, row.appKey),
            h(
              ElButton,
              { link: true, type: 'primary', size: 'small', onClick: () => copyAppKey(row.appKey) },
              () => '复制'
            )
          ])
      },
      { prop: 'platform', label: '平台', width: 80 },
      {
        prop: 'sampleRate',
        label: '采样率',
        width: 90,
        // 后端 sample_rate 为百分比整数（1..100，100=全量）
        formatter: (row: any) => `${row.sampleRate ?? 100}%`
      },
      {
        prop: 'enabled',
        label: '状态',
        width: 90,
        formatter: (row: any) => enabledTag(row.enabled)
      },
      {
        prop: 'retentionDays',
        label: '保留期',
        width: 90,
        formatter: (row: any) => `${row.retentionDays ?? '-'} 天`
      },
      {
        prop: 'replayEnabled',
        label: '回放',
        width: 90,
        formatter: (row: any) => enabledTag(row.replayEnabled)
      },
      {
        prop: 'createTime',
        label: '创建时间',
        minWidth: 150,
        formatter: (row: any) => fmtTrackTimeAuto(row.createTime)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 130,
        fixed: 'right',
        // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控
        formatter: (row: any) =>
          h('div', [
            hasPerm('sys:track-app:edit')
              ? h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) })
              : null,
            hasPerm('sys:track-app:edit')
              ? h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) })
              : null
          ])
      }
    ]
  })

  // ===== 新增成功展示 appKey + 接入片段 =====
  const createdVisible = ref(false)
  const createdApp = ref<Record<string, any>>({})
  const createdSnippet = computed(
    () => `import { createTracker } from '@mugsun/track-web'

const track = createTracker({
  endpoint: 'https://your-server.com', // collect = {endpoint}/track/collect
  appKey: '${createdApp.value.appKey}',
  release: '1.0.0'
})`
  )

  // ===== 事件定义 tab（共享应用选择器，模块级单例） =====
  const { appOptions, appKey, appsLoading, loadApps } = useTrackApp()

  const onSubmitApp = async (form: Record<string, any>): Promise<void> => {
    const saved = await fetchSaveTrackApp(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    if (dialogType.value === 'add') {
      await refreshCreate()
      // 同步共享应用下拉，事件定义 tab 立即可选新应用
      loadApps()
      if (saved?.appKey) {
        createdApp.value = saved
        createdVisible.value = true
      }
    } else {
      await refreshUpdate()
    }
  }

  const defEventName = ref('')
  const defStatus = ref<number | undefined>(undefined)
  const defDialogVisible = ref(false)
  const currentDef = ref<Record<string, any>>({})

  const {
    columns: defColumns,
    data: defData,
    loading: defLoading,
    pagination: defPagination,
    handleSizeChange: handleDefSizeChange,
    handleCurrentChange: handleDefCurrentChange,
    fetchData: fetchDefs,
    replaceSearchParams: replaceDefParams
  } = useTable({
    core: {
      apiFn: fetchTrackEventDefPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      // 首载等切到该 tab 且 appKey 就绪后手动触发
      immediate: false,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'eventName', label: '事件名', minWidth: 160, showOverflowTooltip: true },
        { prop: 'displayName', label: '显示名', minWidth: 140, showOverflowTooltip: true },
        { prop: 'description', label: '描述', minWidth: 180, showOverflowTooltip: true },
        { prop: 'owner', label: '负责人', width: 110, formatter: (row: any) => row.owner || '-' },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: any) => enabledTag(row.status)
        },
        {
          prop: 'firstSeenTime',
          label: '首次上报',
          minWidth: 150,
          formatter: (row: any) => fmtTrackTimeAuto(row.firstSeenTime)
        },
        {
          prop: 'lastSeenTime',
          label: '最近上报',
          minWidth: 150,
          formatter: (row: any) => fmtTrackTimeAuto(row.lastSeenTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row: any) =>
            hasPerm('sys:track-app:edit')
              ? h(ArtButtonTable, { type: 'edit', onClick: () => showDefDialog(row) })
              : null
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

  const loadDefs = async (): Promise<void> => {
    if (tab.value !== 'eventDef' || !appKey.value) return
    const params: Record<string, any> = {
      appKey: appKey.value,
      pageNum: 1,
      pageSize: 20
    }
    if (defEventName.value) params.eventName = defEventName.value
    if (defStatus.value !== undefined) params.status = defStatus.value
    replaceDefParams(params)
    await fetchDefs()
  }

  // 切到事件定义 tab / 应用变化时加载（首载在 appKey 就绪后触发）
  watch([tab, appKey], loadDefs, { immediate: true })

  const showDefDialog = (row: Record<string, any>): void => {
    currentDef.value = { ...row }
    defDialogVisible.value = true
  }

  const onSubmitDef = async (form: Record<string, any>): Promise<void> => {
    // 仅 displayName/description/owner/status 可改（后端契约）
    await fetchSaveTrackEventDef({
      id: form.id,
      displayName: form.displayName,
      description: form.description,
      owner: form.owner,
      status: form.status
    })
    defDialogVisible.value = false
    ElMessage.success('保存成功')
    await fetchDefs()
  }
</script>

<style lang="scss" scoped>
  .track-app-page {
    .track-app-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;

      .track-app-select {
        width: 220px;
      }

      .track-def-input {
        width: 240px;
      }

      .track-def-status {
        width: 120px;
      }
    }

    .track-appkey-cell {
      display: flex;
      gap: 8px;
      align-items: center;

      .track-appkey-value {
        overflow: hidden;
        font-family: monospace;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .track-created-appkey {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 16px;

      .track-created-value {
        font-family: monospace;
        font-size: 15px;
        font-weight: 600;
      }
    }

    .track-created-tip {
      margin-top: 16px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .track-created-snippet {
      padding: 12px;
      margin-top: 8px;
      overflow: auto;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.6;
      white-space: pre;
      background: var(--el-fill-color-light);
      border-radius: 6px;
    }
  }
</style>
