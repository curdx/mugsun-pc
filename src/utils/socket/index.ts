/**
 * 消息推送 WebSocket 模块
 *
 * 提供全局单例的消息推送连接管理
 *
 * ## 主要功能
 *
 * - 登录后建立长连接，接收服务端实时推送
 * - 新站内信：刷新未读角标并弹出通知，点击跳转我的消息页
 * - 新公告：弹出通知，点击跳转我的通知页
 * - 强制下线：提示原因后退出登录
 * - 心跳保活（ping/pong）与指数退避自动重连
 * - 登出清空令牌后自动断开连接
 *
 * ## 连接地址
 *
 * - VITE_API_URL 为完整地址时，替换协议头 http(s) 为 ws(s) 后拼接
 * - VITE_API_URL 为相对路径（如 /）时，使用当前站点地址（开发环境经代理转发）
 * - 最终地址：{base}/api/ws/message?token={accessToken}
 *
 * ## 依赖方向
 *
 * - 本模块单向依赖 user/message store，store 不反向依赖本模块，避免循环引用
 * - 通过监听 accessToken 实现登出自动断开，无需在登出入口显式调用本模块
 *
 * @module utils/socket
 * @author Mugsun
 */
import { readonly, ref, watch } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import { router } from '@/router'
import { useUserStore } from '@/store/modules/user'
import { useMessageStore } from '@/store/modules/message'

/** 服务端推送消息体（文本帧 JSON） */
interface PushMessage {
  // 推送类型：message.new / notice.new / force.offline
  type: string
  // 推送内容
  content?: Record<string, any>
}

type MessageSocket = ReturnType<typeof useWebSocket>

// 心跳间隔（毫秒）
const HEARTBEAT_INTERVAL = 30 * 1000
// 心跳响应超时（毫秒）
const HEARTBEAT_PONG_TIMEOUT = 10 * 1000
// 最大重连次数
const MAX_RECONNECT_RETRIES = 10
// 重连基础延迟（毫秒），按指数退避递增：2s、4s、8s……
const RECONNECT_BASE_DELAY = 2 * 1000
// 重连最大延迟（毫秒）
const RECONNECT_MAX_DELAY = 30 * 1000

// 连接实例（懒创建，确保 Pinia 已激活）
let socket: MessageSocket | null = null
// 主动断开标记：主动断开后不再自动重连
let manualClosed = false
// 当前重连次数
let retriedCount = 0
// 重连定时器
let retryTimer: ReturnType<typeof setTimeout> | null = null
// 令牌监听注册标记
let tokenWatchRegistered = false

// 连接状态（内部可写）
const connected = ref(false)

/** 消息推送连接状态（只读，供排查） */
export const wsConnected = readonly(connected)

/**
 * 构建 WebSocket 连接地址
 * @param token 访问令牌
 */
const buildSocketUrl = (token: string): string => {
  const apiUrl: string = import.meta.env.VITE_API_URL || '/'
  let base: string
  if (/^https?:\/\//.test(apiUrl)) {
    // 完整地址：http(s) 替换为 ws(s)
    base = apiUrl.replace(/^http/, 'ws').replace(/\/+$/, '')
  } else {
    // 相对路径：使用当前站点地址，由代理或网关转发
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    base = `${protocol}://${window.location.host}`
  }
  return `${base}/api/ws/message?token=${encodeURIComponent(token)}`
}

/**
 * 新站内信：刷新未读角标并通知
 */
const handleNewMessage = (content: Record<string, any>): void => {
  useMessageStore().refreshUnread()
  ElNotification({
    title: '新消息提醒',
    message: content.title || '您收到一条新的站内信',
    type: 'info',
    duration: 4500,
    onClick: () => router.push('/system/message')
  })
}

/**
 * 新公告：通知并支持跳转我的通知页
 */
const handleNewNotice = (content: Record<string, any>): void => {
  ElNotification({
    title: '公告通知',
    message: content.title || '您有一条新的公告',
    type: 'info',
    duration: 4500,
    onClick: () => router.push('/system/my-notice')
  })
}

/**
 * 强制下线：提示原因后退出登录
 * 登出会清空令牌，触发令牌监听自动断开连接
 */
const handleForceOffline = (content: Record<string, any>): void => {
  ElNotification({
    title: '强制下线',
    message: content.reason || '您的账号已被管理员强制下线',
    type: 'error',
    duration: 3000
  })
  useUserStore().logOut()
}

/**
 * 分发服务端推送消息
 * 非 JSON 帧（如心跳响应）与未知类型静默忽略
 */
const dispatchMessage = (event: MessageEvent): void => {
  let push: PushMessage
  try {
    push = JSON.parse(String(event.data))
  } catch {
    return
  }
  if (!push || typeof push.type !== 'string') return

  const content = push.content ?? {}
  switch (push.type) {
    case 'message.new':
      handleNewMessage(content)
      break
    case 'notice.new':
      handleNewNotice(content)
      break
    case 'force.offline':
      handleForceOffline(content)
      break
    default:
      break
  }
}

/**
 * 清除重连定时器
 */
const clearRetryTimer = (): void => {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

/**
 * 安排重连：指数退避，最多重试 MAX_RECONNECT_RETRIES 次
 * 主动断开或已登出（无令牌）时不再重连
 */
const scheduleReconnect = (): void => {
  if (manualClosed || !socket) return
  if (!useUserStore().accessToken) return
  if (retriedCount >= MAX_RECONNECT_RETRIES) {
    console.warn(`[Socket] 消息推送连接重试 ${MAX_RECONNECT_RETRIES} 次后仍失败，停止重连`)
    return
  }
  retriedCount += 1
  const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, retriedCount - 1), RECONNECT_MAX_DELAY)
  clearRetryTimer()
  retryTimer = setTimeout(() => {
    retryTimer = null
    if (manualClosed || !useUserStore().accessToken) return
    // 重连地址实时构建，始终使用最新令牌
    socket?.open()
  }, delay)
}

/**
 * 创建连接实例
 * URL 以 getter 形式传入，每次连接/重连都会重新读取最新令牌
 */
const createSocket = (): MessageSocket => {
  const userStore = useUserStore()
  return useWebSocket(() => buildSocketUrl(userStore.accessToken), {
    // 不立即连接，由 connectMessageSocket 触发
    immediate: false,
    // 令牌变化不自动重连，统一由重连策略与令牌监听管理
    autoConnect: false,
    // 心跳：客户端定时发送 ping，服务端回复 pong，超时未回视为断线
    heartbeat: {
      message: 'ping',
      responseMessage: 'pong',
      interval: HEARTBEAT_INTERVAL,
      pongTimeout: HEARTBEAT_PONG_TIMEOUT
    },
    onConnected: () => {
      connected.value = true
      retriedCount = 0
    },
    onDisconnected: () => {
      connected.value = false
      scheduleReconnect()
    },
    onError: (_ws, event) => {
      console.error('[Socket] 消息推送连接异常:', event)
    },
    onMessage: (_ws, event) => dispatchMessage(event)
  })
}

/**
 * 注册令牌监听：登出清空令牌后自动断开连接
 * 避免在登出入口显式调用本模块，保持单向依赖
 */
const registerTokenWatch = (): void => {
  if (tokenWatchRegistered) return
  tokenWatchRegistered = true
  const userStore = useUserStore()
  watch(
    () => userStore.accessToken,
    (token) => {
      if (!token) disconnectMessageSocket()
    }
  )
}

/**
 * 建立消息推送连接（幂等）
 * 已连接或连接中时直接返回；无访问令牌时不连接
 */
export const connectMessageSocket = (): void => {
  const userStore = useUserStore()
  if (!userStore.accessToken) return
  registerTokenWatch()
  manualClosed = false
  if (!socket) {
    socket = createSocket()
  }
  // 已连接或连接中，幂等返回
  if (socket.status.value === 'OPEN' || socket.status.value === 'CONNECTING') return
  clearRetryTimer()
  socket.open()
}

/**
 * 断开消息推送连接
 * 主动断开后不再自动重连
 */
export const disconnectMessageSocket = (): void => {
  manualClosed = true
  retriedCount = 0
  clearRetryTimer()
  socket?.close()
}
