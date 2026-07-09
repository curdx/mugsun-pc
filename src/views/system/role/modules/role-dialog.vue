<!-- 角色新增/编辑弹窗（对接后端 /system/role/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增角色' : '编辑角色'"
    width="500px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="角色名称" prop="roleName">
        <ElInput v-model="formData.roleName" placeholder="请输入角色名称" />
      </ElFormItem>
      <ElFormItem label="角色编码" prop="roleCode">
        <ElInput v-model="formData.roleCode" placeholder="请输入角色编码" />
      </ElFormItem>
      <ElFormItem label="数据范围" prop="dataScope">
        <ElSelect v-model="formData.dataScope" style="width: 100%">
          <ElOption label="全部数据" :value="1" />
          <ElOption label="本部门数据" :value="2" />
          <ElOption label="本部门及子部门" :value="3" />
          <ElOption label="仅本人数据" :value="4" />
          <ElOption label="自定义部门" :value="5" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="formData.dataScope === 5" label="可见部门" prop="deptIds">
        <ElTreeSelect
          v-model="formData.deptIds"
          :data="deptTree"
          multiple
          show-checkbox
          check-strictly
          node-key="id"
          :props="{ label: 'deptName', children: 'children' }"
          :render-after-expand="false"
          placeholder="请选择可见部门"
          style="width: 100%"
        />
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
  import { fetchDeptTree, fetchRoleDeptIds } from '@/api/system-manage'

  interface Props {
    visible: boolean
    type: string
    roleData?: Record<string, any>
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
  const deptTree = ref<any[]>([])

  const formData = reactive<Record<string, any>>({
    id: undefined,
    roleName: '',
    roleCode: '',
    dataScope: 1,
    deptIds: [],
    sort: 0
  })

  const rules: FormRules = {
    roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
    roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
  }

  const loadDeptTree = async () => {
    if (!deptTree.value.length) {
      deptTree.value = (await fetchDeptTree()) || []
    }
  }

  watch(
    () => [props.visible, props.roleData],
    async ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          { id: undefined, roleName: '', roleCode: '', dataScope: 1, deptIds: [], sort: 0 },
          props.roleData || {}
        )
        loadDeptTree()
        // 编辑态且为自定义部门：回显已配置的可见部门
        if (formData.id && formData.dataScope === 5) {
          formData.deptIds = (await fetchRoleDeptIds(formData.id)) || []
        } else {
          formData.deptIds = []
        }
        nextTick(() => formRef.value?.clearValidate())
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        // 非自定义部门不下发 deptIds（后端据 dataScope 清理）
        const payload = { ...formData }
        if (payload.dataScope !== 5) payload.deptIds = []
        emit('submit', payload)
      }
    })
  }
</script>
