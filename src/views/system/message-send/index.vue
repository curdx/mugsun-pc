<!-- 发站内信：选收件人 + 可选模板占位替换 + 直填内容 -->
<template>
  <div class="message-send-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <!-- 表单为自由增长内容（变量行/多选标签可撑高）：.art-table-card 卡片体 overflow:hidden 裁剪，
           须自备内部滚动（同 track-timeline 范式），防矮视口下发送按钮不可达 -->
      <div class="send-form-wrap">
        <ElForm :model="form" label-width="90px" style="max-width: 720px">
          <ElFormItem label="收件人" required>
            <ElSelect
              v-model="form.recipientIds"
              multiple
              filterable
              remote
              :remote-method="searchUsers"
              :loading="userSearching"
              placeholder="输入用户名/昵称搜索（默认显示最近 50 个启用账号）"
              style="width: 100%"
              @change="syncSelected"
            >
              <ElOption v-for="u in userOptions" :key="u.value" :label="u.label" :value="u.value" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="消息类型">
            <ElSelect v-model="form.type" style="width: 200px">
              <ElOption label="系统" value="system" />
              <ElOption label="通知" value="notice" />
              <ElOption label="待办" value="todo" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="消息模板">
            <ElSelect
              v-model="form.templateId"
              clearable
              placeholder="不选则直接填写标题内容"
              style="width: 100%"
              @change="onTemplateChange"
            >
              <ElOption
                v-for="t in templateOptions"
                :key="t.id"
                :label="`${t.code} · ${t.title}`"
                :value="t.id"
              />
            </ElSelect>
          </ElFormItem>

          <template v-if="!form.templateId">
            <ElFormItem label="标题" required>
              <ElInput v-model="form.title" placeholder="请输入标题（支持 ${key} 占位）" />
            </ElFormItem>
            <ElFormItem label="内容">
              <ElInput
                v-model="form.content"
                type="textarea"
                :rows="4"
                placeholder="请输入内容（支持 ${key} 占位）"
              />
            </ElFormItem>
          </template>
          <ElFormItem v-else label="模板预览">
            <div class="tpl-preview">
              <div
                ><b>{{ tplPreview.title }}</b></div
              >
              <div class="tpl-content">{{ stripHtml(tplPreview.content) }}</div>
            </div>
          </ElFormItem>

          <ElFormItem label="占位变量">
            <div class="var-list">
              <div v-for="(v, i) in form.vars" :key="i" class="var-row">
                <ElInput v-model="v.key" placeholder="变量名，如 name" style="width: 180px" />
                <span class="var-eq">=</span>
                <ElInput v-model="v.value" placeholder="变量值" style="width: 260px" />
                <ElButton link type="danger" @click="form.vars.splice(i, 1)">删除</ElButton>
              </div>
              <ElButton link type="primary" @click="form.vars.push({ key: '', value: '' })">
                + 添加变量
              </ElButton>
            </div>
          </ElFormItem>

          <ElFormItem>
            <ElButton v-perm="'sys:message:manage'" type="primary" :loading="sending" @click="send"
              >发送</ElButton
            >
          </ElFormItem>
        </ElForm>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { ElMessage } from 'element-plus'
  import { fetchMsgTemplateList, fetchSendMessage } from '@/api/message'
  import { useUserSelectSearch } from '@/hooks'

  defineOptions({ name: 'MessageSend' })

  // 收件人远程搜索：成千账号场景不下全量（默认 50 条 + 关键字防抖查询）
  const { userOptions, userSearching, searchUsers, syncSelected } = useUserSelectSearch()
  const templateOptions = ref<any[]>([])
  const sending = ref(false)
  const tplPreview = reactive<any>({ title: '', content: '' })

  const form = reactive<any>({
    recipientIds: [],
    type: 'system',
    templateId: undefined,
    title: '',
    content: '',
    vars: [] as Array<{ key: string; value: string }>
  })

  const stripHtml = (html: string) => (html || '').replace(/<[^>]+>/g, '')

  const onTemplateChange = (id: any) => {
    const tpl = templateOptions.value.find((t) => t.id === id)
    tplPreview.title = tpl?.title || ''
    tplPreview.content = tpl?.content || ''
  }

  const send = async () => {
    if (!form.recipientIds.length) return ElMessage.warning('请选择收件人')
    if (!form.templateId && !form.title?.trim()) return ElMessage.warning('请填写标题')
    const params: Record<string, string> = {}
    form.vars.forEach((v: any) => {
      if (v.key?.trim()) params[v.key.trim()] = v.value ?? ''
    })
    sending.value = true
    try {
      await fetchSendMessage({
        templateId: form.templateId || null,
        title: form.title,
        content: form.content,
        type: form.type,
        params,
        recipientIds: form.recipientIds
      })
      ElMessage.success('发送成功')
      Object.assign(form, {
        recipientIds: [],
        type: 'system',
        templateId: undefined,
        title: '',
        content: '',
        vars: []
      })
      syncSelected([])
    } finally {
      sending.value = false
    }
  }

  onMounted(async () => {
    templateOptions.value = (await fetchMsgTemplateList()) || []
  })
</script>

<style lang="scss" scoped>
  .message-send-page {
    .send-form-wrap {
      height: 100%;
      overflow-y: auto;
    }

    .var-list {
      width: 100%;
    }

    .var-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .var-eq {
      color: var(--el-text-color-secondary);
    }

    .tpl-preview {
      width: 100%;
      padding: 10px 12px;
      background: var(--el-fill-color-light);
      border-radius: 8px;

      .tpl-content {
        margin-top: 6px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
</style>
