<!-- 用户新增/编辑弹窗（对接后端 /system/user/submit）：建档可挂 部门/岗位/角色/邮箱 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增用户' : '编辑用户'"
    width="560px"
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
      <ElFormItem label="部门" prop="deptId">
        <ElTreeSelect
          v-model="formData.deptId"
          :data="deptTree"
          :props="{ value: 'id', label: 'deptName', children: 'children' }"
          check-strictly
          filterable
          clearable
          placeholder="请选择部门"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="岗位" prop="postId">
        <ElSelect v-model="formData.postId" clearable placeholder="请选择岗位" style="width: 100%">
          <ElOption v-for="p in postOptions" :key="p.value" :label="p.label" :value="p.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色" prop="roleIds">
        <ElSelect
          v-model="formData.roleIds"
          multiple
          filterable
          clearable
          placeholder="请选择角色（决定菜单与权限）"
          style="width: 100%"
        >
          <ElOption v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="formData.email" placeholder="请输入邮箱（接收通知）" />
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
          placeholder="留空则为初始密码"
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
        <ElButton type="primary" :loading="saving" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchUserDetail } from '@/api/user'
  import { fetchDeptTree, fetchPostSelect } from '@/api/system-manage'
  import { fetchRoleSelect } from '@/api/role'

  interface Props {
    visible: boolean
    type: string
    userData?: Record<string, any>
    /** 父级保存进行中（防重复提交） */
    saving?: boolean
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
  const postOptions = ref<Array<{ label: string; value: number | string }>>([])
  const roleOptions = ref<Array<{ label: string; value: number | string }>>([])

  const emptyForm = (): Record<string, any> => ({
    id: undefined,
    username: '',
    nickname: '',
    password: '',
    deptId: undefined,
    postId: undefined,
    roleIds: [],
    email: '',
    phone: '',
    idCard: '',
    status: 1
  })

  const formData = reactive<Record<string, any>>(emptyForm())

  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
    phone: [{ pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }],
    idCard: [
      { pattern: /(^\d{15}$)|(^\d{17}[\dXx]$)/, message: '身份证号格式不正确', trigger: 'blur' }
    ]
  }

  watch(
    () => [props.visible, props.userData],
    async ([visible]) => {
      if (visible) {
        Object.assign(formData, emptyForm(), props.userData || {})
        // 组织选项（每次打开拉最新，角色/部门/岗位改动即时可见）
        const [tree, posts, roles] = await Promise.all([
          fetchDeptTree(),
          fetchPostSelect(),
          fetchRoleSelect()
        ])
        deptTree.value = tree || []
        postOptions.value = posts || []
        roleOptions.value = roles || []
        // 编辑态以 detail 回显（后端按角色裁决 明文/脱敏/不可见 + 角色 id 集合），分页行值可能是密文形态，直接回显回写会二次加密毁数据
        if (props.type === 'edit' && props.userData?.id) {
          try {
            const detail = await fetchUserDetail(props.userData.id)
            if (detail) {
              formData.phone = detail.phone ?? ''
              formData.idCard = detail.idCard ?? ''
              formData.deptId = detail.deptId ?? undefined
              formData.postId = detail.postId ?? undefined
              formData.email = detail.email ?? ''
              formData.roleIds = detail.roleIds || []
            }
          } catch (e) {
            console.error('[UserDialog] fetch detail failed:', e)
          }
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
        emit('submit', { ...formData })
      }
    })
  }
</script>
