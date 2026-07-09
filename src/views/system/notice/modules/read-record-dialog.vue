<!-- 通知阅读记录弹窗：谁读了 / 阅读次数 / 首末阅读时间 -->
<template>
  <ElDialog v-model="dialogVisible" title="阅读记录" width="680px" align-center @open="onOpen">
    <div class="read-summary">
      <ElTag type="primary" effect="light">阅读人数(UV)：{{ notice?.viewUv ?? 0 }}</ElTag>
      <ElTag type="info" effect="light">阅读次数(PV)：{{ notice?.viewPv ?? 0 }}</ElTag>
    </div>
    <ElTable :data="records" v-loading="loading" border height="360" style="margin-top: 12px">
      <ElTableColumn type="index" label="序号" width="60" />
      <ElTableColumn prop="nickname" label="阅读人" min-width="140" />
      <ElTableColumn prop="deptName" label="部门" min-width="120" />
      <ElTableColumn prop="readCount" label="次数" width="80" align="center" />
      <ElTableColumn prop="firstTime" label="首次阅读" min-width="170" />
      <ElTableColumn prop="lastTime" label="最近阅读" min-width="170" />
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
