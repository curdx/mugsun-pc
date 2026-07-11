<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>

          <ElTabs v-model="loginType" class="login-tabs">
            <ElTabPane label="账号登录" name="account" />
            <ElTabPane label="短信登录" name="sms" />
          </ElTabs>

          <!-- 账号密码登录 -->
          <ElForm
            v-if="loginType === 'account'"
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            @keyup.enter="handleSubmit"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
                v-model.trim="formData.username"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <!-- 图形验证码 -->
            <ElFormItem prop="captchaCode">
              <div class="flex w-full gap-2">
                <ElInput
                  class="custom-height"
                  placeholder="请输入验证码"
                  v-model.trim="formData.captchaCode"
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

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">{{
                $t('login.forgetPwd')
              }}</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>
          </ElForm>

          <!-- 短信验证码登录 -->
          <ElForm
            v-else
            ref="smsFormRef"
            :model="smsForm"
            :rules="smsRules"
            @keyup.enter="handleSmsSubmit"
            style="margin-top: 8px"
          >
            <ElFormItem prop="phone">
              <ElInput
                class="custom-height"
                placeholder="请输入手机号"
                v-model.trim="smsForm.phone"
                maxlength="11"
              />
            </ElFormItem>
            <ElFormItem prop="code">
              <div class="flex w-full gap-2">
                <ElInput
                  class="custom-height"
                  placeholder="请输入短信验证码"
                  v-model.trim="smsForm.code"
                  maxlength="6"
                />
                <ElButton
                  class="custom-height sms-code-btn"
                  :disabled="smsCountdown > 0"
                  @click="sendSmsCode"
                >
                  {{ smsCountdown > 0 ? smsCountdown + 's' : '发送验证码' }}
                </ElButton>
              </div>
            </ElFormItem>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSmsSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>
          </ElForm>

          <div class="social-login">
            <ElDivider>第三方登录</ElDivider>
            <ElButton class="w-full custom-height" @click="handleSocialLogin('mock')" v-ripple>
              模拟第三方登录
            </ElButton>
          </div>

          <div class="mt-5 text-sm text-gray-600">
            <span>{{ $t('login.noAccount') }}</span>
            <RouterLink class="text-theme" :to="{ name: 'Register' }">{{
              $t('login.register')
            }}</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin, fetchCaptcha, fetchTwoFactor, fetchSmsCode, fetchSmsLogin } from '@/api/auth'
  import { fetchSocialRender } from '@/api/auth'
  import {
    ElNotification,
    ElMessage,
    ElMessageBox,
    type FormInstance,
    type FormRules
  } from 'element-plus'

  defineOptions({ name: 'Login' })

  const { t, locale } = useI18n()
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const captchaImage = ref('')

  const formData = reactive({
    username: '',
    password: '',
    captchaUuid: '',
    captchaCode: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }],
    captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }))

  const loading = ref(false)

  // ===== 短信登录 =====
  const loginType = ref<'account' | 'sms'>('account')
  const smsFormRef = ref<FormInstance>()
  const smsForm = reactive({ phone: '', code: '' })
  const smsRules = computed<FormRules>(() => ({
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
    ],
    code: [{ required: true, message: '请输入短信验证码', trigger: 'blur' }]
  }))
  const smsCountdown = ref(0)
  let smsTimer: ReturnType<typeof setInterval> | null = null

  // 存储 token 并跳转（账号/短信登录共用）
  const applyToken = (token?: string, refreshToken?: string) => {
    if (!token) throw new Error('Login failed - no token received')
    userStore.setToken(token, refreshToken)
    userStore.setLoginStatus(true)
    showLoginSuccessNotice()
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  }

  // 发起第三方登录：取授权地址并跳转（回调页处理 code+state）
  const handleSocialLogin = async (source: string) => {
    try {
      const { authorizeUrl } = await fetchSocialRender(source)
      window.location.href = authorizeUrl
    } catch (e: any) {
      ElMessage.error(e?.message || '发起第三方登录失败')
    }
  }

  // 发送短信验证码（开发环境后端回显，自动填充）
  const sendSmsCode = async () => {
    if (!/^1\d{10}$/.test(smsForm.phone)) {
      ElMessage.warning('请先输入正确的手机号')
      return
    }
    try {
      const resp = await fetchSmsCode(smsForm.phone)
      smsCountdown.value = 60
      smsTimer = setInterval(() => {
        smsCountdown.value--
        if (smsCountdown.value <= 0 && smsTimer) {
          clearInterval(smsTimer)
          smsTimer = null
        }
      }, 1000)
      if (resp?.code) {
        smsForm.code = resp.code
        ElMessage.success(`验证码已发送（开发回显：${resp.code}）`)
      } else {
        ElMessage.success('验证码已发送')
      }
    } catch (error) {
      console.error('[Login] send sms code failed:', error)
    }
  }

  // 短信登录提交
  const handleSmsSubmit = async () => {
    if (!smsFormRef.value) return
    try {
      const valid = await smsFormRef.value.validate()
      if (!valid) return
      loading.value = true
      const resp = await fetchSmsLogin({ phone: smsForm.phone, code: smsForm.code })
      applyToken(resp.token, resp.refreshToken)
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login] sms login error:', error)
      }
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => {
    if (smsTimer) clearInterval(smsTimer)
  })

  // 加载图形验证码
  const loadCaptcha = async () => {
    try {
      const data = await fetchCaptcha()
      captchaImage.value = data.captchaImage
      formData.captchaUuid = data.captchaUuid
      formData.captchaCode = ''
    } catch (error) {
      console.error('[Login] load captcha failed:', error)
    }
  }

  onMounted(() => {
    formData.username = 'admin'
    formData.password = '123456'
    loadCaptcha()
  })

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      // 表单验证
      const valid = await formRef.value.validate()
      if (!valid) return

      loading.value = true

      // 登录请求
      const { username, password, captchaUuid, captchaCode } = formData

      const resp = await fetchLogin({
        username,
        password,
        captchaUuid,
        captchaCode
      })

      let token = resp.token
      let refreshToken = resp.refreshToken

      // 双因子登录：需二次验证码
      if (resp.twoFactorRequired) {
        const { value: code } = await ElMessageBox.prompt(
          '登录验证码已发送（无凭证时降级为日志，开发环境已自动填充）',
          '双因子验证',
          {
            confirmButtonText: '验证',
            cancelButtonText: '取消',
            inputValue: resp.twoFactorCode || ''
          }
        )
        const tf = await fetchTwoFactor({ twoFactorToken: resp.twoFactorToken as string, code })
        token = tf.token
        refreshToken = tf.refreshToken
      }

      // 验证并存储 token，跳转
      applyToken(token, refreshToken)
    } catch (error) {
      // 登录失败刷新验证码（答案已在后端消费）
      loadCaptcha()
      // 处理 HttpError
      if (error instanceof HttpError) {
        // console.log(error.code)
      } else {
        // 处理非 HttpError
        console.error('[Login] Unexpected error:', error)
      }
    } finally {
      loading.value = false
    }
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }

  .captcha-img {
    flex-shrink: 0;
    width: 125px;
    height: 43px;
    cursor: pointer;
    border: 1px solid var(--art-border-color);
    border-radius: 6px;
  }

  .sms-code-btn {
    flex-shrink: 0;
    width: 125px;
  }
</style>
