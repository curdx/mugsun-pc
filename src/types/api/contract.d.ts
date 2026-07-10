import type { components } from './openapi'

/**
 * 全局免导入契约类型：接口响应/分页/查询三件套。
 * 与 openapi 生成类型协同——业务实体走 openapi(ApiSchema)，信封/查询走此处契约。
 */
declare global {
  /** 后端统一响应 R<T>（request 层已解包 data，此为完整信封类型，供参考/类型守卫） */
  type ApiRes<T = unknown> = {
    code: number
    success: boolean
    msg: string
    data: T
    dataType?: string | null
  }

  /** mybatis-flex 分页体（request 解包后 api 直接返回此类型） */
  type PageRes<T = unknown> = {
    records: T[]
    totalRow: number
    pageNumber: number
    pageSize: number
  }

  /** 分页查询基参（后端 pageNum/pageSize） */
  type PageQuery = {
    pageNum?: number
    pageSize?: number
  }

  /** openapi 生成 schema 快捷取用：ApiSchema<'SysUser'> —— 后端字段变更自动跟随 */
  type ApiSchema<K extends keyof components['schemas']> = components['schemas'][K]
}

export {}
