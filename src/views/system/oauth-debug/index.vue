<!-- 开放平台接口调试：换取令牌 → 调用开放接口，直观演示 scope 放行/拒绝 -->
<template>
  <div class="oauth-debug-page art-full-height">
    <ElCard class="art-table-card">
      <ElAlert
        type="info"
        :closable="false"
        title="填入客户端凭证换取访问令牌，再用令牌调用开放接口。scope 不足时接口返回 403，调用日志可查。"
        style="margin-bottom: 16px"
      />

      <ElForm :model="form" label-width="110px" style="max-width: 640px">
        <ElDivider content-position="left">1. 换取令牌</ElDivider>
        <ElFormItem label="授权类型">
          <ElRadioGroup v-model="form.grantType">
            <ElRadio value="client_credentials">客户端凭证</ElRadio>
            <ElRadio value="authorization_code">授权码</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="ClientId">
          <ElInput v-model="form.clientId" placeholder="mc_xxxx" />
        </ElFormItem>
        <ElFormItem label="ClientSecret">
          <ElInput v-model="form.clientSecret" placeholder="客户端密钥" />
        </ElFormItem>
        <ElFormItem label="scope">
          <ElInput v-model="form.scope" placeholder="如 user:read（留空为全部授权范围）" />
        </ElFormItem>
        <ElFormItem v-if="form.grantType === 'authorization_code'" label="授权码">
          <ElInput v-model="form.code" placeholder="点击右侧按钮跳转同意页授权后自动回填">
            <template #append>
              <ElButton @click="doAuthorize" :loading="authorizing">浏览器授权</ElButton>
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="doToken" :loading="tokenLoading">获取令牌</ElButton>
          <span v-if="token" class="oauth-token-tip">令牌已获取，可调用下方接口</span>
        </ElFormItem>
        <ElFormItem v-if="tokenResult" label="令牌响应">
          <pre class="oauth-out">{{ tokenResult }}</pre>
        </ElFormItem>

        <ElDivider content-position="left">2. 调用开放接口</ElDivider>
        <ElFormItem label="接口">
          <ElSelect v-model="apiPath" style="width: 100%">
            <ElOption label="GET /open/ping（无 scope）" value="GET /open/ping" />
            <ElOption label="GET /open/user/list（需 user:read）" value="GET /open/user/list" />
            <ElOption label="GET /open/user/count（需 user:read）" value="GET /open/user/count" />
            <ElOption label="POST /open/echo（需 user:write）" value="POST /open/echo" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="success" @click="callApi" :loading="apiLoading" :disabled="!token"
            >调用接口</ElButton
          >
        </ElFormItem>
        <ElFormItem v-if="apiResult" label="接口响应">
          <div style="width: 100%">
            <ElTag :type="apiStatus === 200 ? 'success' : 'danger'" style="margin-bottom: 8px">
              HTTP {{ apiStatus }} · {{ apiStatus === 200 ? '放行' : '拒绝' }}
            </ElTag>
            <pre class="oauth-out">{{ apiResult }}</pre>
          </div>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'OauthDebug' })

  const route = useRoute()

  const form = reactive({
    grantType: 'client_credentials',
    clientId: '',
    clientSecret: '',
    scope: 'user:read',
    code: ''
  })

  const token = ref('')
  const tokenResult = ref('')
  const tokenLoading = ref(false)
  const authorizing = ref(false)
  const apiPath = ref('GET /open/user/list')
  const apiResult = ref('')
  const apiStatus = ref(0)
  const apiLoading = ref(false)

  const pretty = (o: unknown): string => JSON.stringify(o, null, 2)

  /** 本页 URL 作 redirect_uri，授权后带 code 回跳此页 */
  const selfRedirect = (): string => `${window.location.origin}/#/open-platform/oauth-debug`

  /** 授权后回跳带回 code，自动填入 */
  onMounted(() => {
    const code = route.query.code as string
    if (code) {
      form.grantType = 'authorization_code'
      form.code = code
      ElMessage.success('已从授权回调获取授权码')
    }
  })

  /** 跳转标准授权端点 → 同意页 → 回跳本页（浏览器授权码流） */
  const doAuthorize = (): void => {
    if (!form.clientId) {
      ElMessage.warning('请先填写 ClientId')
      return
    }
    authorizing.value = true
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: form.clientId,
      redirect_uri: selfRedirect(),
      scope: form.scope || '',
      state: 'debug'
    })
    window.location.href = `/api/oauth2/authorize?${params.toString()}`
  }

  /** 换取访问令牌（form 入参 + 标准原始 JSON 响应） */
  const doToken = async (): Promise<void> => {
    tokenLoading.value = true
    try {
      const body = new URLSearchParams({
        grant_type: form.grantType,
        client_id: form.clientId,
        client_secret: form.clientSecret,
        scope: form.scope || ''
      })
      if (form.grantType === 'authorization_code') {
        body.set('code', form.code)
        body.set('redirect_uri', selfRedirect())
      }
      const resp = await fetch('/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      })
      const data = await resp.json()
      tokenResult.value = pretty(data)
      if (resp.status === 200 && data?.access_token) {
        token.value = data.access_token
        ElMessage.success('令牌获取成功')
      } else {
        token.value = ''
        ElMessage.error(data?.error_description || data?.error || '获取令牌失败')
      }
    } finally {
      tokenLoading.value = false
    }
  }

  /** 用令牌调用开放接口 */
  const callApi = async (): Promise<void> => {
    apiLoading.value = true
    try {
      const [method, path] = apiPath.value.split(' ')
      const options: { method: string; headers: Record<string, string>; body?: string } = {
        method,
        headers: { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' }
      }
      if (method === 'POST') options.body = JSON.stringify({ demo: 'hello' })
      const resp = await fetch(`/api${path}`, options)
      apiStatus.value = resp.status
      const data = await resp.json()
      apiResult.value = pretty(data)
    } finally {
      apiLoading.value = false
    }
  }
</script>

<style scoped>
  .oauth-token-tip {
    margin-left: 12px;
    color: var(--el-color-success);
  }

  .oauth-out {
    width: 100%;
    padding: 10px 12px;
    margin: 0;
    font-size: 12px;
    word-break: break-all;
    white-space: pre-wrap;
    background: var(--el-fill-color-light);
    border-radius: 6px;
  }
</style>
