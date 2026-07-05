<!-- 岗位新增/编辑弹窗（对接后端 /system/post/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增岗位' : '编辑岗位'"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="岗位名称" prop="postName">
        <ElInput v-model="formData.postName" placeholder="请输入岗位名称" />
      </ElFormItem>
      <ElFormItem label="岗位编码" prop="postCode">
        <ElInput v-model="formData.postCode" placeholder="请输入岗位编码" />
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="formData.sort" :min="0" />
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
    postData?: Record<string, any>
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
    postName: '',
    postCode: '',
    sort: 0
  })

  const rules: FormRules = {
    postName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
    postCode: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.postData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, postName: '', postCode: '', sort: 0 },
          props.postData || {}
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
