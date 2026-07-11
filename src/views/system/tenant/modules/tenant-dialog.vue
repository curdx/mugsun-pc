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
          placeholder="选择过期时间（留空永不过期）"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="账号上限" prop="accountCount">
        <ElInputNumber v-model="formData.accountCount" :min="-1" :step="1" style="width: 100%" />
        <span class="form-tip">-1 表示不限制</span>
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="formData.status">
          <ElRadio :value="1">正常</ElRadio>
          <ElRadio :value="0">停用</ElRadio>
        </ElRadioGroup>
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
    expireTime: '',
    accountCount: -1,
    status: 1
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
          expireTime: r?.expireTime ?? '',
          accountCount: r?.accountCount ?? -1,
          status: r?.status ?? 1
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

<style scoped>
  .form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
