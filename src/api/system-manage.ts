import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { useUserStore } from '@/store/modules/user'

// 获取用户列表（对接后端 /system/user/page）
export function fetchGetUserList(params: Record<string, any>) {
  return request.get<any>({
    url: '/api/system/user/page',
    params
  })
}

// 保存用户（新增/编辑，对接后端 /system/user/submit）
export function fetchSaveUser(data: Record<string, any>) {
  return request.post<void>({
    url: '/api/system/user/submit',
    data
  })
}

// 删除用户（批量，主键数组走 JSON 请求体）
export function fetchRemoveUser(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/user/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 导出用户（认证 GET 二进制，原生 fetch 触发下载）
export async function exportUser(): Promise<void> {
  const { accessToken } = useUserStore()
  const res = await fetch('/api/system/user/export', {
    headers: accessToken ? { Authorization: accessToken } : undefined
  })
  if (!res.ok) throw new Error('导出失败')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '用户数据.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

// 导入用户（multipart 上传）
export function importUser(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<void>({
    url: '/api/system/user/import',
    data: form
  })
}

// 重置密码（批量，默认 123456）
export function fetchResetPassword(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/user/reset-password',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
// 启用/停用用户
export function fetchUserStatus(id: number | string, status: number) {
  return request.post<void>({ url: '/api/system/user/status', data: { id, status } })
}
// 用户已授权角色 id（回显）
export function fetchUserRoleIds(userId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/user/role-ids',
    params: { userId }
  })
}
// 用户授权角色（body 信封 {userId, roleIds}）
export function fetchGrantUser(userId: number | string, roleIds: Array<number | string>) {
  return request.post<void>({ url: '/api/system/user/grant', data: { userId, roleIds } })
}
// 角色下拉选项
export function fetchRoleSelect() {
  return request.get<Array<{ label: string; value: string }>>({
    url: '/api/system/role/select'
  })
}

// ===== 部门 =====
export function fetchDeptTree() {
  return request.get<any[]>({ url: '/api/system/dept/tree' })
}
export function fetchDeptSelect() {
  return request.get<Array<{ label: string; value: string }>>({ url: '/api/system/dept/select' })
}
export function fetchSaveDept(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/dept/submit', data })
}
export function fetchRemoveDept(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/dept/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 岗位 =====
export function fetchGetPostList(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/post/page', params })
}
export function fetchSavePost(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/post/submit', data })
}
export function fetchRemovePost(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/post/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取角色列表
// ===== 角色 =====
export function fetchGetRoleList(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/role/page', params })
}
export function fetchSaveRole(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/role/submit', data })
}
export function fetchRemoveRole(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/role/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
// 角色已授权菜单 id 集合（授权树回显）
export function fetchRoleMenuIds(roleId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/role/menu-ids',
    params: { roleId }
  })
}
// 角色自定义部门 id 集合（data_scope=5 回显）
export function fetchRoleDeptIds(roleId: number | string) {
  return request.get<Array<number | string>>({
    url: '/api/system/role/dept-ids',
    params: { roleId }
  })
}
// 角色授权菜单（body 信封 {roleId, menuIds}）
export function fetchGrantRole(roleId: number | string, menuIds: Array<number | string>) {
  return request.post<void>({
    url: '/api/system/role/grant',
    data: { roleId, menuIds }
  })
}
// 菜单树
export function fetchMenuTree() {
  return request.get<any[]>({ url: '/api/system/menu/tree' })
}
export function fetchSaveMenu(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/menu/submit', data })
}
export function fetchRemoveMenu(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/menu/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 参数 =====
export function fetchParamList() {
  return request.get<any[]>({ url: '/api/system/param/list' })
}
export function fetchSaveParam(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/param/submit', data })
}
export function fetchRemoveParam(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/param/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 邮件模板 =====
export function fetchMailTemplatePage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/mail-template/page', params })
}
export function fetchSaveMailTemplate(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/mail-template/submit', data })
}
export function fetchRemoveMailTemplate(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/mail-template/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
export function fetchSendTestMail(data: Record<string, any>) {
  return request.post<string>({ url: '/api/system/mail-template/send-test', data })
}

// ===== 系统字典（树） =====
export function fetchDictTree() {
  return request.get<any[]>({ url: '/api/system/dict/tree' })
}
export function fetchSaveDict(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/dict/submit', data })
}
export function fetchRemoveDict(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/dict/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 业务字典（树） =====
export function fetchDictBizTree() {
  return request.get<any[]>({ url: '/api/system/dict-biz/tree' })
}
export function fetchSaveDictBiz(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/dict-biz/submit', data })
}
export function fetchRemoveDictBiz(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/dict-biz/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 租户 =====
export function fetchTenantList() {
  return request.get<any[]>({ url: '/api/system/tenant/list' })
}
export function fetchCreateTenant(data: Record<string, any>) {
  return request.post<string>({ url: '/api/system/tenant/create', data })
}
export function fetchRemoveTenant(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/tenant/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 通知公告 =====
export function fetchNoticePage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/notice/page', params })
}
export function fetchNoticeDetail(id: number | string) {
  return request.get<any>({ url: '/api/system/notice/detail', params: { id } })
}
export function fetchSaveNotice(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/notice/submit', data })
}
export function fetchRemoveNotice(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/notice/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
/** 某公告的阅读记录分页（谁读了/次数/首末时间） */
export function fetchNoticeReadPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/notice/read/page', params })
}
/** 我可见的通知分页（按可见范围过滤 + 已读标记） */
export function fetchMyNoticePage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/notice/my/page', params })
}
/** 标记通知已读（幂等，首读计 UV） */
export function fetchReadNotice(noticeId: number | string) {
  return request.post<void>({ url: `/api/system/notice/read/${noticeId}` })
}
/** 我的未读通知数 */
export function fetchMyNoticeUnreadCount() {
  return request.get<number>({ url: '/api/system/notice/my/unread-count' })
}

// ===== 附件 =====
export function fetchAttachList() {
  return request.get<any[]>({ url: '/api/system/file/list' })
}
export function fetchUploadFile(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<any>({ url: '/api/system/file/upload', data: form })
}
export function fetchRemoveAttach(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/file/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ===== 操作日志 =====
export function fetchOperLogPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/oper-log/page', params })
}

// ===== 数据变更记录 =====
export function fetchDataAuditPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/data-audit/page', params })
}
export function fetchDataAuditDetail(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/data-audit/detail', params })
}

// ===== 对象存储配置 =====
export function fetchOssPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/oss/page', params })
}
export function fetchSaveOss(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/oss/submit', data })
}
export function fetchRemoveOss(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/oss/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
export function fetchEnableOss(id: number | string) {
  return request.post<void>({ url: `/api/system/oss/enable/${id}` })
}

// ===== 短信平台配置 =====
export function fetchSmsPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/sms/page', params })
}
export function fetchSaveSms(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/sms/submit', data })
}
export function fetchRemoveSms(ids: (number | string)[] | number | string) {
  return request.post<void>({
    url: '/api/system/sms/remove',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
export function fetchEnableSms(id: number | string) {
  return request.post<void>({ url: `/api/system/sms/enable/${id}` })
}

// ===== 在线代码生成 =====
export function fetchGenDatasource() {
  return request.get<any>({ url: '/api/system/gen/datasource' })
}
export function fetchGenTables() {
  return request.get<any[]>({ url: '/api/system/gen/tables' })
}
export function fetchGenColumns(table: string) {
  return request.get<any>({ url: '/api/system/gen/columns', params: { table } })
}
export function fetchGenPreview(data: Record<string, any>) {
  return request.post<Record<string, string>>({ url: '/api/system/gen/preview', data })
}
export function fetchGenConfig(table: string) {
  return request.get<any>({ url: '/api/system/gen/config', params: { table } })
}
export function fetchSaveGenConfig(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/gen/config/save', data })
}

// ===== 工作流治理 =====
export function fetchFlowDefinitions() {
  return request.get<any[]>({ url: '/api/system/flow/definitions' })
}
export function fetchFlowDeploy() {
  return request.post<string>({ url: '/api/system/flow/deploy' })
}
export function fetchFlowStart(businessId: string) {
  return request.post<string>({ url: `/api/system/flow/start/${encodeURIComponent(businessId)}` })
}
export function fetchFlowMyTodo() {
  return request.get<any[]>({ url: '/api/system/flow/my-todo' })
}
export function fetchFlowHandle(taskId: number | string) {
  return request.post<string>({ url: `/api/system/flow/handle/${taskId}` })
}
export function fetchFlowReject(taskId: number | string) {
  return request.post<string>({ url: `/api/system/flow/reject/${taskId}` })
}
export function fetchFlowHistory(instanceId: number | string) {
  return request.get<any[]>({ url: '/api/system/flow/history', params: { instanceId } })
}

// ===== 定时任务 =====
export function fetchJobList() {
  return request.get<any[]>({ url: '/api/system/job/list' })
}
export function fetchSaveJob(data: Record<string, any>) {
  return request.post<number>({ url: '/api/system/job/save', data })
}
export function fetchRunJob(jobId: number | string) {
  return request.post<string>({ url: `/api/system/job/run/${jobId}` })
}
export function fetchEnableJob(jobId: number | string) {
  return request.post<void>({ url: `/api/system/job/enable/${jobId}` })
}
export function fetchDisableJob(jobId: number | string) {
  return request.post<void>({ url: `/api/system/job/disable/${jobId}` })
}
export function fetchDeleteJob(jobId: number | string) {
  return request.post<void>({ url: `/api/system/job/delete/${jobId}` })
}
export function fetchJobInstances(jobId: number | string) {
  return request.get<any[]>({ url: '/api/system/job/instances', params: { jobId } })
}

// ===== 报表 =====
export function fetchReportDatasets() {
  return request.get<any[]>({ url: '/api/system/report/datasets' })
}
export function fetchReportList() {
  return request.get<any[]>({ url: '/api/system/report/list' })
}
export function fetchSaveReport(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/report/submit', data })
}
export function fetchRemoveReport(id: number | string) {
  return request.post<void>({ url: `/api/system/report/remove/${id}` })
}
export function fetchReportPreview(id: number | string) {
  return request.get<any[]>({ url: '/api/system/report/preview', params: { id } })
}

// ===== 登录日志 =====
export function fetchLoginLogPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/login-log/page', params })
}

// ===== API 密钥 =====
export function fetchApiKeyPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/api-key/page', params })
}
export function fetchGenerateApiKey(data: Record<string, any>) {
  return request.post<any>({ url: '/api/system/api-key/generate', data })
}
export function fetchEnableApiKey(id: number | string) {
  return request.post<void>({ url: `/api/system/api-key/enable/${id}` })
}
export function fetchDisableApiKey(id: number | string) {
  return request.post<void>({ url: `/api/system/api-key/disable/${id}` })
}
export function fetchRemoveApiKey(id: number | string) {
  return request.post<void>({ url: `/api/system/api-key/remove/${id}` })
}

// ===== 行政区划 =====
export function fetchRegionLazyTree(parentCode: string) {
  return request.get<any[]>({ url: '/api/system/region/lazy-tree', params: { parentCode } })
}
export function fetchSaveRegion(data: Record<string, any>) {
  return request.post<void>({ url: '/api/system/region/submit', data })
}
export function fetchRemoveRegion(id: number | string) {
  return request.post<void>({ url: `/api/system/region/remove/${id}` })
}
export async function exportRegion(): Promise<void> {
  const { accessToken } = useUserStore()
  const res = await fetch('/api/system/region/export', {
    headers: accessToken ? { Authorization: accessToken } : undefined
  })
  if (!res.ok) throw new Error('导出失败')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '行政区划.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
export function importRegion(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<number>({ url: '/api/system/region/import', data: form })
}

// ===== 个人中心 =====
export function fetchUpdateInfo(data: Record<string, any>) {
  return request.post<void>({ url: '/api/auth/update-info', data })
}
export function fetchUpdatePassword(data: Record<string, any>) {
  return request.post<void>({ url: '/api/auth/update-password', data })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus'
  })
}
