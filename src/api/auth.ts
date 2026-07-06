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

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: '/api/auth/info'
  })
}
