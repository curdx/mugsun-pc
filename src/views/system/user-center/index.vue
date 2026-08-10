<!-- 个人中心：头像/昵称/密码维护 + 联系方式展示 + 第三方账号绑定 -->
<template>
  <div class="user-center-page art-full-height">
    <ElRow :gutter="16">
      <ElCol :xs="24" :md="10">
        <ElCard>
          <template #header>个人信息</template>
          <div class="uc-avatar-row">
            <img v-if="info.avatar" :src="info.avatar" class="uc-avatar" alt="头像" />
            <div v-else class="uc-avatar uc-avatar-fallback">
              {{ (info.nickName || info.userName || '?').slice(0, 1) }}
            </div>
            <ElUpload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="handleAvatarChange"
            >
              <ElButton size="small" :loading="avatarUploading">更换头像</ElButton>
            </ElUpload>
          </div>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="账号">{{ info.userName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="昵称">{{ info.nickName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="邮箱">{{ info.email || '未绑定' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="手机">{{ info.phone || '未绑定' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="角色">{{ roleNames }}</ElDescriptionsItem>
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

        <!-- 第三方账号：mock 来源仅 dev 且后端允许时可见（门控与登录页对齐，生产绝不出现） -->
        <ElCard class="uc-form-card" v-if="showMockBind">
          <template #header>第三方账号</template>
          <div class="uc-social">
            <span>模拟第三方（mock）</span>
            <div>
              <ElButton type="primary" size="small" @click="bindSocial('mock')">绑定</ElButton>
              <ElButton size="small" @click="unbindSocial('mock')">解绑</ElButton>
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import type { FormInstance, FormRules, UploadFile } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import {
    fetchUpdateInfo,
    fetchUpdatePassword,
    fetchUpdateAvatar,
    uploadAvatarFile
  } from '@/api/system-manage'
  import { fetchSocialRender, fetchSocialUnbind, fetchSocialSources } from '@/api/auth'
  import { fetchRoleCodeSelect } from '@/api/role'
  import { encryptPassword } from '@/utils/gm'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const info = computed<any>(() => userStore.getUserInfo || {})

  // 角色码 → 角色名映射：/auth/info 只返回角色码（admin/R_SUPER…），按角色码下拉翻译为中文名；
  // 无角色列表权限时接口被拒，降级原样显示角色码
  const roleNameMap = ref<Record<string, string>>({})
  onMounted(async () => {
    try {
      const options = (await fetchRoleCodeSelect()) || []
      roleNameMap.value = Object.fromEntries(options.map((o: any) => [String(o.value), o.label]))
    } catch {
      roleNameMap.value = {}
    }
  })
  // R_SUPER/R_ADMIN 是菜单门控伪角色（非 sys_role 真实角色），不展示；真实角色码翻译为中文名
  const PSEUDO_ROLES = ['R_SUPER', 'R_ADMIN']
  const roleNames = computed(() => {
    const roles: string[] = info.value.roles || []
    const names = roles
      .filter((r) => !PSEUDO_ROLES.includes(r))
      .map((r) => roleNameMap.value[r] || r)
    return names.length ? names.join(', ') : roles.join(', ')
  })

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

  // ===== 头像上传：附件体系公开区 → URL 落 sys_user.avatar =====
  const avatarUploading = ref(false)
  const AVATAR_MAX_SIZE = 2 * 1024 * 1024

  const handleAvatarChange = async (uploadFile: UploadFile): Promise<void> => {
    const raw = uploadFile.raw
    if (!raw) return
    if (!raw.type.startsWith('image/')) {
      ElMessage.warning('仅支持图片文件')
      return
    }
    if (raw.size > AVATAR_MAX_SIZE) {
      ElMessage.warning('头像大小不能超过 2MB')
      return
    }
    try {
      avatarUploading.value = true
      const attach = await uploadAvatarFile(raw)
      if (!attach?.url) {
        ElMessage.error('头像上传失败：未返回可访问地址')
        return
      }
      await fetchUpdateAvatar({ avatar: attach.url })
      userStore.setUserInfo({ ...(userStore.getUserInfo as any), avatar: attach.url })
      ElMessage.success('头像已更新')
    } catch (error) {
      console.error('[UserCenter] upload avatar failed:', error)
    } finally {
      avatarUploading.value = false
    }
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
        oldPassword: await encryptPassword(pwdForm.oldPassword),
        newPassword: await encryptPassword(pwdForm.newPassword)
      })
      ElMessage.success('密码已修改，请重新登录')
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
      // 后端改密即全端下线，前端同步清理并回登录页
      setTimeout(() => {
        userStore.logOut()
      }, 800)
    })
  }

  // ===== 第三方账号：mock 绑定区门控与登录页对齐（DEV 且后端允许 mock） =====
  const showMockBind = ref(false)
  onMounted(async () => {
    if (!import.meta.env.DEV) return
    try {
      const data = await fetchSocialSources()
      showMockBind.value = !!data.mockEnabled
    } catch {
      showMockBind.value = false
    }
  })

  // 绑定第三方账号：取授权地址并跳转，回调页检测到已登录态即执行绑定
  const bindSocial = async (source: string) => {
    try {
      const { authorizeUrl } = await fetchSocialRender(source)
      window.location.href = authorizeUrl
    } catch (e: any) {
      ElMessage.error(e?.message || '发起绑定失败')
    }
  }

  const unbindSocial = async (source: string) => {
    await fetchSocialUnbind(source)
    ElMessage.success('已解绑')
  }
</script>

<style scoped>
  .uc-form-card {
    margin-bottom: 16px;
  }

  .uc-avatar-row {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }

  .uc-avatar {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border: 1px solid var(--art-border-color);
    border-radius: 50%;
  }

  .uc-avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    user-select: none;
    background: var(--theme-color);
  }
</style>
