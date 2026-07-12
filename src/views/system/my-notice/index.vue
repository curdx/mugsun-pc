<!-- 我的通知：按可见范围拉取通知，点开查看详情自动标已读（首读计 UV） -->
<template>
  <div class="my-notice-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSegmented v-model="category" :options="CATEGORY_FILTERS" @change="onCategoryChange" />
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog v-model="viewVisible" :title="current.title" width="640px" align-center>
      <div class="notice-meta">
        <ElTag :type="categoryTag(current.category).type" size="small">
          {{ categoryTag(current.category).text }}
        </ElTag>
        <span>{{ (current.releaseTime || '').slice(0, 19).replace('T', ' ') }}</span>
      </div>
      <div class="notice-content" v-safe-html="current.content"></div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { h, reactive, ref } from 'vue'
  import { ElButton, ElTag } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchMyNoticePage, fetchReadNotice } from '@/api/system-manage'

  defineOptions({ name: 'MyNotice' })

  type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'
  const CATEGORY_MAP: Record<string, { text: string; type: TagType }> = {
    notice: { text: '通知', type: 'primary' },
    announcement: { text: '公告', type: 'success' },
    warning: { text: '预警', type: 'warning' }
  }
  const CATEGORY_FILTERS = [
    { label: '全部', value: '' },
    { label: '通知', value: 'notice' },
    { label: '公告', value: 'announcement' },
    { label: '预警', value: 'warning' }
  ]
  const categoryTag = (c: string): { text: string; type: TagType } =>
    CATEGORY_MAP[c] || { text: c || '-', type: 'info' }

  const category = ref('')
  const viewVisible = ref(false)
  const current = reactive<any>({ title: '', content: '', category: '', releaseTime: '' })

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
      apiFn: fetchMyNoticePage,
      apiParams: { pageNum: 1, pageSize: 10, category: '' },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        {
          prop: 'isTop',
          label: '',
          width: 50,
          formatter: (row: any) =>
            row.isTop === 1 ? h(ElTag, { type: 'danger', size: 'small' }, () => '顶') : ''
        },
        { prop: 'title', label: '标题', minWidth: 260 },
        {
          prop: 'category',
          label: '分类',
          width: 90,
          formatter: (row: any) => {
            const c = categoryTag(row.category)
            return h(ElTag, { type: c.type, size: 'small' }, () => c.text)
          }
        },
        {
          prop: 'readFlag',
          label: '状态',
          width: 90,
          formatter: (row: any) =>
            h(ElTag, { type: row.readFlag ? 'info' : 'danger', size: 'small' }, () =>
              row.readFlag ? '已读' : '未读'
            )
        },
        { prop: 'releaseTime', label: '发布时间', minWidth: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row: any) =>
            h(
              ElButton,
              { link: true, type: 'primary', size: 'small', onClick: () => view(row) },
              () => '查看'
            )
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

  // 分类过滤：写入搜索参数并刷新
  const onCategoryChange = (val: string | number) => {
    ;(searchParams as Record<string, unknown>).category = val
    refreshData()
  }

  // 查看详情：未读则标已读
  const view = async (row: any) => {
    Object.assign(current, {
      title: row.title,
      content: row.content,
      category: row.category,
      releaseTime: row.releaseTime
    })
    viewVisible.value = true
    if (!row.readFlag) {
      await fetchReadNotice(row.id)
      row.readFlag = true
    }
  }
</script>

<style lang="scss" scoped>
  .notice-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .notice-content {
    line-height: 1.7;
  }
</style>
