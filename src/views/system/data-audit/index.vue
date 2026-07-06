<!-- 数据变更记录：字段级 diff 时间轴 + 原始快照前后对比高亮 -->
<template>
  <div class="data-audit-page art-full-height">
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

      <ElDialog v-model="detailVisible" title="变更记录详情" width="820px" align-center>
        <ElDescriptions :column="2" border size="small">
          <ElDescriptionsItem label="业务对象">{{ bizLabel(current.bizTable) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="业务ID">{{ current.bizId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">{{ current.operator }}</ElDescriptionsItem>
          <ElDescriptionsItem label="时间">{{ current.createTime }}</ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider content-position="left">字段变更</ElDivider>
        <ElTimeline v-if="changes.length">
          <ElTimelineItem
            v-for="(c, i) in changes"
            :key="i"
            type="primary"
            :hollow="true"
            :timestamp="c.label"
            placement="top"
          >
            <div class="change-line">
              <span class="old">{{ c.old || '空' }}</span>
              <span class="arrow">→</span>
              <span class="new">{{ c.new || '空' }}</span>
            </div>
          </ElTimelineItem>
        </ElTimeline>
        <ElEmpty v-else description="无字段级变更" :image-size="60" />

        <ElDivider content-position="left">快照对比</ElDivider>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="diff-view" v-html="diffHtmlStr"></div>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDataAuditPage, fetchDataAuditDetail } from '@/api/system-manage'
  import { ElTag } from 'element-plus'
  import { createTwoFilesPatch } from 'diff'
  import { html as renderDiff } from 'diff2html'
  import 'diff2html/bundles/css/diff2html.min.css'

  defineOptions({ name: 'DataAudit' })

  interface FieldChange {
    label: string
    old: string
    new: string
  }

  const BIZ_LABELS: Record<string, string> = { sys_user: '用户' }
  const bizLabel = (t: string): string => BIZ_LABELS[t] ?? t

  const detailVisible = ref(false)
  const current = ref<Record<string, any>>({})
  const changes = ref<FieldChange[]>([])
  const diffHtmlStr = ref('')

  const parseChanges = (raw: string): FieldChange[] => {
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  const buildDiff = (before: string, after: string): string => {
    const pretty = (s: string): string => {
      if (!s) return ''
      try {
        return JSON.stringify(JSON.parse(s), null, 2)
      } catch {
        return s
      }
    }
    const patch = createTwoFilesPatch('变更前', '变更后', pretty(before), pretty(after), '', '')
    return renderDiff(patch, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side'
    })
  }

  const showDetail = async (row: Record<string, any>): Promise<void> => {
    const res: any = await fetchDataAuditDetail({ id: row.id })
    const detail = res ?? row
    current.value = detail
    changes.value = parseChanges(detail.changeContent)
    diffHtmlStr.value = buildDiff(detail.beforeData, detail.afterData)
    detailVisible.value = true
  }

  const summary = (row: Record<string, any>): string => {
    const cs = parseChanges(row.changeContent)
    return cs.length ? cs.map((c) => c.label).join('、') : '—'
  }

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
      apiFn: fetchDataAuditPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'bizTable',
          label: '业务对象',
          width: 120,
          formatter: (row: any) => h(ElTag, { type: 'info' }, () => bizLabel(row.bizTable))
        },
        { prop: 'bizId', label: '业务ID', minWidth: 170 },
        {
          prop: 'summary',
          label: '变更字段',
          minWidth: 160,
          formatter: (row: any) => summary(row)
        },
        { prop: 'operator', label: '操作人', minWidth: 170 },
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
</script>

<style scoped>
  .change-line {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .change-line .old {
    color: var(--el-color-danger);
    text-decoration: line-through;
  }

  .change-line .new {
    font-weight: 600;
    color: var(--el-color-success);
  }

  .change-line .arrow {
    color: var(--el-text-color-secondary);
  }

  .diff-view {
    max-height: 340px;
    overflow: auto;
  }
</style>
