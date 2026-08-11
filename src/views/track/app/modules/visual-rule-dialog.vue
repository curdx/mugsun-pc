<!-- 圈选规则编辑弹窗（对接后端 /system/track/visual/rule/submit；
     eventName/routePath/matchText/status 可改，selector 只读——改 selector = 重新圈选） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    title="编辑圈选规则"
    width="520px"
    align-center
    class="track-visual-rule-dialog"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="96px">
      <ElFormItem label="事件名" prop="eventName">
        <ElInput v-model="formData.eventName" placeholder="字母开头，仅字母/数字/下划线" />
      </ElFormItem>
      <ElFormItem label="选择器">
        <ElInput :model-value="formData.selector" disabled class="track-visual-selector" />
      </ElFormItem>
      <ElFormItem label="路由路径" prop="routePath">
        <ElInput v-model="formData.routePath" clearable placeholder="留空表示全站生效" />
      </ElFormItem>
      <ElFormItem label="匹配文本" prop="matchText">
        <ElInput v-model="formData.matchText" clearable placeholder="留空表示不限元素文本" />
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
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    ruleData?: Record<string, any>
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

  const formRef = ref<FormInstance>()

  const formData = reactive<Record<string, any>>({
    id: undefined,
    eventName: '',
    selector: '',
    routePath: '',
    matchText: '',
    status: 1
  })

  // 与后端 CUSTOM_EVENT_NAME 同正则（$ 前缀必拒，最长 64 位）
  const EVENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/

  const rules: FormRules = {
    eventName: [
      { required: true, message: '请输入事件名', trigger: 'blur' },
      {
        pattern: EVENT_NAME_PATTERN,
        message: '字母开头，仅字母/数字/下划线，最长 64 位',
        trigger: 'blur'
      }
    ]
  }

  watch(
    () => [props.visible, props.ruleData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, eventName: '', selector: '', routePath: '', matchText: '', status: 1 },
          props.ruleData || {}
        )
        nextTick(() => formRef.value?.clearValidate())
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        emit('submit', { ...formData })
      }
    })
  }
</script>

<style scoped>
  /* 选择器只读展示：等宽字体，输入框本体在 ElInput 子组件内需 :deep() */
  .track-visual-selector :deep(.el-input__inner) {
    font-family: monospace;
    font-size: 12px;
  }
</style>

<!-- 弹窗内容 teleport 到 body，非 scoped 类限定滚动（同 track-app-dialog 范式） -->
<style>
  .track-visual-rule-dialog .el-dialog__body {
    max-height: 72vh;
    overflow-y: auto;
  }
</style>
