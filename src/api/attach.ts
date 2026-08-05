import request from '@/utils/http'

/** 附件分页（真分页：pageNum/pageSize + filename 模糊 / ext 精确） */
export function fetchAttachPage(params: Record<string, any>) {
  return request.get<any>({ url: '/api/system/file/page', params })
}
