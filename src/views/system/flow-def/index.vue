<!-- 流程定义管理 + 图形流程设计器（对接 /system/flow）：设计→绑定表单/字段权限→部署→发起（带业务数据）走通 -->
<template>
  <div class="flow-def-page art-full-height">
    <ElCard class="art-table-card">
      <div class="flow-toolbar">
        <ElButton type="primary" @click="openDesigner">设计流程</ElButton>
        <ElButton @click="deploy">部署请假流程</ElButton>
        <ElButton @click="() => start({ flowCode: 'leave' })">发起请假</ElButton>
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
            <ElButton link type="primary" @click="start(row)">发起</ElButton>
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
        <ElFormItem label="绑定表单">
          <ElSelect
            v-model="design.formKey"
            clearable
            filterable
            placeholder="可选，绑定业务表单（发起填写、办理按字段权限渲染）"
            style="width: 360px"
            @change="onFormChange"
          >
            <ElOption v-for="f in forms" :key="f.value" :label="f.label" :value="f.value" />
          </ElSelect>
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
              <ElButton
                v-if="design.formKey"
                link
                type="warning"
                size="small"
                @click="openPerms(node)"
                >字段权限</ElButton
              >
              <ElButton link type="danger" size="small" @click="removeNode(idx)">删除</ElButton>
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

    <!-- 节点字段权限配置 -->
    <ElDialog v-model="permsVisible" title="字段级权限" width="480px" align-center>
      <ElAlert
        type="info"
        :closable="false"
        title="办理该节点时，表单字段按此权限渲染（可写/只读/隐藏）"
        style="margin-bottom: 12px"
      />
      <ElTable :data="fields" border max-height="360">
        <ElTableColumn prop="title" label="字段" min-width="140" />
        <ElTableColumn prop="field" label="标识" min-width="120" />
        <ElTableColumn label="权限" width="140">
          <template #default="{ row }">
            <ElSelect v-model="permDraft[row.field]" size="small" style="width: 100%">
              <ElOption label="可写" value="WRITE" />
              <ElOption label="只读" value="READ" />
              <ElOption label="隐藏" value="NONE" />
            </ElSelect>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="!fields.length" description="该表单无可配置字段" :image-size="50" />
      <template #footer>
        <ElButton @click="permsVisible = false">取消</ElButton>
        <ElButton type="primary" @click="savePerms">保存</ElButton>
      </template>
    </ElDialog>

    <!-- 发起：带业务表单填写 -->
    <ElDialog
      v-model="startVisible"
      :title="`发起 - ${startCtx.flowName || startCtx.flowCode}`"
      width="600px"
      align-center
    >
      <ElForm label-width="90px">
        <ElFormItem label="业务单号" required>
          <ElInput v-model="startBusinessId" placeholder="业务单号" style="width: 320px" />
        </ElFormItem>
      </ElForm>
      <ApprovalForm
        v-if="startForm.schema"
        ref="startFormRef"
        :schema="startForm.schema"
        :option-json="startForm.option"
      />
      <template #footer>
        <ElButton @click="startVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="starting" @click="submitStart">发起</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import formCreate from '@form-create/element-ui'
  import ApprovalForm from '../flow-center/components/ApprovalForm.vue'
  import {
    fetchFlowDefinitions,
    fetchFlowDeploy,
    fetchFlowStart,
    fetchFlowStartBy,
    fetchFlowStartForm,
    fetchFlowDesign,
    fetchDeptSelect,
    fetchFlowUserSelect
  } from '@/api/system-manage'
  import { fetchRoleCodeSelect } from '@/api/role'
  import { fetchFormPage, fetchFormByKey } from '@/api/form'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'FlowDef' })

  interface Candidate {
    type: string
    value: string
  }
  interface DesignNode {
    name: string
    candidates: Candidate[]
    fieldPerms: Record<string, string>
  }

  const tableData = ref<any[]>([])
  const roles = ref<any[]>([])
  const depts = ref<any[]>([])
  const users = ref<any[]>([])
  const forms = ref<Array<{ label: string; value: string }>>([])

  const designerVisible = ref(false)
  const design = reactive<{
    flowCode: string
    flowName: string
    formKey: string
    nodes: DesignNode[]
  }>({ flowCode: '', flowName: '', formKey: '', nodes: [] })

  // 字段权限
  const permsVisible = ref(false)
  const fields = ref<Array<{ field: string; title: string }>>([])
  const permDraft = reactive<Record<string, string>>({})
  const permNode = ref<DesignNode | null>(null)

  // 发起表单
  const startVisible = ref(false)
  const starting = ref(false)
  const startBusinessId = ref('')
  const startCtx = reactive<{ flowCode: string; flowName: string }>({ flowCode: '', flowName: '' })
  const startForm = reactive<{ schema: string; option: string }>({ schema: '', option: '' })
  const startFormRef = ref<any>(null)

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchFlowDefinitions()) || []
  }

  onMounted(async () => {
    await loadData()
    roles.value = (await fetchRoleCodeSelect()) || []
    depts.value = (await fetchDeptSelect()) || []
    users.value = (await fetchFlowUserSelect()) || []
    const page = await fetchFormPage({ current: 1, size: 200 })
    forms.value = (page?.records || []).map((f: any) => ({ label: f.name, value: f.formKey }))
  })

  const deploy = async (): Promise<void> => {
    await fetchFlowDeploy()
    ElMessage.success('部署成功')
    loadData()
  }

  // ==================== 发起（带表单） ====================

  const start = async (row: { flowCode: string; flowName?: string }): Promise<void> => {
    startCtx.flowCode = row.flowCode
    startCtx.flowName = row.flowName || ''
    startBusinessId.value = row.flowCode.toUpperCase() + '-' + Date.now()
    startForm.schema = ''
    startForm.option = ''
    if (row.flowCode !== 'leave') {
      const f = await fetchFlowStartForm(row.flowCode)
      if (f?.hasForm) {
        startForm.schema = f.schema
        startForm.option = f.option || ''
      }
    }
    startVisible.value = true
  }

  const submitStart = async (): Promise<void> => {
    if (!startBusinessId.value) {
      ElMessage.warning('请填写业务单号')
      return
    }
    starting.value = true
    try {
      if (startCtx.flowCode === 'leave') {
        await fetchFlowStart(startBusinessId.value)
      } else {
        let variable: Record<string, any> | undefined
        if (startForm.schema && startFormRef.value) {
          try {
            await startFormRef.value.validate()
          } catch {
            ElMessage.warning('请完善表单必填项')
            return
          }
          variable = startFormRef.value.getFormData()
        }
        await fetchFlowStartBy(startCtx.flowCode, startBusinessId.value, { variable })
      }
      ElMessage.success('已发起，可在审批中心处理')
      startVisible.value = false
    } finally {
      starting.value = false
    }
  }

  // ==================== 设计器 ====================

  const newNode = (name: string): DesignNode => ({
    name,
    candidates: [{ type: 'role', value: 'admin' }],
    fieldPerms: {}
  })

  const openDesigner = (): void => {
    Object.assign(design, { flowCode: '', flowName: '', formKey: '', nodes: [newNode('部门审批')] })
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
  const onFormChange = (): void => {
    // 换表单后清空各节点已配的字段权限
    design.nodes.forEach((n) => (n.fieldPerms = {}))
  }

  // 解析 form-create schema 的字段列表（field + title）
  const parseFields = (schema: string): Array<{ field: string; title: string }> => {
    const list: Array<{ field: string; title: string }> = []
    const walk = (rules: any[]): void => {
      rules.forEach((r) => {
        if (r?.field) list.push({ field: r.field, title: r.title || r.field })
        if (Array.isArray(r?.children)) walk(r.children)
      })
    }
    try {
      walk(formCreate.parseJson(schema))
    } catch {
      /* 忽略解析异常 */
    }
    return list
  }

  const openPerms = async (node: DesignNode): Promise<void> => {
    permNode.value = node
    const detail = await fetchFormByKey(design.formKey)
    fields.value = parseFields(detail?.formSchema || '')
    Object.keys(permDraft).forEach((k) => delete permDraft[k])
    fields.value.forEach((f) => (permDraft[f.field] = node.fieldPerms[f.field] || 'WRITE'))
    permsVisible.value = true
  }

  const savePerms = (): void => {
    if (permNode.value) {
      // 仅保存非默认（非 WRITE）权限，减少冗余
      const perms: Record<string, string> = {}
      Object.entries(permDraft).forEach(([f, p]) => {
        if (p && p !== 'WRITE') perms[f] = p
      })
      permNode.value.fieldPerms = perms
    }
    permsVisible.value = false
  }

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
      candidates: n.candidates.map(candidateToken).filter(Boolean),
      fieldPerms: n.fieldPerms
    }))
    if (nodes.some((n) => n.candidates.length === 0)) {
      ElMessage.warning('每个节点需选择候选人')
      return
    }
    await fetchFlowDesign({
      flowCode: design.flowCode,
      flowName: design.flowName,
      formKey: design.formKey || null,
      nodes
    })
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
    gap: 6px;
    margin-top: 2px;
  }

  .flow-arrow {
    font-size: 20px;
    color: var(--el-text-color-secondary);
  }
</style>
