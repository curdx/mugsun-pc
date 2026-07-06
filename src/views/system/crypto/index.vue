<!-- 接口国密加解密演示：请求 SM4 加密、响应 SM4 解密（与后端 @ApiDecrypt/@ApiEncrypt 对接） -->
<template>
  <div class="crypto-demo">
    <ElCard shadow="never">
      <template #header>
        <span>接口国密加解密演示（SM4）</span>
      </template>
      <ElAlert
        type="info"
        :closable="false"
        title="输入文本后点击「加密发送」：前端 sm-crypto 将请求体 SM4 加密为密文发送，后端解密处理后再将响应加密返回，前端解密展示。可在浏览器网络面板核对请求/响应均为密文。"
        class="mb-4"
      />
      <ElInput v-model="inputText" type="textarea" :rows="3" placeholder="请输入要加密传输的文本" />
      <ElButton type="primary" class="mt-3" :loading="loading" @click="handleSend">
        加密发送
      </ElButton>

      <div v-if="requestCipher" class="result mt-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="① 原始明文">{{ inputText }}</ElDescriptionsItem>
          <ElDescriptionsItem label="② 加密后请求体(发往后端)">
            <span class="cipher">{{ requestCipher }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="③ 后端响应密文(dataType=ENCRYPT)">
            <span class="cipher">{{ responseCipher }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="④ 前端解密结果">
            <span class="plain">{{ decrypted }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { sm4 } from 'sm-crypto'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'CryptoDemo' })

  // 与后端 mugsun.crypto.api-key 一致的 16 字节密钥
  const apiKey = Array.from(new TextEncoder().encode('mugsun-api-key16'))

  const inputText = ref('你好，Mugsun 国密加解密！')
  const requestCipher = ref('')
  const responseCipher = ref('')
  const decrypted = ref('')
  const loading = ref(false)

  const handleSend = async () => {
    if (!inputText.value) {
      ElMessage.warning('请输入文本')
      return
    }
    loading.value = true
    try {
      const plainJson = JSON.stringify({ text: inputText.value })
      const encryptData = sm4.encrypt(plainJson, apiKey)
      requestCipher.value = encryptData
      responseCipher.value = ''
      decrypted.value = ''

      const resp = await fetch('/api/system/crypto/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptData })
      })
      const json = await resp.json()
      if (json.dataType === 'ENCRYPT') {
        responseCipher.value = json.data
        decrypted.value = sm4.decrypt(json.data, apiKey)
      } else {
        decrypted.value = JSON.stringify(json.data)
      }
    } catch (e) {
      ElMessage.error('加解密请求失败')
      console.error('[CryptoDemo]', e)
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped lang="scss">
  .crypto-demo {
    padding: 16px;

    .cipher {
      font-family: monospace;
      color: var(--el-color-danger);
      word-break: break-all;
    }

    .plain {
      font-weight: 500;
      color: var(--el-color-success);
    }
  }
</style>
