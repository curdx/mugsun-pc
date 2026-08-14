<!-- 短信配置新增/编辑弹窗（对接后端 /system/sms/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? $t('pages.system.sms.addBtn') : $t('pages.system.sms.editTitle')"
    width="520px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem :label="$t('pages.system.sms.colName')" prop="name">
        <ElInput v-model="formData.name" :placeholder="$t('pages.system.sms.namePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.sms.colCode')" prop="smsCode">
        <ElInput v-model="formData.smsCode" :placeholder="$t('pages.system.sms.codePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.sms.colCategory')" prop="category">
        <ElSelect v-model="formData.category" style="width: 100%">
          <ElOption :label="$t('pages.system.sms.categoryAlibaba')" value="alibaba" />
          <ElOption :label="$t('pages.system.sms.categoryTencent')" value="tencent" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="AccessKey" prop="accessKey">
        <ElInput
          v-model="formData.accessKey"
          :placeholder="$t('pages.system.sms.accessKeyPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem label="SecretKey" prop="secretKey">
        <ElInput
          v-model="formData.secretKey"
          :placeholder="$t('pages.system.sms.secretKeyPlaceholder')"
          show-password
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.sms.colSignature')" prop="signature">
        <ElInput
          v-model="formData.signature"
          :placeholder="$t('pages.system.sms.signaturePlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.sms.colTemplate')" prop="templateId">
        <ElInput
          v-model="formData.templateId"
          :placeholder="$t('pages.system.sms.templatePlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.sms.remarkLabel')">
        <ElInput
          v-model="formData.remark"
          type="textarea"
          :placeholder="$t('pages.system.sms.remarkLabel')"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{
          $t('pages.system.sms.submitBtn')
        }}</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'

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

  const { t } = useI18n()

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
    name: [{ required: true, message: t('pages.system.sms.namePlaceholder'), trigger: 'blur' }],
    smsCode: [{ required: true, message: t('pages.system.sms.ruleCode'), trigger: 'blur' }],
    category: [{ required: true, message: t('pages.system.sms.ruleCategory'), trigger: 'change' }]
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
