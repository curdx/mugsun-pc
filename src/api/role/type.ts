/**
 * 角色域 api 契约类型（Query/VO/Form 三件套 + openapi 生成实体）
 * 业务实体走 openapi(ApiSchema)——后端字段变更 `pnpm gen:api` 重生成后前端类型自动跟随。
 */

/** 角色实体（openapi 生成） */
export type RoleVO = ApiSchema<'SysRole'>

/** 角色分页体（openapi 生成） */
export type RolePage = ApiSchema<'PageSysRole'>

/** 角色查询条件 */
export interface RoleQuery {
  roleName?: string
  roleCode?: string
}

/** 角色分页查询（查询条件 + 分页三件套） */
export interface RolePageQuery extends RoleQuery, PageQuery {}

/** 角色新增/编辑表单 */
export type RoleForm = Partial<
  Pick<RoleVO, 'id' | 'roleName' | 'roleCode' | 'sort' | 'dataScope' | 'deptIds'>
>

/** 通用下拉选项 */
export interface SelectOption {
  label: string
  value: string
}
