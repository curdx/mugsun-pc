<!-- 租户新增/编辑弹窗（create 一键初始化默认数据；update 仅改信息与套餐分配） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑租户' : '新增租户'"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem label="租户名称" prop="tenantName">
        <ElInput v-model="formData.tenantName" placeholder="请输入租户名称" />
      </ElFormItem>
      <ElFormItem label="联系人" prop="contactUser">
        <ElInput v-model="formData.contactUser" placeholder="请输入联系人" />
      </ElFormItem>
      <ElFormItem label="联系电话" prop="contactPhone">
        <ElInput v-model="formData.contactPhone" placeholder="请输入联系电话" />
      </ElFormItem>
      <ElFormItem label="套餐" prop="packageId">
        <ElSelect v-model="formData.packageId" clearable placeholder="不限功能" style="width: 100%">
          <ElOption v-for="p in packages" :key="p.id" :label="p.name" :value="p.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="过期时间" prop="expireTime">
        <ElDatePicker
          v-model="formData.expireTime"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
          placeholder="选择过期时间"
          style="width: 100%"
        />
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
    row?: Record<string, any> | null
    packages?: any[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', form: Record<string, any>): void
  }

  const props = withDefaults(defineProps<Props>(), { row: null, packages: () => [] })
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const isEdit = computed(() => !!props.row?.id)
  const formRef = ref<FormInstance>()

  const formData = reactive<Record<string, any>>({
    id: null,
    tenantName: '',
    contactUser: '',
    contactPhone: '',
    packageId: null,
    expireTime: ''
  })

  const rules: FormRules = {
    tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }]
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        const r = props.row
        Object.assign(formData, {
          id: r?.id ?? null,
          tenantName: r?.tenantName ?? '',
          contactUser: r?.contactUser ?? '',
          contactPhone: r?.contactPhone ?? '',
          packageId: r?.packageId ?? null,
          expireTime: r?.expireTime ?? ''
        })
        nextTick(() => formRef.value?.clearValidate())
      }
    }
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
