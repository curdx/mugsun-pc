<!-- 邮件模板新增/编辑弹窗（对接后端 /system/mail-template/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增模板' : '编辑模板'"
    width="560px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="模板编码" prop="code">
        <ElInput v-model="formData.code" :disabled="type === 'edit'" placeholder="如 login_2fa" />
      </ElFormItem>
      <ElFormItem label="模板名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入模板名称" />
      </ElFormItem>
      <ElFormItem label="邮件主题" prop="subject">
        <ElInput v-model="formData.subject" placeholder="请输入邮件主题" />
      </ElFormItem>
      <ElFormItem label="邮件内容" prop="content">
        <ElInput
          v-model="formData.content"
          type="textarea"
          :rows="4"
          placeholder="支持 ${key} 占位，如 您的验证码是 ${code}"
        />
      </ElFormItem>
      <ElFormItem label="状态">
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
    type: string
    templateData?: Record<string, any>
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
    code: '',
    name: '',
    subject: '',
    content: '',
    status: 1
  })

  const rules: FormRules = {
    code: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
    name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
    subject: [{ required: true, message: '请输入邮件主题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入邮件内容', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.templateData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, code: '', name: '', subject: '', content: '', status: 1 },
          props.templateData || {}
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
