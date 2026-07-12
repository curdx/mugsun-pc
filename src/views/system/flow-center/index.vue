<!-- 审批中心：待办/我发起/已办/抄送我的 + 通用审批抽屉（表单渲染·流程图进度·时间轴·下一节点预测·buttonList 动作） -->
<template>
  <div class="flow-center-page art-full-height">
    <ElCard class="art-table-card">
      <ElTabs v-model="tab" @tab-change="onTabChange">
        <ElTabPane label="待办" name="todo">
          <div class="fc-toolbar"><ElButton :loading="loading" @click="load">刷新</ElButton></div>
          <ElTable :data="rows" border :loading="loading">
            <ElTableColumn type="index" label="序号" width="56" />
            <ElTableColumn prop="businessId" label="业务单号" min-width="150" />
            <ElTableColumn prop="flowName" label="流程" min-width="120" />
            <ElTableColumn prop="nodeName" label="当前节点" min-width="120" />
            <ElTableColumn prop="createTime" label="到达时间" min-width="170" />
            <ElTableColumn label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDetail(row, 'todo')">办理</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="我发起" name="started">
          <div class="fc-toolbar"><ElButton :loading="loading" @click="load">刷新</ElButton></div>
          <ElTable :data="rows" border :loading="loading">
            <ElTableColumn type="index" label="序号" width="56" />
            <ElTableColumn prop="businessId" label="业务单号" min-width="150" />
            <ElTableColumn prop="flowName" label="流程" min-width="120" />
            <ElTableColumn prop="nodeName" label="当前节点" min-width="110" />
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }"
                ><ElTag :type="statusTag(row)">{{ statusText(row) }}</ElTag></template
              >
            </ElTableColumn>
            <ElTableColumn prop="createTime" label="发起时间" min-width="170" />
            <ElTableColumn label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDetail(row, 'view')">详情</ElButton>
                <ElButton
                  v-if="String(row.flowStatus) === '1'"
                  link
                  type="warning"
                  @click="revoke(row)"
                  >撤回</ElButton
                >
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="已办" name="done">
          <div class="fc-toolbar"><ElButton :loading="loading" @click="load">刷新</ElButton></div>
          <ElTable :data="rows" border :loading="loading">
            <ElTableColumn type="index" label="序号" width="56" />
            <ElTableColumn prop="businessId" label="业务单号" min-width="150" />
            <ElTableColumn prop="flowName" label="流程" min-width="120" />
            <ElTableColumn prop="nodeName" label="办理节点" min-width="110" />
            <ElTableColumn label="我的操作" width="90">
              <template #default="{ row }">{{ skipText(row.skipType) }}</template>
            </ElTableColumn>
            <ElTableColumn label="流程状态" width="90">
              <template #default="{ row }"
                ><ElTag :type="statusTag(row)">{{ statusText(row) }}</ElTag></template
              >
            </ElTableColumn>
            <ElTableColumn prop="createTime" label="办理时间" min-width="170" />
            <ElTableColumn label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDetail(row, 'view')">详情</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="抄送我的" name="copy">
          <div class="fc-toolbar"><ElButton :loading="loading" @click="load">刷新</ElButton></div>
          <ElTable :data="rows" border :loading="loading">
            <ElTableColumn type="index" label="序号" width="56" />
            <ElTableColumn prop="businessId" label="业务单号" min-width="150" />
            <ElTableColumn prop="flowName" label="流程" min-width="120" />
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }"
                ><ElTag :type="statusTag(row)">{{ statusText(row) }}</ElTag></template
              >
            </ElTableColumn>
            <ElTableColumn prop="createTime" label="抄送时间" min-width="170" />
            <ElTableColumn label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDetail(row, 'view')">详情</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <!-- 通用审批抽屉 -->
    <ElDrawer v-model="detailVisible" :title="detailTitle" size="620px" :destroy-on-close="true">
      <div v-loading="detailLoading" class="fc-detail">
        <ElDivider content-position="left">流程进度</ElDivider>
        <FlowProgress :nodes="progress" />

        <ElDivider content-position="left">业务表单</ElDivider>
        <ApprovalForm
          ref="formRef"
          :schema="form.schema"
          :option-json="form.option"
          :data="form.data"
          :perms="form.fieldPerms"
          :readonly="mode !== 'todo'"
        />

        <template v-if="mode === 'todo'">
          <ElDivider content-position="left">下一节点审批人</ElDivider>
          <div v-if="nextApprovers.length" class="fc-next">
            <div v-for="na in nextApprovers" :key="na.nodeCode" class="fc-next-node">
              <span class="fc-next-name">{{ na.nodeName }}</span>
              <template v-if="na.end"><ElTag size="small" type="info">流程结束</ElTag></template>
              <template v-else>
                <ElTag v-for="a in na.approvers" :key="a.id" size="small" class="fc-next-tag">{{
                  a.name
                }}</ElTag>
                <span v-if="!na.approvers.length" class="fc-next-empty">（无）</span>
              </template>
            </div>
          </div>
          <ElEmpty v-else description="无后续节点" :image-size="50" />

          <ElDivider content-position="left">审批意见</ElDivider>
          <ElInput v-model="opinion" type="textarea" :rows="2" placeholder="选填" />
        </template>

        <ElDivider content-position="left">流转记录</ElDivider>
        <ElTimeline>
          <ElTimelineItem
            v-for="(h, i) in history"
            :key="i"
            :type="timelineType(h)"
            :timestamp="h.createTime"
          >
            <div class="fc-his-node">{{ h.nodeName }}</div>
            <div class="fc-his-meta">
              {{ statusText(h) }}
              <span v-if="h.approver">· 处理人 {{ h.approver }}</span>
              <span v-if="h.message">· {{ h.message }}</span>
            </div>
          </ElTimelineItem>
        </ElTimeline>
      </div>

      <template v-if="mode === 'todo'" #footer>
        <div class="fc-actions">
          <ElButton v-if="btn('pass')" type="success" :loading="submitting" @click="doPass"
            >通过</ElButton
          >
          <ElButton v-if="btn('reject')" type="warning" @click="openOp('reject')">退回</ElButton>
          <ElDropdown v-if="hasMore" @command="openOp">
            <ElButton
              >更多<ElIcon><ArrowDown /></ElIcon
            ></ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem v-if="btn('rejectNode')" command="rejectNode"
                  >退回指定节点</ElDropdownItem
                >
                <ElDropdownItem v-if="btn('transfer')" command="transfer">转办</ElDropdownItem>
                <ElDropdownItem v-if="btn('depute')" command="depute">委派</ElDropdownItem>
                <ElDropdownItem v-if="btn('addSignature')" command="addSignature"
                  >加签</ElDropdownItem
                >
                <ElDropdownItem v-if="btn('reductionSignature')" command="reductionSignature"
                  >减签</ElDropdownItem
                >
                <ElDropdownItem v-if="btn('copy')" command="copy">抄送</ElDropdownItem>
                <ElDropdownItem v-if="btn('terminate')" command="terminate" divided
                  >作废</ElDropdownItem
                >
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </template>
    </ElDrawer>

    <!-- 二级动作对话框（退回/转办/委派/加减签/抄送/作废） -->
    <ElDialog v-model="opVisible" :title="opTitle" width="460px" align-center>
      <ElForm label-width="72px">
        <ElFormItem v-if="opKind === 'node'" label="退回节点">
          <ElSelect v-model="opForm.nodeCode" placeholder="选择历史节点" style="width: 100%">
            <ElOption
              v-for="n in backNodes"
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
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ArrowDown } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import FlowProgress from './components/FlowProgress.vue'
  import ApprovalForm from './components/ApprovalForm.vue'
  import {
    fetchFlowMyTodo,
    fetchFlowMyStarted,
    fetchFlowMyDone,
    fetchFlowMyCopy,
    fetchFlowProgress,
    fetchFlowHistory,
    fetchFlowNextApprovers,
    fetchFlowTaskButtons,
    fetchFlowTaskForm,
    fetchFlowInstanceForm,
    fetchFlowHandle,
    fetchFlowReject,
    fetchFlowRejectNode,
    fetchFlowRevoke,
    fetchFlowTerminate,
    fetchFlowOperation,
    fetchFlowCopy,
    fetchFlowBackNodes,
    fetchFlowUserSelect
  } from '@/api/system-manage'

  defineOptions({ name: 'FlowCenter' })

  const LOADERS: Record<string, () => Promise<any[]>> = {
    todo: fetchFlowMyTodo,
    started: fetchFlowMyStarted,
    done: fetchFlowMyDone,
    copy: fetchFlowMyCopy
  }

  const tab = ref('todo')
  const rows = ref<any[]>([])
  const loading = ref(false)
  const users = ref<Array<{ label: string; value: any }>>([])

  // 详情抽屉
  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const mode = ref<'todo' | 'view'>('view')
  const current = ref<any>(null)
  const progress = ref<any[]>([])
  const history = ref<any[]>([])
  const nextApprovers = ref<any[]>([])
  const buttonList = ref<string[]>([])
  const form = reactive<Record<string, any>>({ schema: '', option: '', data: {}, fieldPerms: {} })
  const opinion = ref('')
  const formRef = ref<any>(null)
  const submitting = ref(false)

  // 二级动作对话框
  const opVisible = ref(false)
  const opAction = ref('')
  const backNodes = ref<any[]>([])
  const opForm = reactive<{ message: string; handlers: any[]; nodeCode: string }>({
    message: '',
    handlers: [],
    nodeCode: ''
  })

  const detailTitle = computed(() =>
    mode.value === 'todo'
      ? `办理 - ${current.value?.businessId ?? ''}`
      : `详情 - ${current.value?.businessId ?? ''}`
  )
  const btn = (code: string): boolean => buttonList.value.includes(code)
  const hasMore = computed(() =>
    [
      'rejectNode',
      'transfer',
      'depute',
      'addSignature',
      'reductionSignature',
      'copy',
      'terminate'
    ].some(btn)
  )

  const load = async (): Promise<void> => {
    loading.value = true
    try {
      rows.value = (await LOADERS[tab.value]()) || []
    } finally {
      loading.value = false
    }
  }
  const onTabChange = (): void => {
    load()
  }

  const openDetail = async (row: any, m: 'todo' | 'view'): Promise<void> => {
    current.value = row
    mode.value = m
    opinion.value = ''
    detailVisible.value = true
    detailLoading.value = true
    try {
      const [prog, his] = await Promise.all([
        fetchFlowProgress(row.instanceId),
        fetchFlowHistory(row.instanceId)
      ])
      progress.value = prog || []
      history.value = his || []
      if (m === 'todo') {
        const [f, buttons, next] = await Promise.all([
          fetchFlowTaskForm(row.taskId),
          fetchFlowTaskButtons(row.taskId),
          fetchFlowNextApprovers(row.taskId)
        ])
        setForm(f)
        buttonList.value = buttons || []
        nextApprovers.value = next || []
      } else {
        setForm(await fetchFlowInstanceForm(row.instanceId))
        buttonList.value = []
        nextApprovers.value = []
      }
    } finally {
      detailLoading.value = false
    }
  }

  const setForm = (f: Record<string, any>): void => {
    form.schema = f?.hasForm ? f.schema : ''
    form.option = f?.option || ''
    form.data = f?.data || {}
    form.fieldPerms = f?.fieldPerms || {}
  }

  // ==================== 待办动作 ====================

  const doPass = async (): Promise<void> => {
    let variable: Record<string, any> | undefined
    if (form.schema && formRef.value) {
      try {
        await formRef.value.validate()
      } catch {
        ElMessage.warning('请完善表单必填项')
        return
      }
      variable = formRef.value.getFormData()
    }
    submitting.value = true
    try {
      await fetchFlowHandle(current.value.taskId, opinion.value, variable)
      ElMessage.success('已通过')
      detailVisible.value = false
      load()
    } finally {
      submitting.value = false
    }
  }

  const OP: Record<
    string,
    { title: string; kind: 'message' | 'node' | 'user'; run: (r: any) => Promise<any> }
  > = {
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
  const opTitle = computed(() => OP[opAction.value]?.title || '操作')
  const opKind = computed(() => OP[opAction.value]?.kind)

  const openOp = async (action: string): Promise<void> => {
    opAction.value = action
    opForm.message = ''
    opForm.handlers = []
    opForm.nodeCode = ''
    if (OP[action]?.kind === 'node') {
      backNodes.value = (await fetchFlowBackNodes(current.value.instanceId)) || []
    }
    opVisible.value = true
  }

  const submitOp = async (): Promise<void> => {
    submitting.value = true
    try {
      await OP[opAction.value].run(current.value)
      ElMessage.success('操作成功')
      opVisible.value = false
      detailVisible.value = false
      load()
    } finally {
      submitting.value = false
    }
  }

  const revoke = async (row: any): Promise<void> => {
    await ElMessageBox.confirm('确认撤回该流程？', '撤回', { type: 'warning' })
    await fetchFlowRevoke(row.instanceId)
    ElMessage.success('已撤回')
    load()
  }

  // ==================== 文案 ====================

  const STATUS: Record<string, string> = {
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
  const statusText = (h: any): string => STATUS[String(h.flowStatus)] || '流转'
  const statusTag = (h: any): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    const s = String(h.flowStatus)
    if (s === '2' || s === '8') return 'success'
    if (s === '9' || s === '11') return 'warning'
    if (s === '4' || s === '5' || s === '6') return 'danger'
    if (s === '1') return 'primary'
    return 'info'
  }
  const skipText = (s: string): string =>
    ({ PASS: '通过', REJECT: '退回', NONE: '提交' })[s] || s || '-'
  const timelineType = (h: any): 'primary' | 'success' | 'warning' | 'danger' => {
    const s = String(h.flowStatus)
    if (s === '9' || s === '11') return 'warning'
    if (s === '4' || s === '5') return 'danger'
    if (s === '2' || s === '8') return 'success'
    return 'primary'
  }

  onMounted(async () => {
    users.value = (await fetchFlowUserSelect()) || []
    load()
  })
</script>

<style scoped>
  .fc-toolbar {
    margin-bottom: 12px;
  }

  .fc-detail {
    padding: 0 4px;
  }

  .fc-next-node {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }

  .fc-next-name {
    font-weight: 500;
  }

  .fc-next-tag {
    margin-left: 2px;
  }

  .fc-next-empty {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .fc-his-node {
    font-weight: 500;
  }

  .fc-his-meta {
    margin-top: 2px;
    font-size: 12px;
    color: var(--art-text-gray-600);
  }

  .fc-actions {
    display: flex;
    gap: 10px;
  }
</style>
