import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    params
    // showSuccessMessage: true // 显示成功消息
    // showErrorMessage: false // 不显示错误消息
  })
}

/**
 * 双因子登录二次校验
 * @param params twoFactorToken + code
 */
export function fetchTwoFactor(params: { twoFactorToken: string; code: string }) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/two-factor',
    data: params
  })
}

/**
 * 获取图形验证码
 * @returns 验证码唯一标识 + Base64 图片
 */
export function fetchCaptcha() {
  return request.get<Api.Auth.Captcha>({
    url: '/api/auth/captcha'
  })
}

/** SM2 传输公钥（登录/改密/注册前取，用于前端加密密码；gmEnabled=false 时明文传输） */
export function fetchSm2PublicKey() {
  return request.get<{ gmEnabled: boolean; publicKey: string | null }>({
    url: '/api/auth/sm2-public-key'
  })
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: '/api/auth/info'
  })
}

/** 自助注册 */
export function fetchRegister(data: {
  username: string
  password: string
  nickname?: string
  phone?: string
}) {
  return request.post<null>({ url: '/api/auth/register', data })
}

/** 短信登录：发送验证码（开发回显 code） */
export function fetchSmsCode(phone: string) {
  return request.post<{ code?: string }>({ url: '/api/auth/sms-code', data: { phone } })
}

/** 短信登录：校验验证码换 token */
export function fetchSmsLogin(data: { phone: string; code: string }) {
  return request.post<Api.Auth.LoginResponse>({ url: '/api/auth/sms-login', data })
}

/** 社交登录：获取第三方授权跳转地址（state 落 Redis 防 CSRF） */
export function fetchSocialRender(source: string) {
  return request.get<{ authorizeUrl: string }>({ url: `/api/auth/social/render/${source}` })
}

/** 社交登录：只传 source+code+state，openId 由服务端换取（管理端未绑定会被拒） */
export function fetchSocialLogin(data: { source: string; code: string; state: string }) {
  return request.post<Api.Auth.LoginResponse>({ url: '/api/auth/social/login', data })
}

/** 社交账号绑定（需登录，服务端换 openId） */
export function fetchSocialBind(data: { source: string; code: string; state: string }) {
  return request.post<null>({ url: '/api/auth/social/bind', data })
}

/** 社交账号解绑（需登录） */
export function fetchSocialUnbind(source: string) {
  return request.del<null>({ url: `/api/auth/social/unbind/${source}` })
}
