import request from '@/utils/http'

/** 解锁账号：按登录日志行清除 租户+账号 维度登录失败锁定（sys:login-log:unlock） */
export function unlockLoginAccount(id: number | string) {
  return request.post<void>({ url: '/api/system/login-log/unlock', data: { id } })
}
