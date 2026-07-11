<!-- OAuth2 授权同意页：展示客户端与请求范围，用户批准后换取一次性 code 并回跳 redirect_uri（标准授权码流） -->
<template>
  <div class="oauth-consent">
    <ElCard class="consent-card">
      <template #header>
        <span class="consent-title">授权确认</span>
      </template>
      <div v-if="loading" class="consent-loading">加载中…</div>
      <template v-else-if="info">
        <p class="consent-line">
          应用 <b>{{ info.clientName || info.clientId }}</b> 请求访问你的账号，授权范围：
        </p>
        <ul class="consent-scopes">
          <li v-for="s in info.scopes" :key="s">
            <ElTag size="small">{{ s }}</ElTag>
          </li>
          <li v-if="!info.scopes || info.scopes.length === 0" class="consent-empty"
            >（无特定范围）</li
          >
        </ul>
        <div v-if="issuedCode" class="consent-code">
          授权码（无回调地址，直接展示）：<code>{{ issuedCode }}</code>
        </div>
        <div class="consent-actions">
          <ElButton @click="deny">拒绝</ElButton>
          <ElButton type="primary" :loading="submitting" @click="approve">同意授权</ElButton>
        </div>
      </template>
      <div v-else class="consent-error">{{ errorMsg || '参数错误' }}</div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { fetchOauthAuthorizeInfo, fetchOauthAuthorizeConfirm } from '@/api/oauth'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'OauthConsent' })

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  const loading = ref(true)
  const submitting = ref(false)
  const info = ref<{ clientId: string; clientName: string; scopes: string[] } | null>(null)
  const errorMsg = ref('')
  const issuedCode = ref('')

  const q = () => ({
    clientId: route.query.client_id as string,
    scope: route.query.scope as string,
    redirectUri: route.query.redirect_uri as string,
    state: route.query.state as string,
    codeChallenge: route.query.code_challenge as string,
    codeChallengeMethod: route.query.code_challenge_method as string
  })

  onMounted(async () => {
    if (!userStore.isLogin) {
      // 未登录：跳登录并带回跳
      router.push({ path: '/auth/login', query: { redirect: route.fullPath } })
      return
    }
    const { clientId, scope } = q()
    if (!clientId) {
      errorMsg.value = '缺少 client_id'
      loading.value = false
      return
    }
    try {
      info.value = await fetchOauthAuthorizeInfo({ client_id: clientId, scope })
    } catch (e: any) {
      errorMsg.value = e?.message || '客户端无效'
    } finally {
      loading.value = false
    }
  })

  const approve = async () => {
    submitting.value = true
    try {
      const p = q()
      const resp = await fetchOauthAuthorizeConfirm(p)
      const redirect = p.redirectUri
      if (redirect) {
        const sep = redirect.includes('?') ? '&' : '?'
        const statePart = p.state ? `&state=${encodeURIComponent(p.state)}` : ''
        window.location.href = `${redirect}${sep}code=${encodeURIComponent(resp.code)}${statePart}`
      } else {
        issuedCode.value = resp.code
        ElMessage.success('授权成功')
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '授权失败')
    } finally {
      submitting.value = false
    }
  }

  const deny = () => {
    const { redirectUri, state } = q()
    if (redirectUri) {
      const sep = redirectUri.includes('?') ? '&' : '?'
      const statePart = state ? `&state=${encodeURIComponent(state)}` : ''
      window.location.href = `${redirectUri}${sep}error=access_denied${statePart}`
    } else {
      router.push('/')
    }
  }
</script>

<style scoped>
  .oauth-consent {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--el-bg-color-page);
  }

  .consent-card {
    width: 420px;
  }

  .consent-title {
    font-weight: 600;
  }

  .consent-scopes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0;
    margin: 12px 0;
    list-style: none;
  }

  .consent-empty {
    color: var(--el-text-color-secondary);
  }

  .consent-code {
    padding: 8px;
    margin: 8px 0;
    word-break: break-all;
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }

  .consent-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
  }
</style>
