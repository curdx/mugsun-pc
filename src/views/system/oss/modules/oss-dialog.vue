<!-- 存储配置新增/编辑弹窗（对接后端 /system/oss/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增存储' : '编辑存储'"
    width="520px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem label="名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入名称" />
      </ElFormItem>
      <ElFormItem label="存储标识" prop="ossCode">
        <ElInput v-model="formData.ossCode" placeholder="唯一标识，如 local-a" />
      </ElFormItem>
      <ElFormItem label="类型" prop="category">
        <ElSelect v-model="formData.category" style="width: 100%">
          <ElOption label="本地存储" value="local" />
          <ElOption label="MinIO" value="minio" />
          <ElOption label="阿里云 OSS" value="aliyun" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="formData.category === 'local'" label="存储路径" prop="storagePath">
        <ElInput v-model="formData.storagePath" placeholder="绝对路径，如 /tmp/mugsun-oss-a/" />
      </ElFormItem>
      <template v-else>
        <ElFormItem label="Endpoint">
          <ElInput v-model="formData.endpoint" placeholder="服务端点" />
        </ElFormItem>
        <ElFormItem label="Bucket">
          <ElInput v-model="formData.bucketName" placeholder="桶名称" />
        </ElFormItem>
        <ElFormItem label="AccessKey">
          <ElInput v-model="formData.accessKey" placeholder="访问密钥" />
        </ElFormItem>
        <ElFormItem label="SecretKey">
          <ElInput v-model="formData.secretKey" placeholder="密钥" show-password />
        </ElFormItem>
      </template>
      <ElFormItem label="访问域名">
        <ElInput v-model="formData.domain" placeholder="外链域名（可选）" />
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
    ossData?: Record<string, any>
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
    ossCode: '',
    category: 'local',
    endpoint: '',
    accessKey: '',
    secretKey: '',
    bucketName: '',
    domain: '',
    storagePath: '',
    remark: ''
  })

  const formData = reactive<Record<string, any>>(defaults())

  const rules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    ossCode: [{ required: true, message: '请输入存储标识', trigger: 'blur' }],
    category: [{ required: true, message: '请选择类型', trigger: 'change' }]
  }

  watch(
    () => [props.visible, props.ossData],
    ([visible]) => {
      if (visible) {
        Object.assign(formData, defaults(), props.ossData || {})
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
