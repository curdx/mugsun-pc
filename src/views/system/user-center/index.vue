<!-- 个人中心：修改昵称与密码 -->
<template>
  <div class="user-center-page art-full-height">
    <ElRow :gutter="16">
      <ElCol :xs="24" :md="10">
        <ElCard>
          <template #header>个人信息</template>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="账号">{{ info.userName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="昵称">{{ info.nickName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="角色">{{
              (info.roles || []).join(', ')
            }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :md="14">
        <ElCard class="uc-form-card">
          <template #header>修改昵称</template>
          <ElForm ref="infoRef" :model="infoForm" :rules="infoRules" label-width="90px">
            <ElFormItem label="昵称" prop="nickname">
              <ElInput
                v-model="infoForm.nickname"
                placeholder="请输入新昵称"
                style="max-width: 320px"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="saveInfo">保存</ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>

        <ElCard class="uc-form-card">
          <template #header>修改密码</template>
          <ElForm ref="pwdRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
            <ElFormItem label="原密码" prop="oldPassword">
              <ElInput
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
                style="max-width: 320px"
              />
            </ElFormItem>
            <ElFormItem label="新密码" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                show-password
                style="max-width: 320px"
              />
            </ElFormItem>
            <ElFormItem label="确认密码" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                show-password
                style="max-width: 320px"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="savePassword">保存</ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { fetchUpdateInfo, fetchUpdatePassword } from '@/api/system-manage'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const info = computed<any>(() => userStore.getUserInfo || {})

  const infoRef = ref<FormInstance>()
  const infoForm = reactive({ nickname: info.value.nickName || '' })
  const infoRules: FormRules = {
    nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
  }

  const saveInfo = async (): Promise<void> => {
    if (!infoRef.value) return
    await infoRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchUpdateInfo({ nickname: infoForm.nickname })
      userStore.setUserInfo({ ...(userStore.getUserInfo as any), nickName: infoForm.nickname })
      ElMessage.success('昵称已修改')
    })
  }

  const pwdRef = ref<FormInstance>()
  const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const pwdRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    newPassword: [
      {
        required: true,
        min: 8,
        message: '密码至少 8 位，且含大小写/数字/特殊字符中至少 3 类',
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        validator: (_r: any, v: string, cb: any) =>
          v === pwdForm.newPassword ? cb() : cb(new Error('两次密码不一致')),
        trigger: 'blur'
      }
    ]
  }

  const savePassword = async (): Promise<void> => {
    if (!pwdRef.value) return
    await pwdRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchUpdatePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      })
      ElMessage.success('密码已修改')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
    })
  }
</script>

<style scoped>
  .uc-form-card {
    margin-bottom: 16px;
  }
</style>
