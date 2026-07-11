import request from '@/utils/http'

// ===== OAuth2 客户端（开放平台） =====
export function fetchOauthClientPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/oauth-client/page', params })
}
export function fetchSaveOauthClient(data: Record<string, any>) {
  return request.post<any>({ url: '/api/system/oauth-client/save', data })
}
export function fetchResetOauthSecret(id: number | string) {
  return request.post<any>({ url: `/api/system/oauth-client/reset-secret/${id}` })
}
export function fetchEnableOauthClient(id: number | string) {
  return request.post<void>({ url: `/api/system/oauth-client/enable/${id}` })
}
export function fetchDisableOauthClient(id: number | string) {
  return request.post<void>({ url: `/api/system/oauth-client/disable/${id}` })
}
export function fetchRemoveOauthClient(id: number | string) {
  return request.post<void>({ url: `/api/system/oauth-client/remove/${id}` })
}

// ===== 开放接口调用日志 =====
export function fetchOauthLogPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/oauth-log/page', params })
}

// ===== OAuth2 授权同意（SPA 内部，R 信封；标准 token/introspect/revoke 为原始 JSON 由页面裸 fetch） =====
export function fetchOauthAuthorizeInfo(params: { client_id: string; scope?: string }) {
  return request.get<{ clientId: string; clientName: string; scopes: string[] }>({
    url: '/api/oauth2/authorize/info',
    params
  })
}
export function fetchOauthAuthorizeConfirm(data: Record<string, any>) {
  return request.post<{ code: string; redirectUri?: string; state?: string }>({
    url: '/api/oauth2/authorize/confirm',
    data
  })
}
