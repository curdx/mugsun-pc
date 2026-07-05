<!-- 用户角色授权弹窗（对接 /system/user/grant，回显 /role-ids） -->
<template>
  <ElDialog v-model="dialogVisible" title="用户授权" width="440px" align-center>
    <ElCheckboxGroup v-model="checkedRoles">
      <div v-for="opt in roleOptions" :key="opt.value" class="role-item">
        <ElCheckbox :value="opt.value">{{ opt.label }}</ElCheckbox>
      </div>
    </ElCheckboxGroup>
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
  import { fetchRoleSelect, fetchUserRoleIds, fetchGrantUser } from '@/api/system-manage'

  interface Props {
    visible: boolean
    userData?: Record<string, any>
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

  const roleOptions = ref<Array<{ label: string; value: string }>>([])
  const checkedRoles = ref<Array<string | number>>([])

  watch(
    () => props.visible,
    async (visible) => {
      if (visible && props.userData?.id) {
        roleOptions.value = (await fetchRoleSelect()) || []
        checkedRoles.value = (await fetchUserRoleIds(props.userData.id)) || []
      }
    }
  )

  const handleSubmit = async (): Promise<void> => {
    if (!props.userData?.id) return
    await fetchGrantUser(props.userData.id, checkedRoles.value)
    ElMessage.success('授权成功')
    dialogVisible.value = false
    emit('success')
  }
</script>

<style scoped>
  .role-item {
    margin-bottom: 8px;
  }
</style>
