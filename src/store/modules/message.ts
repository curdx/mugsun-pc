import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMsgUnreadCount } from '@/api/message'

/**
 * 站内信未读数：顶栏角标数据源。发送/标已读后调 refreshUnread 同步。
 */
export const useMessageStore = defineStore('messageStore', () => {
  const unreadCount = ref(0)

  const refreshUnread = async () => {
    try {
      unreadCount.value = (await fetchMsgUnreadCount()) || 0
    } catch {
      unreadCount.value = 0
    }
  }

  return { unreadCount, refreshUnread }
})
