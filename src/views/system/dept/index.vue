<!-- 部门管理页面（树形 CRUD） -->
<template>
  <div class="dept-page art-full-height">
    <ElCard class="art-table-card">
      <div class="dept-toolbar">
        <ElButton @click="showDialog('add')" v-ripple>新增部门</ElButton>
      </div>

      <ElTable :data="treeData" row-key="id" default-expand-all border>
        <ElTableColumn prop="deptName" label="部门名称" min-width="220" />
        <ElTableColumn prop="sort" label="排序" width="100" />
        <ElTableColumn prop="createTime" label="创建时间" min-width="180" />
        <ElTableColumn label="操作" width="240">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showDialog('add', row)">新增下级</ElButton>
            <ElButton link type="primary" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <DeptDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :dept-data="currentData"
        :dept-options="deptOptions"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import {
    fetchDeptTree,
    fetchDeptSelect,
    fetchSaveDept,
    fetchRemoveDept
  } from '@/api/system-manage'
  import DeptDialog from './modules/dept-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Dept' })

  const treeData = ref<any[]>([])
  const deptOptions = ref<Array<{ label: string; value: string }>>([])
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    treeData.value = (await fetchDeptTree()) || []
    deptOptions.value = (await fetchDeptSelect()) || []
  }

  onMounted(loadData)

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = type === 'add' ? { parentId: row?.id ?? 0 } : { ...row }
    dialogVisible.value = true
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm('确定要删除该部门吗？', '删除部门', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveDept(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveDept(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  }
</script>

<style scoped>
  .dept-toolbar {
    margin-bottom: 12px;
  }
</style>
