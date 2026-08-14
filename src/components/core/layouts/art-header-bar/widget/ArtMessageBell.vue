<!-- 顶栏站内信铃铛：未读角标 + 下拉最近消息 + 标已读 -->
<template>
  <ElPopover
    ref="popoverRef"
    placement="bottom-end"
    :width="340"
    trigger="click"
    :show-arrow="false"
    popper-class="message-bell-popover"
    @show="onOpen"
  >
    <template #reference>
      <ElBadge
        :value="messageStore.unreadCount"
        :max="99"
        :hidden="messageStore.unreadCount === 0"
        class="message-badge"
      >
        <ArtIconButton icon="ri:notification-2-line" />
      </ElBadge>
    </template>
    <template #default>
      <div class="message-bell">
        <div class="bell-head">
          <span class="bell-title">{{ $t('components.messageBell.title') }}</span>
          <ElButton link type="primary" size="small" @click="readAll">{{
            $t('components.messageBell.readAll')
          }}</ElButton>
        </div>
        <ElScrollbar max-height="360px">
          <ElEmpty
            v-if="!list.length"
            :description="$t('components.messageBell.emptyText')"
            :image-size="60"
          />
          <ul v-else class="bell-list">
            <li
              v-for="m in list"
              :key="m.id"
              class="bell-item"
              :class="{ unread: m.isRead === 0 }"
              @click="openMessage(m)"
            >
              <span v-if="m.isRead === 0" class="dot"></span>
              <div class="bell-item-main">
                <span class="bell-item-title">{{ m.title }}</span>
                <span class="bell-item-time">{{
                  (m.sendTime || '').slice(0, 16).replace('T', ' ')
                }}</span>
              </div>
            </li>
          </ul>
        </ElScrollbar>
        <div class="bell-foot" @click="viewAll">{{ $t('notice.viewAll') }}</div>
      </div>
    </template>
  </ElPopover>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { useMessageStore } from '@/store/modules/message'
  import { fetchMsgRecent, fetchReadMessage, fetchReadAllMessage } from '@/api/message'

  defineOptions({ name: 'ArtMessageBell' })

  const { t } = useI18n()

  const router = useRouter()
  const messageStore = useMessageStore()
  const popoverRef = ref()
  const list = ref<any[]>([])

  const loadRecent = async () => {
    list.value = (await fetchMsgRecent(8)) || []
  }

  // 打开下拉时刷新未读数与最近列表
  const onOpen = () => {
    messageStore.refreshUnread()
    loadRecent()
  }

  // 点开消息：标已读并刷新角标，跳转我的消息看全文
  const openMessage = async (m: any) => {
    if (m.isRead === 0) {
      await fetchReadMessage(m.messageId)
      m.isRead = 1
      messageStore.refreshUnread()
    }
    popoverRef.value?.hide()
    router.push('/system/message')
  }

  const readAll = async () => {
    await fetchReadAllMessage()
    list.value.forEach((m) => (m.isRead = 1))
    messageStore.refreshUnread()
    ElMessage.success(t('components.messageBell.readAllSuccess'))
  }

  const viewAll = () => {
    popoverRef.value?.hide()
    router.push('/system/message')
  }

  // 轮询未读数，使收件人无需刷新即可感知新消息（60s）
  let timer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    messageStore.refreshUnread()
    timer = setInterval(() => messageStore.refreshUnread(), 60000)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
</script>

<style lang="scss" scoped>
  .message-bell {
    .bell-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .bell-title {
        font-weight: 500;
      }
    }

    .bell-list {
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .bell-item {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 10px 4px;
      cursor: pointer;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:hover {
        background: var(--el-fill-color-light);
      }

      .dot {
        flex-shrink: 0;
        width: 7px;
        height: 7px;
        background: var(--el-color-danger);
        border-radius: 50%;
      }

      &:not(.unread) .bell-item-title {
        color: var(--el-text-color-secondary);
      }

      .bell-item-main {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .bell-item-title {
        overflow: hidden;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bell-item-time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .bell-foot {
      padding-top: 8px;
      font-size: 13px;
      color: var(--el-color-primary);
      text-align: center;
      cursor: pointer;
    }
  }
</style>
