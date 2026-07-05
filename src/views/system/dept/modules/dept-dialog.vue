<!-- 部门新增/编辑弹窗（对接后端 /system/dept/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增部门' : '编辑部门'"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="上级部门" prop="parentId">
        <ElSelect v-model="formData.parentId" placeholder="请选择上级部门" style="width: 100%">
          <ElOption label="顶级部门" :value="0" />
          <ElOption
            v-for="opt in deptOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="部门名称" prop="deptName">
        <ElInput v-model="formData.deptName" placeholder="请输入部门名称" />
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
    deptData?: Record<string, any>
    deptOptions?: Array<{ label: string; value: string }>
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
    parentId: 0,
    deptName: '',
    sort: 0
  })

  const rules: FormRules = {
    deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
  }

  watch(
    () => [props.visible, props.deptData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, parentId: 0, deptName: '', sort: 0 },
          props.deptData || {}
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
