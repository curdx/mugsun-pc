<!-- 流程定义管理页（对接后端 /system/flow） -->
<template>
  <div class="flow-def-page art-full-height">
    <ElCard class="art-table-card">
      <div class="flow-toolbar">
        <ElButton type="primary" @click="deploy">部署请假流程</ElButton>
        <ElButton @click="start">发起请假</ElButton>
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
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchFlowDefinitions, fetchFlowDeploy, fetchFlowStart } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'FlowDef' })

  const tableData = ref<any[]>([])

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchFlowDefinitions()) || []
  }

  onMounted(loadData)

  const deploy = async (): Promise<void> => {
    await fetchFlowDeploy()
    ElMessage.success('部署成功')
    loadData()
  }

  const start = async (): Promise<void> => {
    const { value } = await ElMessageBox.prompt('请输入业务单号', '发起请假', {
      confirmButtonText: '发起',
      cancelButtonText: '取消',
      inputValue: 'LEAVE-' + Date.now()
    })
    await fetchFlowStart(value)
    ElMessage.success('已发起，可在待办工作台处理')
  }
</script>

<style scoped>
  .flow-toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }
</style>
