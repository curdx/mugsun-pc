<!-- 用户角色授权弹窗（对接 /system/user/grant，回显 /role-ids） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="$t('pages.system.user.grantTitle')"
    width="440px"
    align-center
  >
    <ElCheckboxGroup v-model="checkedRoles" class="role-list">
      <div v-for="opt in roleOptions" :key="opt.value" class="role-item">
        <ElCheckbox :value="opt.value">{{ opt.label }}</ElCheckbox>
      </div>
    </ElCheckboxGroup>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">{{
          $t('pages.system.user.save')
        }}</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { fetchRoleSelect } from '@/api/role'
  import { fetchUserRoleIds, grantUser } from '@/api/user'

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

  const { t } = useI18n()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const roleOptions = ref<Array<{ label: string; value: string }>>([])
  const checkedRoles = ref<Array<string | number>>([])
  const submitting = ref(false)

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
    submitting.value = true
    try {
      await grantUser(props.userData.id, checkedRoles.value)
      ElMessage.success(t('pages.system.user.grantSuccess'))
      dialogVisible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped>
  /* 角色多时列表限高内滚，防弹窗超高顶出视口 */
  .role-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .role-item {
    margin-bottom: 8px;
  }
</style>
