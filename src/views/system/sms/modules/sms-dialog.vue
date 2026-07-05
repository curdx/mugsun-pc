<!-- 短信配置新增/编辑弹窗（对接后端 /system/sms/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增短信' : '编辑短信'"
    width="520px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem label="名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入名称" />
      </ElFormItem>
      <ElFormItem label="配置标识" prop="smsCode">
        <ElInput v-model="formData.smsCode" placeholder="唯一标识，如 ali-main" />
      </ElFormItem>
      <ElFormItem label="供应商" prop="category">
        <ElSelect v-model="formData.category" style="width: 100%">
          <ElOption label="阿里云" value="alibaba" />
          <ElOption label="腾讯云" value="tencent" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="AccessKey" prop="accessKey">
        <ElInput v-model="formData.accessKey" placeholder="访问密钥 ID" />
      </ElFormItem>
      <ElFormItem label="SecretKey" prop="secretKey">
        <ElInput v-model="formData.secretKey" placeholder="访问密钥" show-password />
      </ElFormItem>
      <ElFormItem label="签名" prop="signature">
        <ElInput v-model="formData.signature" placeholder="短信签名" />
      </ElFormItem>
      <ElFormItem label="模板" prop="templateId">
        <ElInput v-model="formData.templateId" placeholder="模板 ID" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="formData.remark" type="textarea" placeholder="备注" />
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
    smsData?: Record<string, any>
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

  const defaults = (): Record<string, any> => ({
    id: undefined,
    name: '',
    smsCode: '',
    category: 'alibaba',
    accessKey: '',
    secretKey: '',
    signature: '',
    templateId: '',
    remark: ''
  })

  const formData = reactive<Record<string, any>>(defaults())

  const rules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    smsCode: [{ required: true, message: '请输入配置标识', trigger: 'blur' }],
    category: [{ required: true, message: '请选择供应商', trigger: 'change' }]
  }

  watch(
    () => [props.visible, props.smsData],
    ([visible]) => {
      if (visible) {
        Object.assign(formData, defaults(), props.smsData || {})
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
