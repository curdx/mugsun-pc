<!-- 角色菜单授权弹窗（对接后端 /system/role/grant，el-tree 勾选 + /menu-ids 回显） -->
<template>
  <ElDialog v-model="dialogVisible" title="菜单授权" width="460px" align-center>
    <ElTree
      ref="treeRef"
      :data="menuTree"
      node-key="id"
      show-checkbox
      default-expand-all
      :props="{ label: 'menuName', children: 'children' }"
    />
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">保存</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchMenuTree, fetchRoleMenuIds, fetchGrantRole } from '@/api/system-manage'

  interface Props {
    visible: boolean
    roleData?: Record<string, any>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const treeRef = ref<any>()
  const menuTree = ref<any[]>([])

  watch(
    () => props.visible,
    async (visible) => {
      if (visible && props.roleData?.id) {
        menuTree.value = (await fetchMenuTree()) || []
        const checkedIds = (await fetchRoleMenuIds(props.roleData.id)) || []
        nextTick(() => treeRef.value?.setCheckedKeys(checkedIds, false))
      }
    }
  )

  const handleSubmit = async () => {
    if (!treeRef.value || !props.roleData?.id) return
    const menuIds = [...treeRef.value.getCheckedKeys(false), ...treeRef.value.getHalfCheckedKeys()]
    await fetchGrantRole(props.roleData.id, menuIds)
    ElMessage.success('授权成功')
    dialogVisible.value = false
    emit('success')
  }
</script>
