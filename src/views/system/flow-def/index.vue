<!-- 流程定义管理 + 图形流程设计器（对接 /system/flow）：设计→部署→发起走通 -->
<template>
  <div class="flow-def-page art-full-height">
    <ElCard class="art-table-card">
      <div class="flow-toolbar">
        <ElButton type="primary" @click="openDesigner">设计流程</ElButton>
        <ElButton @click="deploy">部署请假流程</ElButton>
        <ElButton @click="() => start('leave')">发起请假</ElButton>
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="flowCode" label="流程编码" min-width="140" />
        <ElTableColumn prop="flowName" label="流程名称" min-width="160" />
        <ElTableColumn prop="version" label="版本" width="90" />
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="row.isPublish === 1 ? 'success' : 'info'">
              {{ row.isPublish === 1 ? '已发布' : '未发布' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" min-width="180" />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="start(row.flowCode)">发起</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 图形流程设计器 -->
    <ElDialog v-model="designerVisible" title="流程设计器" width="880px" align-center>
      <ElForm :model="design" label-width="90px">
        <ElFormItem label="流程编码" required>
          <ElInput
            v-model="design.flowCode"
            placeholder="英文标识，如 purchase"
            style="width: 260px"
          />
        </ElFormItem>
        <ElFormItem label="流程名称" required>
          <ElInput v-model="design.flowName" placeholder="如 采购审批" style="width: 260px" />
        </ElFormItem>
        <ElFormItem label="审批节点">
          <ElButton size="small" type="primary" @click="addNode">+ 添加审批节点</ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 可视化流程图 -->
      <div class="flow-diagram">
        <div class="flow-node flow-node--start">开始</div>
        <template v-for="(node, idx) in design.nodes" :key="idx">
          <ArtSvgIcon class="flow-arrow" icon="ri:arrow-right-line" />
          <div class="flow-node flow-node--task">
            <ElInput v-model="node.name" size="small" placeholder="节点名称" class="node-input" />
            <div v-for="(c, ci) in node.candidates" :key="ci" class="cand-row">
              <ElSelect v-model="c.type" size="small" class="cand-type" @change="c.value = ''">
                <ElOption label="角色" value="role" />
                <ElOption label="部门" value="dept" />
                <ElOption label="指定用户" value="user" />
                <ElOption label="发起人本人" value="initiator" />
                <ElOption label="部门负责人" value="deptLeader" />
              </ElSelect>
              <ElSelect
                v-if="c.type === 'role'"
                v-model="c.value"
                size="small"
                placeholder="角色"
                class="cand-val"
              >
                <ElOption v-for="r in roles" :key="r.value" :label="r.label" :value="r.value" />
              </ElSelect>
              <ElSelect
                v-else-if="c.type === 'dept'"
                v-model="c.value"
                size="small"
                placeholder="部门"
                class="cand-val"
              >
                <ElOption v-for="d in depts" :key="d.value" :label="d.label" :value="d.value" />
              </ElSelect>
              <ElSelect
                v-else-if="c.type === 'user'"
                v-model="c.value"
                size="small"
                filterable
                placeholder="用户"
                class="cand-val"
              >
                <ElOption v-for="u in users" :key="u.value" :label="u.label" :value="u.value" />
              </ElSelect>
              <ElButton
                v-if="node.candidates.length > 1"
                link
                type="danger"
                size="small"
                @click="node.candidates.splice(ci, 1)"
                >×</ElButton
              >
            </div>
            <div class="node-ops">
              <ElButton link type="primary" size="small" @click="addCandidate(node)"
                >+候选人</ElButton
              >
              <ElButton link type="danger" size="small" @click="removeNode(idx)">删除节点</ElButton>
            </div>
          </div>
        </template>
        <ArtSvgIcon class="flow-arrow" icon="ri:arrow-right-line" />
        <div class="flow-node flow-node--end">结束</div>
      </div>

      <template #footer>
        <ElButton @click="designerVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitDesign">部署流程</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import {
    fetchFlowDefinitions,
    fetchFlowDeploy,
    fetchFlowStart,
    fetchFlowStartBy,
    fetchFlowDesign,
    fetchDeptSelect,
    fetchFlowUserSelect
  } from '@/api/system-manage'
  import { fetchRoleCodeSelect } from '@/api/role'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FlowDef' })

  interface Candidate {
    type: string
    value: string
  }
  interface DesignNode {
    name: string
    candidates: Candidate[]
  }

  const tableData = ref<any[]>([])
  const roles = ref<any[]>([])
  const depts = ref<any[]>([])
  const users = ref<any[]>([])
  const designerVisible = ref(false)
  const design = reactive<{
    flowCode: string
    flowName: string
    nodes: DesignNode[]
  }>({
    flowCode: '',
    flowName: '',
    nodes: []
  })

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchFlowDefinitions()) || []
  }

  onMounted(async () => {
    await loadData()
    roles.value = (await fetchRoleCodeSelect()) || []
    depts.value = (await fetchDeptSelect()) || []
    users.value = (await fetchFlowUserSelect()) || []
  })

  const deploy = async (): Promise<void> => {
    await fetchFlowDeploy()
    ElMessage.success('部署成功')
    loadData()
  }

  const start = async (flowCode: string): Promise<void> => {
    const { value } = await ElMessageBox.prompt('请输入业务单号', `发起 - ${flowCode}`, {
      confirmButtonText: '发起',
      cancelButtonText: '取消',
      inputValue: flowCode.toUpperCase() + '-' + Date.now()
    })
    if (flowCode === 'leave') {
      await fetchFlowStart(value)
    } else {
      await fetchFlowStartBy(flowCode, value)
    }
    ElMessage.success('已发起，可在待办工作台处理')
  }

  const newNode = (name: string): DesignNode => ({
    name,
    candidates: [{ type: 'role', value: 'admin' }]
  })

  const openDesigner = (): void => {
    Object.assign(design, {
      flowCode: '',
      flowName: '',
      nodes: [newNode('部门审批')]
    })
    designerVisible.value = true
  }

  const addNode = (): void => {
    design.nodes.push(newNode('审批节点'))
  }

  const removeNode = (idx: number): void => {
    design.nodes.splice(idx, 1)
  }

  const addCandidate = (node: DesignNode): void => {
    node.candidates.push({ type: 'role', value: '' })
  }

  // 单个候选人 → storageId 前缀 token
  const candidateToken = (c: Candidate): string => {
    if (c.type === 'initiator') return 'initiator'
    if (c.type === 'deptLeader') return 'deptLeader'
    return c.value ? `${c.type}:${c.value}` : ''
  }

  const submitDesign = async (): Promise<void> => {
    if (!design.flowCode || !design.flowName) {
      ElMessage.warning('请填写流程编码与名称')
      return
    }
    if (!design.nodes.length) {
      ElMessage.warning('至少添加一个审批节点')
      return
    }
    const nodes = design.nodes.map((n) => ({
      name: n.name,
      candidates: n.candidates.map(candidateToken).filter(Boolean)
    }))
    if (nodes.some((n) => n.candidates.length === 0)) {
      ElMessage.warning('每个节点需选择候选人')
      return
    }
    await fetchFlowDesign({ flowCode: design.flowCode, flowName: design.flowName, nodes })
    ElMessage.success('流程已部署')
    designerVisible.value = false
    loadData()
  }
</script>

<style scoped>
  .flow-toolbar {
    margin-bottom: 12px;
  }

  .flow-diagram {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    padding: 20px 12px;
    margin-top: 8px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .flow-node {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    padding: 12px 14px;
    color: #fff;
    border-radius: 8px;
  }

  .flow-node--start {
    background: var(--el-color-success);
  }

  .flow-node--end {
    background: var(--el-color-info);
  }

  .flow-node--task {
    min-width: 170px;
    background: var(--el-color-primary);
  }

  .node-input {
    width: 150px;
  }

  .cand-row {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .cand-type {
    width: 96px;
  }

  .cand-val {
    width: 118px;
  }

  .node-ops {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .flow-arrow {
    font-size: 20px;
    color: var(--el-text-color-secondary);
  }
</style>
