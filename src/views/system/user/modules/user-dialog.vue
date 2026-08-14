<!-- 用户新增/编辑弹窗（对接后端 /system/user/submit）：建档可挂 部门/岗位/角色/邮箱 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? $t('pages.system.user.addUser') : $t('pages.system.user.editUser')"
    width="560px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem :label="$t('pages.system.user.fields.username')" prop="username">
        <ElInput
          v-model="formData.username"
          :disabled="type === 'edit'"
          :placeholder="$t('pages.system.user.placeholder.username')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.nickname')" prop="nickname">
        <ElInput
          v-model="formData.nickname"
          :placeholder="$t('pages.system.user.placeholder.nickname')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.dept')" prop="deptId">
        <ElTreeSelect
          v-model="formData.deptId"
          :data="deptTree"
          :props="{ value: 'id', label: 'deptName', children: 'children' }"
          check-strictly
          filterable
          clearable
          :placeholder="$t('pages.system.user.placeholder.dept')"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.post')" prop="postId">
        <ElSelect
          v-model="formData.postId"
          clearable
          :placeholder="$t('pages.system.user.placeholder.post')"
          style="width: 100%"
        >
          <ElOption v-for="p in postOptions" :key="p.value" :label="p.label" :value="p.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.role')" prop="roleIds">
        <ElSelect
          v-model="formData.roleIds"
          multiple
          filterable
          clearable
          :placeholder="$t('pages.system.user.placeholder.role')"
          style="width: 100%"
        >
          <ElOption v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.email')" prop="email">
        <ElInput
          v-model="formData.email"
          :placeholder="$t('pages.system.user.placeholder.email')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.phone')" prop="phone">
        <ElInput
          v-model="formData.phone"
          :placeholder="$t('pages.system.user.placeholder.phoneForm')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.idCard')" prop="idCard">
        <ElInput
          v-model="formData.idCard"
          :placeholder="$t('pages.system.user.placeholder.idCard')"
        />
      </ElFormItem>
      <ElFormItem
        v-if="type === 'add'"
        :label="$t('pages.system.user.fields.password')"
        prop="password"
      >
        <ElInput
          v-model="formData.password"
          type="password"
          :placeholder="$t('pages.system.user.placeholder.password')"
          show-password
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.user.fields.status')">
        <ElSwitch v-model="formData.status" :active-value="1" :inactive-value="0" />
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

  const { t } = useI18n()

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

  const rules = computed<FormRules>(() => ({
    username: [
      { required: true, message: t('pages.system.user.placeholder.username'), trigger: 'blur' }
    ],
    email: [{ type: 'email', message: t('pages.system.user.rules.emailFormat'), trigger: 'blur' }],
    phone: [
      { pattern: /^1\d{10}$/, message: t('pages.system.user.rules.phoneFormat'), trigger: 'blur' }
    ],
    idCard: [
      {
        pattern: /(^\d{15}$)|(^\d{17}[\dXx]$)/,
        message: t('pages.system.user.rules.idCardFormat'),
        trigger: 'blur'
      }
    ]
  }))

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
