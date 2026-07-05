<!-- 菜单新增/编辑弹窗（对接后端 /system/menu/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增菜单' : '编辑菜单'"
    width="560px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem label="上级菜单" prop="parentId">
        <ElSelect v-model="formData.parentId" style="width: 100%">
          <ElOption label="顶级菜单" :value="0" />
          <ElOption
            v-for="opt in menuOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="菜单名称" prop="menuName">
        <ElInput v-model="formData.menuName" placeholder="请输入菜单名称" />
      </ElFormItem>
      <ElFormItem label="菜单类型" prop="menuType">
        <ElSelect v-model="formData.menuType" style="width: 100%">
          <ElOption label="目录" value="M" />
          <ElOption label="菜单" value="C" />
          <ElOption label="按钮" value="F" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="路由地址" prop="path">
        <ElInput v-model="formData.path" placeholder="如 /system/user" />
      </ElFormItem>
      <ElFormItem label="组件路径" prop="component">
        <ElInput v-model="formData.component" placeholder="如 /system/user" />
      </ElFormItem>
      <ElFormItem label="权限标识" prop="permission">
        <ElInput v-model="formData.permission" placeholder="如 sys:user:list" />
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
    menuData?: Record<string, any>
    menuTree?: any[]
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

  // 上级菜单选项：菜单树扁平化（按层级缩进）
  const menuOptions = computed(() => {
    const out: Array<{ label: string; value: any }> = []
    const walk = (nodes: any[], prefix: string) => {
      ;(nodes || []).forEach((node) => {
        out.push({ label: prefix + node.menuName, value: node.id })
        if (node.children?.length) walk(node.children, prefix + '　')
      })
    }
    walk(props.menuTree || [], '')
    return out
  })

  const formRef = ref<FormInstance>()

  const formData = reactive<Record<string, any>>({
    id: undefined,
    parentId: 0,
    menuName: '',
    menuType: 'M',
    path: '',
    component: '',
    permission: '',
    sort: 0
  })

  const rules: FormRules = {
    menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
  }

  watch(
    () => [props.visible, props.menuData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          {
            id: undefined,
            parentId: 0,
            menuName: '',
            menuType: 'M',
            path: '',
            component: '',
            permission: '',
            sort: 0
          },
          props.menuData || {}
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
