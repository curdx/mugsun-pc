import request from '@/utils/http'

// ===== 埋点分析 =====
/** 概览卡片 + 来源/设备/浏览器分布（days 缺省 7，范围 1..90） */
export function fetchTrackOverview(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/overview', params })
}
/** 趋势：days≤2 按小时（time=epochMs），days>2 按天（date）；dimType=overview/event/page/referrer/device */
export function fetchTrackTrend(params: Record<string, any>) {
  return request.get<any[]>({ url: '/api/system/track/trend', params })
}
/** Top 页面（pagePath/pv/uv/avgDurationMs） */
export function fetchTrackPages(params: Record<string, any>) {
  return request.get<any[]>({ url: '/api/system/track/pages', params })
}
/** 事件分析分页（eventName 可筛，按次数降序） */
export function fetchTrackEventPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/events/page', params })
}
/** 实时事件流（最近 limit 条） */
export function fetchTrackEventRealtime(params: Record<string, any>) {
  return request.get<any[]>({ url: '/api/system/track/events/realtime', params })
}
/** 当前在线人数（近 windowSeconds 秒活跃会话） */
export function fetchTrackOnline(params: Record<string, any>) {
  return request.get<{ online: number; windowSeconds: number }>({
    url: '/api/system/track/online',
    params
  })
}
/** Web Vitals 分位（CLS 千分制，其余毫秒） */
export function fetchTrackVitals(params: Record<string, any>) {
  return request.get<any[]>({ url: '/api/system/track/vitals', params })
}
/** 错误指纹分组分页（按最近发生降序） */
export function fetchTrackErrorPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/errors/page', params })
}
/** 指纹组内错误事件分页（props 为 JSON 字符串，含 breadcrumbs） */
export function fetchTrackErrorDetail(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/errors/detail', params })
}

// ===== 会话回放 =====
/** 回放会话分页（appKey/hasError 可筛，startTime 倒序） */
export function fetchTrackReplayPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/replay/page', params })
}
/** 回放详情：{replay: 会话元数据, blocks: [{seq, key}]}（探测场景调用方自处理失败，不弹错误提示） */
export function fetchTrackReplayDetail(params: Record<string, any>) {
  return request.get<any>({
    url: '/api/system/track/replay/detail',
    params,
    showErrorMessage: false
  })
}
/**
 * 回放块内容：rrweb 事件数组 JSON 明文（服务端已解压，R 信封外的裸 JSON 端点 → skipEnvelope）。
 * 块缺失/过期时后端走 R 错误信封，此处原样抛出由调用方容错跳过。
 */
export function fetchTrackReplayData(params: Record<string, any>) {
  return request.get<any[]>({ url: '/api/system/track/replay/data', params, skipEnvelope: true })
}

// ===== 埋点应用 =====
export function fetchTrackAppPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/app/page', params })
}
/** 新增（服务端生成 appKey 并返回完整实体）/ 编辑（带 id） */
export function fetchSaveTrackApp(data: Record<string, any>) {
  return request.post<any>({ url: '/api/system/track/app/submit', data })
}
export function fetchRemoveTrackApp(id: number | string) {
  return request.post<void>({ url: '/api/system/track/app/remove', data: { id } })
}

// ===== 事件定义 =====
export function fetchTrackEventDefPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/track/event-def/page', params })
}
/** 仅 displayName/description/owner/status 可改 */
export function fetchSaveTrackEventDef(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/track/event-def/submit', data })
}
