<!-- 我的消息：站内信收件箱，查看详情自动标已读 -->
<template>
  <div class="my-message-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton @click="readAll" v-ripple>全部已读</ElButton>
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

    <ElDialog v-model="viewVisible" :title="current.title" width="560px">
      <div class="msg-meta">{{ (current.sendTime || '').slice(0, 19).replace('T', ' ') }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="msg-content" v-html="safeContent"></div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { h, reactive } from 'vue'
  import DOMPurify from 'dompurify'
  import { ElButton, ElTag, ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useMessageStore } from '@/store/modules/message'
  import {
    fetchMyMessagePage,
    fetchReadMessage,
    fetchReadAllMessage,
    fetchRemoveMyMessage
  } from '@/api/message'

  defineOptions({ name: 'Message' })

  const messageStore = useMessageStore()
  const viewVisible = ref(false)
  const current = reactive<any>({ title: '', content: '', sendTime: '' })
  const safeContent = computed(() => DOMPurify.sanitize(current.content || ''))

  const TYPE_LABEL: Record<string, string> = { system: '系统', notice: '通知', todo: '待办' }

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
      apiFn: fetchMyMessagePage,
      apiParams: { pageNum: 1, pageSize: 10 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { prop: 'title', label: '标题', minWidth: 240 },
        {
          prop: 'type',
          label: '类型',
          width: 90,
          formatter: (row: any) => TYPE_LABEL[row.type] || row.type
        },
        {
          prop: 'isRead',
          label: '状态',
          width: 90,
          formatter: (row: any) =>
            h(ElTag, { type: row.isRead === 1 ? 'info' : 'danger' }, () =>
              row.isRead === 1 ? '已读' : '未读'
            )
        },
        { prop: 'sendTime', label: '发送时间', minWidth: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(
                ElButton,
                { link: true, type: 'primary', size: 'small', onClick: () => view(row) },
                () => '查看'
              ),
              h(
                ElButton,
                { link: true, type: 'danger', size: 'small', onClick: () => remove(row) },
                () => '删除'
              )
            ])
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

  // 查看详情：未读则标已读并刷新角标
  const view = async (row: any) => {
    Object.assign(current, { title: row.title, content: row.content, sendTime: row.sendTime })
    viewVisible.value = true
    if (row.isRead === 0) {
      await fetchReadMessage(row.messageId)
      row.isRead = 1
      messageStore.refreshUnread()
    }
  }

  const readAll = async () => {
    await fetchReadAllMessage()
    ElMessage.success('已全部标记已读')
    messageStore.refreshUnread()
    refreshData()
  }

  const remove = (row: any) => {
    ElMessageBox.confirm('确定删除该消息吗？', '删除', { type: 'warning' }).then(async () => {
      await fetchRemoveMyMessage([row.id])
      ElMessage.success('删除成功')
      messageStore.refreshUnread()
      refreshData()
    })
  }
</script>

<style lang="scss" scoped>
  .msg-meta {
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .msg-content {
    line-height: 1.7;
  }
</style>
