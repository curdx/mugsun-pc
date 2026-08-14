<!-- 部门新增/编辑弹窗（对接后端 /system/dept/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? $t('pages.system.dept.addDept') : $t('pages.system.dept.editDept')"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem :label="$t('pages.system.dept.fields.parent')" prop="parentId">
        <ElSelect
          v-model="formData.parentId"
          :placeholder="$t('pages.system.dept.placeholder.parent')"
          style="width: 100%"
        >
          <ElOption :label="$t('pages.system.dept.topDept')" :value="0" />
          <ElOption
            v-for="opt in deptOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.dept.fields.deptName')" prop="deptName">
        <ElInput
          v-model="formData.deptName"
          :placeholder="$t('pages.system.dept.placeholder.deptName')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.dept.fields.sort')" prop="sort">
        <ElInputNumber v-model="formData.sort" :min="0" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">{{
          $t('table.form.submit')
        }}</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: string
    deptData?: Record<string, any>
    deptOptions?: Array<{ label: string; value: string }>
    /** 父级保存进行中（防重复提交） */
    saving?: boolean
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

  const formData = reactive<Record<string, any>>({
    id: undefined,
    parentId: 0,
    deptName: '',
    sort: 0
  })

  const rules = computed<FormRules>(() => ({
    deptName: [
      { required: true, message: t('pages.system.dept.placeholder.deptName'), trigger: 'blur' }
    ]
  }))

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
