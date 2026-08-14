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
        <ArtDictTag :code="DICT_CODE.NOTICE_CATEGORY" :value="current.category" />
        <span>{{ formatTableTime(current.releaseTime) }}</span>
      </div>
      <div class="notice-content" v-safe-html="current.content"></div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { h, reactive, ref } from 'vue'
  import { ElButton, ElTag } from 'element-plus'
  import ArtDictTag from '@/components/core/base/art-dict-tag/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchMyNoticePage, fetchReadNotice } from '@/api/system-manage'
  import { DICT_CODE } from '@/utils/constants'
  import { formatTableTime } from '@/utils/date'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'MyNotice' })

  const { t } = useI18n()

  const CATEGORY_FILTERS = [
    { label: t('pages.system.myNotice.filterAll'), value: '' },
    { label: t('pages.system.myNotice.filterNotice'), value: 'notice' },
    { label: t('pages.system.myNotice.filterAnnouncement'), value: 'announcement' },
    { label: t('pages.system.myNotice.filterWarning'), value: 'warning' }
  ]
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
          // 列宽需容纳「顶」tag（27.5px）+ 单元格内边距（24px），50px 会触发 text-overflow 省略号
          width: 60,
          formatter: (row: any) =>
            row.isTop === 1
              ? h(ElTag, { type: 'danger', size: 'small' }, () => t('pages.system.myNotice.topTag'))
              : ''
        },
        { prop: 'title', label: t('pages.system.myNotice.colTitle'), minWidth: 260 },
        {
          prop: 'category',
          label: t('pages.system.myNotice.colCategory'),
          width: 90,
          // 字典运行时驱动：与通知公告管理页一致走 ArtDictTag，不再手写 CATEGORY_MAP
          formatter: (row: any) =>
            h(ArtDictTag, { code: DICT_CODE.NOTICE_CATEGORY, value: row.category })
        },
        {
          prop: 'readFlag',
          label: t('pages.system.myNotice.colStatus'),
          width: 90,
          formatter: (row: any) =>
            h(ElTag, { type: row.readFlag ? 'info' : 'danger', size: 'small' }, () =>
              row.readFlag
                ? t('pages.system.myNotice.statusRead')
                : t('pages.system.myNotice.statusUnread')
            )
        },
        {
          prop: 'releaseTime',
          label: t('pages.system.myNotice.colReleaseTime'),
          minWidth: 180,
          formatter: (row: any) => formatTableTime(row.releaseTime)
        },
        {
          prop: 'operation',
          label: t('pages.system.myNotice.colOperation'),
          width: 100,
          fixed: 'right',
          formatter: (row: any) =>
            h(
              ElButton,
              { link: true, type: 'primary', size: 'small', onClick: () => view(row) },
              () => t('pages.system.myNotice.viewBtn')
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
    // 富文本公告可能很长：限高 + 内部滚动，防矮视口下弹窗整体挤出视口
    max-height: 60vh;
    overflow-y: auto;
    line-height: 1.7;
  }
</style>
