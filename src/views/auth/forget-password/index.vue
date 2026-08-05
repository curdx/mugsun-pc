<!-- 忘记密码：邮箱验证码重置（账号 → 发码 → 验证码+新密码 → 重置成功回登录） -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('forgetPassword.title') }}</h3>
          <p class="sub-title">通过绑定邮箱接收验证码，重置账号密码</p>

          <ElForm
            class="mt-7.5"
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            :key="formKey"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                v-model.trim="formData.username"
                placeholder="请输入账号"
              />
            </ElFormItem>

            <ElFormItem prop="tenantId">
              <ElInput
                class="custom-height"
                v-model.trim="formData.tenantId"
                placeholder="租户编号（留空为平台租户）"
                maxlength="12"
              />
            </ElFormItem>

            <!-- 图形验证码：发码前置防爆破 -->
            <ElFormItem prop="captchaCode">
              <div class="flex w-full gap-2">
                <ElInput
                  class="custom-height"
                  v-model.trim="formData.captchaCode"
                  placeholder="请输入图形验证码"
                  maxlength="4"
                />
                <img
                  v-if="captchaImage"
                  :src="captchaImage"
                  class="captcha-img"
                  title="点击刷新验证码"
                  alt="验证码"
                  @click="loadCaptcha"
                />
              </div>
            </ElFormItem>

            <!-- 邮箱验证码：发码按钮带 60s 倒计时 -->
            <ElFormItem prop="code">
              <div class="flex w-full gap-2">
                <ElInput
                  class="custom-height"
                  v-model.trim="formData.code"
                  placeholder="请输入邮箱验证码"
                  maxlength="6"
                />
                <ElButton
                  class="custom-height mail-code-btn"
                  :disabled="countdown > 0"
                  :loading="sending"
                  @click="sendCode"
                >
                  {{ countdown > 0 ? countdown + 's' : '发送验证码' }}
                </ElButton>
              </div>
            </ElFormItem>

            <ElFormItem prop="newPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.newPassword"
                placeholder="请输入新密码"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.confirmPassword"
                placeholder="请再次输入新密码"
                type="password"
                autocomplete="off"
                show-password
                @keyup.enter="submit"
              />
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="submit"
                :loading="loading"
                v-ripple
              >
                {{ $t('forgetPassword.submitBtnText') }}
              </ElButton>
            </div>

            <div style="margin-top: 15px">
              <ElButton class="w-full custom-height" plain @click="toLogin">
                {{ $t('forgetPassword.backBtnText') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchCaptcha, fetchForgetCode, fetchForgetReset } from '@/api/auth'
  import { encryptPassword } from '@/utils/gm'

  defineOptions({ name: 'ForgetPassword' })

  interface ForgetForm {
    username: string
    tenantId: string
    captchaCode: string
    code: string
    newPassword: string
    confirmPassword: string
  }

  const { locale } = useI18n()
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const loading = ref(false)
  const sending = ref(false)

  const formData = reactive<ForgetForm>({
    username: '',
    tenantId: '',
    captchaCode: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 图形验证码（发码防爆破，与登录/注册同机制）
  const captchaImage = ref('')
  const captchaUuid = ref('')
  const loadCaptcha = async () => {
    try {
      const data = await fetchCaptcha()
      captchaImage.value = data.captchaImage
      captchaUuid.value = data.captchaUuid
      formData.captchaCode = ''
    } catch (error) {
      console.error('[ForgetPassword] load captcha failed:', error)
    }
  }
  onMounted(loadCaptcha)

  // 发码倒计时（同短信登录 60s 节流）
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null
  const startCountdown = () => {
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  // 发送邮箱验证码：账号+图形验证码前置校验；账号不存在后端同样返回成功（防枚举）
  const sendCode = async () => {
    if (!formData.username) {
      ElMessage.warning('请先输入账号')
      return
    }
    if (!formData.captchaCode) {
      ElMessage.warning('请先输入图形验证码')
      return
    }
    try {
      sending.value = true
      await fetchForgetCode({
        username: formData.username,
        tenantId: formData.tenantId || undefined,
        captchaUuid: captchaUuid.value,
        captchaCode: formData.captchaCode
      })
      startCountdown()
      ElMessage.success('若账号存在且已绑定邮箱，验证码已发送')
    } catch (error) {
      // 失败刷新图形验证码（答案已在后端消费）
      loadCaptcha()
      console.error('[ForgetPassword] send code failed:', error)
    } finally {
      sending.value = false
    }
  }

  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error('请再次输入新密码'))
      return
    }
    if (value !== formData.newPassword) {
      callback(new Error('两次密码不一致'))
      return
    }
    callback()
  }

  const rules = computed<FormRules<ForgetForm>>(() => ({
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    captchaCode: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }],
    code: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, message: '密码至少 8 位，且含大小写/数字/特殊字符中至少 3 类', trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
  }))

  // 提交重置：新密码 SM2 传输；成功后回登录页用新密码登录
  const submit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      loading.value = true
      await fetchForgetReset({
        username: formData.username,
        tenantId: formData.tenantId || undefined,
        code: formData.code,
        newPassword: await encryptPassword(formData.newPassword)
      })
      ElMessage.success('密码已重置，请使用新密码登录')
      router.push({ name: 'Login' })
    } catch (error) {
      console.error('[ForgetPassword] reset failed:', error)
    } finally {
      loading.value = false
    }
  }

  const toLogin = () => {
    router.push({ name: 'Login' })
  }
</script>

<style scoped>
  @import '../login/style.css';

  .captcha-img {
    flex-shrink: 0;
    width: 125px;
    height: 43px;
    cursor: pointer;
    border: 1px solid var(--art-border-color);
    border-radius: 6px;
  }

  .mail-code-btn {
    flex-shrink: 0;
    width: 125px;
  }
</style>
