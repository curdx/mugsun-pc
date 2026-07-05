<!-- 菜单管理页面（树形 CRUD） -->
<template>
  <div class="menu-page art-full-height">
    <ElCard class="art-table-card">
      <div class="menu-toolbar">
        <ElButton @click="showDialog('add')" v-ripple>新增菜单</ElButton>
      </div>

      <ElTable :data="treeData" row-key="id" default-expand-all border>
        <ElTableColumn prop="menuName" label="菜单名称" min-width="200" />
        <ElTableColumn label="类型" width="90">
          <template #default="{ row }">{{ TYPE_LABELS[row.menuType] ?? row.menuType }}</template>
        </ElTableColumn>
        <ElTableColumn prop="path" label="路由地址" min-width="160" />
        <ElTableColumn prop="permission" label="权限标识" min-width="160" />
        <ElTableColumn prop="sort" label="排序" width="80" />
        <ElTableColumn label="操作" width="240">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showDialog('add', row)">新增下级</ElButton>
            <ElButton link type="primary" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="danger" @click="deleteRow(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :menu-data="currentData"
        :menu-tree="treeData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchMenuTree, fetchSaveMenu, fetchRemoveMenu } from '@/api/system-manage'
  import MenuDialog from './modules/menu-dialog.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { DialogType } from '@/types'

  defineOptions({ name: 'Menus' })

  const TYPE_LABELS: Record<string, string> = { M: '目录', C: '菜单', F: '按钮' }

  const treeData = ref<any[]>([])
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentData = ref<Record<string, any>>({})

  const loadData = async (): Promise<void> => {
    treeData.value = (await fetchMenuTree()) || []
  }

  onMounted(loadData)

  const showDialog = (type: DialogType, row?: Record<string, any>): void => {
    dialogType.value = type
    currentData.value = type === 'add' ? { parentId: row?.id ?? 0 } : { ...row }
    dialogVisible.value = true
  }

  const deleteRow = (row: any): void => {
    ElMessageBox.confirm(`确定删除菜单"${row.menuName}"吗？`, '删除菜单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveMenu(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }

  const handleDialogSubmit = async (form: Record<string, any>): Promise<void> => {
    await fetchSaveMenu(form)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  }
</script>

<style scoped>
  .menu-toolbar {
    margin-bottom: 12px;
  }
</style>
