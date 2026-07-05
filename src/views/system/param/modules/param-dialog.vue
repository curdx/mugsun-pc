<!-- 参数新增/编辑弹窗（对接后端 /system/param/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增参数' : '编辑参数'"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="参数名称" prop="paramName">
        <ElInput v-model="formData.paramName" placeholder="请输入参数名称" />
      </ElFormItem>
      <ElFormItem label="参数键" prop="paramKey">
        <ElInput v-model="formData.paramKey" placeholder="请输入参数键" />
      </ElFormItem>
      <ElFormItem label="参数值" prop="paramValue">
        <ElInput v-model="formData.paramValue" placeholder="请输入参数值" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="formData.remark" type="textarea" placeholder="请输入备注" />
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
    type: string
    paramData?: Record<string, any>
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
    paramName: '',
    paramKey: '',
    paramValue: '',
    remark: ''
  })

  const rules: FormRules = {
    paramName: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
    paramKey: [{ required: true, message: '请输入参数键', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.paramData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, paramName: '', paramKey: '', paramValue: '', remark: '' },
          props.paramData || {}
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
