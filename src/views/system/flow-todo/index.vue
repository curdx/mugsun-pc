<!-- 待办工作台页（我的待办 + 办理/驳回 + 进度时间线，对接 /system/flow） -->
<template>
  <div class="flow-todo-page art-full-height">
    <ElCard class="art-table-card">
      <div class="flow-toolbar">
        <span class="flow-title">我的待办</span>
        <ElButton :loading="loading" @click="loadData">刷新</ElButton>
      </div>

      <ElTable :data="tableData" border :loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="businessId" label="业务单号" min-width="160" />
        <ElTableColumn prop="flowName" label="流程" min-width="140" />
        <ElTableColumn prop="nodeName" label="当前节点" min-width="140" />
        <ElTableColumn prop="createTime" label="到达时间" min-width="180" />
        <ElTableColumn label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <ElButton link type="success" @click="handle(row)">办理</ElButton>
            <ElButton link type="danger" @click="reject(row)">驳回</ElButton>
            <ElButton link type="primary" @click="showHistory(row)">进度</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElDialog v-model="historyVisible" title="流转进度" width="520px" align-center>
        <ElTimeline>
          <ElTimelineItem
            v-for="(h, i) in history"
            :key="i"
            :type="timelineType(h)"
            :timestamp="h.createTime"
          >
            <div class="flow-his-node">{{ h.nodeName }}</div>
            <div class="flow-his-meta">
              {{ statusText(h) }}
              <span v-if="h.approver">· 处理人 {{ h.approver }}</span>
              <span v-if="h.message">· {{ h.message }}</span>
            </div>
          </ElTimelineItem>
        </ElTimeline>
      </ElDialog>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import {
    fetchFlowMyTodo,
    fetchFlowHandle,
    fetchFlowReject,
    fetchFlowHistory
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FlowTodo' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const historyVisible = ref(false)
  const history = ref<any[]>([])

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchFlowMyTodo()) || []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const handle = (row: any): void => {
    ElMessageBox.confirm(`确定通过"${row.businessId}"的审批吗？`, '办理', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'success'
    }).then(async () => {
      await fetchFlowHandle(row.taskId)
      ElMessage.success('已办理')
      loadData()
    })
  }

  const reject = (row: any): void => {
    ElMessageBox.confirm(`确定驳回"${row.businessId}"吗？`, '驳回', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchFlowReject(row.taskId)
      ElMessage.success('已驳回')
      loadData()
    })
  }

  const showHistory = async (row: any): Promise<void> => {
    history.value = (await fetchFlowHistory(row.instanceId)) || []
    historyVisible.value = true
  }

  const statusText = (h: any): string => {
    const map: Record<string, string> = {
      '1': '待审批',
      '2': '已通过',
      '4': '已驳回',
      '8': '已完成',
      '9': '已撤销'
    }
    return map[String(h.flowStatus)] || h.skipType || '流转'
  }

  const timelineType = (h: any): 'primary' | 'success' | 'danger' => {
    if (String(h.flowStatus) === '4') return 'danger'
    if (String(h.flowStatus) === '2' || String(h.flowStatus) === '8') return 'success'
    return 'primary'
  }
</script>

<style scoped>
  .flow-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .flow-title {
    font-size: 15px;
    font-weight: 500;
  }

  .flow-his-node {
    font-weight: 500;
  }

  .flow-his-meta {
    margin-top: 2px;
    font-size: 12px;
    color: var(--art-text-gray-600);
  }
</style>
