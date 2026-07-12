<!-- 待办工作台：我的待办（办理/退回/撤回/转办/委派/加减签/作废/抄送）+ 我的抄送 + 进度时间线 -->
<template>
  <div class="flow-todo-page art-full-height">
    <ElCard class="art-table-card">
      <ElTabs v-model="tab" @tab-change="onTabChange">
        <ElTabPane label="我的待办" name="todo">
          <div class="flow-toolbar">
            <ElButton :loading="loading" @click="loadTodo">刷新</ElButton>
          </div>
          <ElTable :data="todo" border :loading="loading">
            <ElTableColumn type="index" label="序号" width="56" />
            <ElTableColumn prop="businessId" label="业务单号" min-width="150" />
            <ElTableColumn prop="flowName" label="流程" min-width="120" />
            <ElTableColumn prop="nodeName" label="当前节点" min-width="120" />
            <ElTableColumn prop="createTime" label="到达时间" min-width="170" />
            <ElTableColumn label="操作" width="300" fixed="right">
              <template #default="{ row }">
                <ElButton link type="success" @click="open('pass', row)">通过</ElButton>
                <ElButton link type="warning" @click="open('reject', row)">退回</ElButton>
                <ElButton link type="primary" @click="showHistory(row)">进度</ElButton>
                <ElDropdown class="flow-more" @command="(c: string) => open(c, row)">
                  <ElButton link type="info"
                    >更多<ElIcon><ArrowDown /></ElIcon
                  ></ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem command="rejectNode">退回指定节点</ElDropdownItem>
                      <ElDropdownItem command="transfer">转办</ElDropdownItem>
                      <ElDropdownItem command="depute">委派</ElDropdownItem>
                      <ElDropdownItem command="addSignature">加签</ElDropdownItem>
                      <ElDropdownItem command="reductionSignature">减签</ElDropdownItem>
                      <ElDropdownItem command="copy">抄送</ElDropdownItem>
                      <ElDropdownItem command="revoke" divided>撤回</ElDropdownItem>
                      <ElDropdownItem command="terminate">作废</ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="我的抄送" name="copy">
          <div class="flow-toolbar">
            <ElButton :loading="loading" @click="loadCopy">刷新</ElButton>
          </div>
          <ElTable :data="copyList" border :loading="loading">
            <ElTableColumn type="index" label="序号" width="56" />
            <ElTableColumn prop="businessId" label="业务单号" min-width="150" />
            <ElTableColumn prop="flowName" label="流程" min-width="120" />
            <ElTableColumn prop="flowStatus" label="状态" width="90">
              <template #default="{ row }">{{ statusText(row) }}</template>
            </ElTableColumn>
            <ElTableColumn prop="createTime" label="抄送时间" min-width="170" />
            <ElTableColumn label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="showHistory(row)">进度</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
      </ElTabs>

      <!-- 统一动作对话框 -->
      <ElDialog v-model="opVisible" :title="opTitle" width="480px" align-center>
        <ElForm label-width="72px">
          <ElFormItem v-if="opKind === 'node'" label="退回节点">
            <ElSelect v-model="opForm.nodeCode" placeholder="选择历史节点" style="width: 100%">
              <ElOption
                v-for="n in nodes"
                :key="n.nodeCode"
                :label="n.nodeName"
                :value="n.nodeCode"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="opKind === 'user'" label="选择人员">
            <ElSelect
              v-model="opForm.handlers"
              multiple
              filterable
              placeholder="选择目标人员"
              style="width: 100%"
            >
              <ElOption v-for="u in users" :key="u.value" :label="u.label" :value="u.value" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="opAction !== 'copy'" label="审批意见">
            <ElInput v-model="opForm.message" type="textarea" :rows="2" placeholder="选填" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="opVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="submitting" @click="submitOp">确定</ElButton>
        </template>
      </ElDialog>

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
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ArrowDown } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import {
    fetchFlowMyTodo,
    fetchFlowMyCopy,
    fetchFlowHandle,
    fetchFlowReject,
    fetchFlowRejectNode,
    fetchFlowRevoke,
    fetchFlowTerminate,
    fetchFlowOperation,
    fetchFlowCopy,
    fetchFlowBackNodes,
    fetchFlowUserSelect,
    fetchFlowHistory
  } from '@/api/system-manage'

  defineOptions({ name: 'FlowTodo' })

  const tab = ref('todo')
  const todo = ref<any[]>([])
  const copyList = ref<any[]>([])
  const loading = ref(false)
  const users = ref<Array<{ label: string; value: any }>>([])

  const historyVisible = ref(false)
  const history = ref<any[]>([])

  // 动作对话框
  const opVisible = ref(false)
  const opAction = ref('')
  const opRow = ref<any>(null)
  const nodes = ref<any[]>([])
  const submitting = ref(false)
  const opForm = reactive<{ message: string; handlers: any[]; nodeCode: string }>({
    message: '',
    handlers: [],
    nodeCode: ''
  })

  // 动作元数据：kind 决定对话框字段，run 分派 API
  const ACTIONS: Record<
    string,
    { title: string; kind: 'message' | 'node' | 'user'; run: (row: any) => Promise<any> }
  > = {
    pass: { title: '通过', kind: 'message', run: (r) => fetchFlowHandle(r.taskId, opForm.message) },
    reject: {
      title: '退回上一步',
      kind: 'message',
      run: (r) => fetchFlowReject(r.taskId, opForm.message)
    },
    rejectNode: {
      title: '退回指定节点',
      kind: 'node',
      run: (r) => fetchFlowRejectNode(r.taskId, opForm.nodeCode, opForm.message)
    },
    revoke: {
      title: '撤回',
      kind: 'message',
      run: (r) => fetchFlowRevoke(r.instanceId, opForm.message)
    },
    terminate: {
      title: '作废',
      kind: 'message',
      run: (r) => fetchFlowTerminate(r.taskId, opForm.message)
    },
    transfer: {
      title: '转办',
      kind: 'user',
      run: (r) => fetchFlowOperation(r.taskId, 'transfer', opForm.handlers, opForm.message)
    },
    depute: {
      title: '委派',
      kind: 'user',
      run: (r) => fetchFlowOperation(r.taskId, 'depute', opForm.handlers, opForm.message)
    },
    addSignature: {
      title: '加签',
      kind: 'user',
      run: (r) => fetchFlowOperation(r.taskId, 'addSignature', opForm.handlers, opForm.message)
    },
    reductionSignature: {
      title: '减签',
      kind: 'user',
      run: (r) =>
        fetchFlowOperation(r.taskId, 'reductionSignature', opForm.handlers, opForm.message)
    },
    copy: { title: '抄送', kind: 'user', run: (r) => fetchFlowCopy(r.taskId, opForm.handlers) }
  }

  const opTitle = computed(() => ACTIONS[opAction.value]?.title || '操作')
  const opKind = computed(() => ACTIONS[opAction.value]?.kind)

  const loadTodo = async (): Promise<void> => {
    loading.value = true
    try {
      todo.value = (await fetchFlowMyTodo()) || []
    } finally {
      loading.value = false
    }
  }
  const loadCopy = async (): Promise<void> => {
    loading.value = true
    try {
      copyList.value = (await fetchFlowMyCopy()) || []
    } finally {
      loading.value = false
    }
  }
  const onTabChange = (name: string | number): void => {
    if (name === 'copy') loadCopy()
    else loadTodo()
  }

  const open = async (action: string, row: any): Promise<void> => {
    opAction.value = action
    opRow.value = row
    opForm.message = ''
    opForm.handlers = []
    opForm.nodeCode = ''
    if (ACTIONS[action]?.kind === 'node') {
      nodes.value = (await fetchFlowBackNodes(row.instanceId)) || []
    }
    opVisible.value = true
  }

  const submitOp = async (): Promise<void> => {
    submitting.value = true
    try {
      await ACTIONS[opAction.value].run(opRow.value)
      ElMessage.success('操作成功')
      opVisible.value = false
      loadTodo()
    } finally {
      submitting.value = false
    }
  }

  const showHistory = async (row: any): Promise<void> => {
    history.value = (await fetchFlowHistory(row.instanceId)) || []
    historyVisible.value = true
  }

  const statusText = (h: any): string => {
    const map: Record<string, string> = {
      '0': '待提交',
      '1': '审批中',
      '2': '已通过',
      '4': '已终止',
      '5': '已作废',
      '6': '已撤销',
      '8': '已完成',
      '9': '已退回',
      '11': '已拿回'
    }
    return map[String(h.flowStatus)] || h.skipType || '流转'
  }

  const timelineType = (h: any): 'primary' | 'success' | 'warning' | 'danger' => {
    const s = String(h.flowStatus)
    if (s === '9' || s === '11') return 'warning'
    if (s === '4' || s === '5') return 'danger'
    if (s === '2' || s === '8') return 'success'
    return 'primary'
  }

  onMounted(async () => {
    users.value = (await fetchFlowUserSelect()) || []
    loadTodo()
  })
</script>

<style scoped>
  .flow-toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  .flow-more {
    margin-left: 12px;
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
