<!-- 流程设计中心：图形设计器（条件分支/并行/会签递归树）+ 流程定义版本/发布/停用/分类管理 -->
<template>
  <div class="flow-graph-page art-full-height">
    <ElCard class="art-table-card">
      <div class="fg-toolbar">
        <ElButton type="primary" @click="openDesigner">图形设计流程</ElButton>
        <ElButton :loading="loading" @click="loadDefs">刷新</ElButton>
      </div>

      <ElTable :data="defs" border :loading="loading">
        <ElTableColumn type="index" label="序号" width="56" />
        <ElTableColumn prop="flowCode" label="流程编码" min-width="130" />
        <ElTableColumn prop="flowName" label="流程名称" min-width="140" />
        <ElTableColumn label="分类" width="100">
          <template #default="{ row }">{{ row.category || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="version" label="版本" width="70" />
        <ElTableColumn label="发布" width="90">
          <template #default="{ row }">
            <ElTag :type="publishTag(row.isPublish)" size="small">{{
              publishText(row.isPublish)
            }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="String(row.activityStatus) === '1' ? 'success' : 'info'" size="small">
              {{ String(row.activityStatus) === '1' ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" min-width="170" />
        <ElTableColumn label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="String(row.activityStatus) === '1'"
              link
              type="warning"
              @click="act('suspend', row)"
              >停用</ElButton
            >
            <ElButton v-else link type="success" @click="act('active', row)">启用</ElButton>
            <ElButton link type="primary" @click="act('copy', row)">复制新版本</ElButton>
            <ElButton link type="danger" @click="act('remove', row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 图形设计器 -->
    <ElDialog v-model="designerVisible" title="图形流程设计器" fullscreen>
      <ElForm :model="design" inline label-width="80px" class="fg-form">
        <ElFormItem label="流程编码" required>
          <ElInput v-model="design.flowCode" placeholder="英文标识" style="width: 180px" />
        </ElFormItem>
        <ElFormItem label="流程名称" required>
          <ElInput v-model="design.flowName" placeholder="如 采购分支审批" style="width: 200px" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElInput v-model="design.category" placeholder="可选" style="width: 140px" />
        </ElFormItem>
      </ElForm>

      <div class="fg-canvas">
        <div class="fg-terminal fg-terminal--start">开始</div>
        <GraphChain :nodes="design.nodes" />
        <div class="fg-terminal fg-terminal--end">结束</div>
      </div>

      <template #footer>
        <ElButton @click="designerVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitDesign">部署流程</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, provide, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import GraphChain from './GraphChain.vue'
  import { newNode, toTree, validateTree, type GNode } from './graph-model'
  import {
    fetchFlowDefinitions,
    fetchFlowDesignGraph,
    fetchFlowDefActive,
    fetchFlowDefSuspend,
    fetchFlowDefCopy,
    fetchFlowDefRemove,
    fetchDeptSelect,
    fetchFlowUserSelect
  } from '@/api/system-manage'
  import { fetchRoleCodeSelect } from '@/api/role'

  defineOptions({ name: 'FlowGraph' })

  const reg = reactive<{ roles: any[]; depts: any[]; users: any[] }>({
    roles: [],
    depts: [],
    users: []
  })
  provide('flowReg', reg)

  const defs = ref<any[]>([])
  const loading = ref(false)
  const designerVisible = ref(false)
  const submitting = ref(false)
  const design = reactive<{ flowCode: string; flowName: string; category: string; nodes: GNode[] }>(
    {
      flowCode: '',
      flowName: '',
      category: '',
      nodes: []
    }
  )

  const loadDefs = async (): Promise<void> => {
    loading.value = true
    try {
      defs.value = (await fetchFlowDefinitions()) || []
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await loadDefs()
    reg.roles = (await fetchRoleCodeSelect()) || []
    reg.depts = (await fetchDeptSelect()) || []
    reg.users = (await fetchFlowUserSelect()) || []
  })

  const openDesigner = (): void => {
    Object.assign(design, {
      flowCode: '',
      flowName: '',
      category: '',
      nodes: [newNode('approval')]
    })
    designerVisible.value = true
  }

  const submitDesign = async (): Promise<void> => {
    if (!design.flowCode || !design.flowName) {
      ElMessage.warning('请填写流程编码与名称')
      return
    }
    if (!design.nodes.length) {
      ElMessage.warning('至少设计一个节点')
      return
    }
    const err = validateTree(design.nodes)
    if (err) {
      ElMessage.warning(err)
      return
    }
    submitting.value = true
    try {
      await fetchFlowDesignGraph({
        flowCode: design.flowCode,
        flowName: design.flowName,
        category: design.category || null,
        root: toTree(design.nodes)
      })
      ElMessage.success('流程已部署')
      designerVisible.value = false
      loadDefs()
    } finally {
      submitting.value = false
    }
  }

  const ACTIONS: Record<string, { api: (id: any) => Promise<any>; ok: string; confirm?: string }> =
    {
      suspend: { api: fetchFlowDefSuspend, ok: '已停用' },
      active: { api: fetchFlowDefActive, ok: '已启用' },
      copy: { api: fetchFlowDefCopy, ok: '已复制新版本' },
      remove: {
        api: (id) => fetchFlowDefRemove([id]),
        ok: '已删除',
        confirm: '确认删除该流程定义？'
      }
    }

  const act = async (key: string, row: any): Promise<void> => {
    const a = ACTIONS[key]
    if (a.confirm) {
      await ElMessageBox.confirm(a.confirm, '提示', { type: 'warning' })
    }
    await a.api(row.id)
    ElMessage.success(a.ok)
    loadDefs()
  }

  const publishText = (s: any): string =>
    ({ '0': '未发布', '1': '已发布', '9': '已失效' })[String(s)] || '未知'
  const publishTag = (s: any): 'success' | 'info' | 'warning' =>
    String(s) === '1' ? 'success' : String(s) === '9' ? 'warning' : 'info'
</script>

<style scoped>
  .fg-toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .fg-form {
    margin-bottom: 12px;
  }

  .fg-canvas {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    overflow: auto;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .fg-terminal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90px;
    padding: 10px;
    color: #fff;
    border-radius: 18px;
  }

  .fg-terminal--start {
    background: var(--el-color-success);
  }

  .fg-terminal--end {
    background: var(--el-color-info);
  }
</style>
