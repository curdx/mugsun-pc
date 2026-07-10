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
          <span class="flow-arrow">→</span>
          <div class="flow-node flow-node--task">
            <ElInput v-model="node.name" size="small" placeholder="节点名称" class="node-input" />
            <ElSelect v-model="node.role" size="small" placeholder="审批角色" class="node-input">
              <ElOption v-for="r in roles" :key="r.value" :label="r.label" :value="r.value" />
            </ElSelect>
            <ElButton link type="danger" size="small" @click="removeNode(idx)">删除</ElButton>
          </div>
        </template>
        <span class="flow-arrow">→</span>
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
    fetchRoleCodeSelect
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FlowDef' })

  const tableData = ref<any[]>([])
  const roles = ref<any[]>([])
  const designerVisible = ref(false)
  const design = reactive<{
    flowCode: string
    flowName: string
    nodes: Array<{ name: string; role: string }>
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

  const openDesigner = (): void => {
    Object.assign(design, {
      flowCode: '',
      flowName: '',
      nodes: [{ name: '部门审批', role: 'admin' }]
    })
    designerVisible.value = true
  }

  const addNode = (): void => {
    design.nodes.push({ name: '审批节点', role: roles.value[0]?.value ?? 'admin' })
  }

  const removeNode = (idx: number): void => {
    design.nodes.splice(idx, 1)
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
    await fetchFlowDesign({
      flowCode: design.flowCode,
      flowName: design.flowName,
      nodes: design.nodes
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

  .flow-arrow {
    font-size: 20px;
    color: var(--el-text-color-secondary);
  }
</style>
