<!-- 通知阅读记录弹窗：谁读了 / 阅读次数 / 首末阅读时间 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="$t('pages.system.notice.readRecord')"
    width="680px"
    align-center
    @open="onOpen"
  >
    <div class="read-summary">
      <ElTag type="primary" effect="light"
        >{{ $t('pages.system.notice.readUvTag') }}{{ notice?.viewUv ?? 0 }}</ElTag
      >
      <ElTag type="info" effect="light"
        >{{ $t('pages.system.notice.readPvTag') }}{{ notice?.viewPv ?? 0 }}</ElTag
      >
    </div>
    <ElTable :data="records" v-loading="loading" border height="360" style="margin-top: 12px">
      <ElTableColumn type="index" :label="$t('pages.system.notice.colIndex')" width="60" />
      <ElTableColumn prop="nickname" :label="$t('pages.system.notice.colReader')" min-width="140" />
      <ElTableColumn prop="deptName" :label="$t('pages.system.notice.colDept')" min-width="120" />
      <ElTableColumn
        prop="readCount"
        :label="$t('pages.system.notice.colReadCount')"
        width="80"
        align="center"
      />
      <ElTableColumn
        prop="firstTime"
        :label="$t('pages.system.notice.colFirstTime')"
        min-width="170"
      />
      <ElTableColumn
        prop="lastTime"
        :label="$t('pages.system.notice.colLastTime')"
        min-width="170"
      />
    </ElTable>
    <div class="read-pager">
      <ElPagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="loadRecords"
      />
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchNoticeReadPage } from '@/api/system-manage'

  interface Props {
    visible: boolean
    notice?: Record<string, any>
  }
  const props = defineProps<Props>()
  const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const records = ref<any[]>([])
  const loading = ref(false)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const loadRecords = async () => {
    if (!props.notice?.id) return
    loading.value = true
    try {
      const resp: any = await fetchNoticeReadPage({
        noticeId: props.notice.id,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      })
      records.value = resp?.records ?? []
      total.value = resp?.totalRow ?? 0
    } finally {
      loading.value = false
    }
  }

  const onOpen = () => {
    pageNum.value = 1
    loadRecords()
  }
</script>

<style lang="scss" scoped>
  .read-summary {
    display: flex;
    gap: 12px;
  }

  .read-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
