<!-- 用户新增/编辑弹窗（对接后端 /system/user/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增用户' : '编辑用户'"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="用户名" prop="username">
        <ElInput
          v-model="formData.username"
          :disabled="type === 'edit'"
          placeholder="请输入用户名"
        />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickname">
        <ElInput v-model="formData.nickname" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="formData.phone" placeholder="请输入手机号（展示脱敏）" />
      </ElFormItem>
      <ElFormItem label="身份证" prop="idCard">
        <ElInput v-model="formData.idCard" placeholder="请输入身份证号（加密存储）" />
      </ElFormItem>
      <ElFormItem v-if="type === 'add'" label="密码" prop="password">
        <ElInput
          v-model="formData.password"
          type="password"
          placeholder="默认 123456"
          show-password
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
    userData?: Record<string, any>
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
    username: '',
    nickname: '',
    password: '',
    phone: '',
    idCard: '',
    status: 1
  })

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.userData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          {
            id: undefined,
            username: '',
            nickname: '',
            password: '',
            phone: '',
            idCard: '',
            status: 1
          },
          props.userData || {}
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
