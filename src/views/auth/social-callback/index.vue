<!-- 第三方登录回调页：读回调 code+state，已登录→绑定，未登录→登录（openId 由服务端换取，前端不接触） -->
<template>
  <div class="social-callback">
    <ElResult :icon="icon" :title="title" :sub-title="subTitle" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { fetchSocialLogin, fetchSocialBind } from '@/api/auth'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'SocialCallback' })

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  const icon = ref<'info' | 'success' | 'error'>('info')
  const title = ref('正在处理第三方登录…')
  const subTitle = ref('')

  onMounted(async () => {
    const source = route.query.source as string
    const code = route.query.code as string
    const state = route.query.state as string
    if (!source || !code || !state) {
      icon.value = 'error'
      title.value = '回调参数缺失'
      return
    }
    try {
      if (userStore.isLogin) {
        // 已登录 → 绑定第三方账号
        await fetchSocialBind({ source, code, state })
        icon.value = 'success'
        title.value = '绑定成功'
        ElMessage.success('第三方账号绑定成功')
        setTimeout(() => router.push('/system/user-center'), 800)
      } else {
        // 未登录 → 第三方登录（管理端未绑定会被后端拒绝）
        const resp = await fetchSocialLogin({ source, code, state })
        userStore.setToken(resp.token, resp.refreshToken)
        userStore.setLoginStatus(true)
        icon.value = 'success'
        title.value = '登录成功'
        ElMessage.success('第三方登录成功')
        setTimeout(() => router.push('/'), 600)
      }
    } catch (e: any) {
      icon.value = 'error'
      title.value = '第三方登录失败'
      subTitle.value = e?.message || '请重试'
      setTimeout(() => router.push(userStore.isLogin ? '/system/user-center' : '/auth/login'), 1500)
    }
  })
</script>

<style scoped>
  .social-callback {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
</style>
