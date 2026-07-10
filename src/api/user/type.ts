/**
 * 用户域 api 契约类型（Query/VO/Form 三件套 + openapi 生成实体）
 * 业务实体走 openapi(ApiSchema)——后端字段变更 `pnpm gen:api` 重生成后前端类型自动跟随。
 */

/** 用户实体（openapi 生成） */
export type UserVO = ApiSchema<'SysUser'>

/** 用户分页体（openapi 生成） */
export type UserPage = ApiSchema<'PageSysUser'>

/** 用户查询条件 */
export interface UserQuery {
  username?: string
  nickname?: string
  status?: number
}

/** 用户分页查询（查询条件 + 分页三件套） */
export interface UserPageQuery extends UserQuery, PageQuery {}

/** 用户新增/编辑表单 */
export type UserForm = Partial<
  Pick<UserVO, 'id' | 'username' | 'nickname' | 'phone' | 'idCard' | 'password' | 'status'>
>
