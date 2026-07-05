<!-- 参数管理页面 -->
<template>
  <div class="param-page art-full-height">
    <ElCard class="art-table-card">
      <div class="param-toolbar">
        <ElButton @click="showDialog('add')" v-ripple>新增参数</ElButton>
      </div>

      <ElTable :data="tableData" border>
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="paramName" label="参数名称" min-width="160" />
        <ElTableColumn prop="paramKey" label="参数键" min-width="180" />
        <ElTableColumn prop="paramValue" label="参数值" min-width="160" />
        <ElTableColumn prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <ElTableColumn label="操作" width="160">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ParamDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :param-data="currentData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchParamList, fetchSaveParam, fetchRemoveParam } from '@/api/system-manage'
  import ParamDialog from './modules/param-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Param' })

  const tableData = ref<any[]>([])
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    tableData.value = (await fetchParamList()) || []
  }

  onMounted(loadData)

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = row ? { ...row } : {}
    dialogVisible.value = true
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除参数"${row.paramName}"吗？`, '删除参数', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveParam(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveParam(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  }
</script>

<style scoped>
  .param-toolbar {
    margin-bottom: 12px;
  }
</style>
