/**
 * 埋点接入模块（mugsun-pc 自监控）
 *
 * SDK 为平台内 file 依赖（../mugsun-track，@mugsun/track-web），Vue 层 install 统一完成：
 * provide/$track/v-track 指令、errorHandler 链式挂接（保留既有 setupErrorHandle）、
 * router 集成（route_path 取 matched 路由模板防高基数，afterEach 驱动 SPA pageview 配对）。
 *
 * 身份口径：事件级 user_id 恒由服务端按 token 裁定（客户端上报值不可信），
 * 故上报请求经 headers 携带登录 token（与 @/utils/http 的 Sa-Token 裸 token 方案一致）；
 * identify 仅上报 $identify 申请绑定（user_id 放 props，是否落映射由服务端裁定）。
 * 匿名（未登录）页面照常采集（如登录页 PV），user_id 留空——设计语义。
 *
 * @module plugins/track
 * @author Mugsun
 */
import type { App } from 'vue'
import MugsunTrack from '@mugsun/track-web/vue'
import type { TrackClient } from '@mugsun/track-web'
import { router } from '@/router'
import { useUserStore } from '@/store/modules/user'

/** 默认应用种子 app_key（与后端 track 库 T2 迁移种子一致；VITE_TRACK_APP_KEY 可覆盖） */
const DEFAULT_TRACK_APP_KEY = 'ak_000000000000000000000001'

/** SDK 实例（setupTrack 后可用；未初始化时为 null，调用方一律静默跳过） */
let tracker: TrackClient | null = null

/**
 * 初始化埋点（router 就绪后、mount 前调用）。
 * endpoint 缺省 /api：dev 下 /api/track/collect 经 vite 代理到后端；release 取构建版本号。
 */
export function setupTrack(app: App): void {
  app.use(MugsunTrack, {
    endpoint: import.meta.env.VITE_TRACK_ENDPOINT || '/api',
    appKey: import.meta.env.VITE_TRACK_APP_KEY || DEFAULT_TRACK_APP_KEY,
    release: import.meta.env.VITE_VERSION,
    router,
    // 上报携带登录 token 供服务端身份裁定；beacon 冲刷场景无法自定义头，按匿名处理，不阻断采集
    headers: (): Record<string, string> => {
      const token = useUserStore().accessToken
      return token ? { Authorization: token } : {}
    }
  })
  tracker = app.config.globalProperties.$track as TrackClient
}

/**
 * 登录身份绑定（上报 $identify；SDK 侧幂等，重复绑定无副作用）。
 * 常规路径由路由守卫拉取用户信息后调用；登录 applyToken 快速路径以已缓存信息兜底调用。
 */
export function trackIdentify(userId: string | number): void {
  tracker?.identify(userId)
}

/** 登出/切号：清空登录身份、更换 anonymous_id、轮换会话（userStore.logOut 内调用） */
export function trackReset(): void {
  tracker?.reset()
}
