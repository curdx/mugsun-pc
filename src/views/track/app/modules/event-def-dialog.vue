<!-- 事件定义编辑弹窗（对接后端 /system/track/event-def/submit；仅显示名/描述/负责人/状态可改） -->
<template>
  <ElDialog v-model="dialogVisible" title="编辑事件定义" width="520px" align-center>
    <ElForm ref="formRef" :model="formData" label-width="96px">
      <ElFormItem label="事件名">
        <ElInput :model-value="formData.eventName" disabled />
      </ElFormItem>
      <ElFormItem label="显示名" prop="displayName">
        <ElInput v-model="formData.displayName" placeholder="请输入显示名" />
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </ElFormItem>
      <ElFormItem label="负责人" prop="owner">
        <ElInput v-model="formData.owner" placeholder="请输入负责人" />
      </ElFormItem>
      <ElFormItem label="启用" prop="status">
        <ElSwitch v-model="formData.status" :active-value="1" :inactive-value="0" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  interface Props {
    visible: boolean
    defData?: Record<string, any>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', form: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formData = reactive<Record<string, any>>({
    id: undefined,
    eventName: '',
    displayName: '',
    description: '',
    owner: '',
    status: 1
  })

  watch(
    () => [props.visible, props.defData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, eventName: '', displayName: '', description: '', owner: '', status: 1 },
          props.defData || {}
        )
      }
    },
    { immediate: true }
  )

  const handleSubmit = () => {
    emit('submit', { ...formData })
  }
</script>
