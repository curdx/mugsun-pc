import request from '@/utils/http'

// ===== 登录客户端差异化策略 =====
export function fetchClientPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/client/page', params })
}
export function fetchSaveClient(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/client/save', data })
}
export function fetchRemoveClient(ids: Array<number | string>) {
  return request.post<void>({ url: '/api/system/client/remove', data: ids })
}
export function fetchEnableClient(id: number | string) {
  return request.post<void>({ url: `/api/system/client/enable/${id}` })
}
export function fetchDisableClient(id: number | string) {
  return request.post<void>({ url: `/api/system/client/disable/${id}` })
}
