/**
 * 字典域 api 契约类型（openapi 生成实体 + 表单）
 * 系统字典 / 业务字典均为树形实体，后端字段变更 `pnpm gen:api` 重生成后前端类型自动跟随。
 */

/** 系统字典实体（树形，openapi 生成） */
export type DictVO = ApiSchema<'SysDict'>

/** 业务字典实体（树形，openapi 生成） */
export type DictBizVO = ApiSchema<'SysDictBiz'>

/** 系统字典新增/编辑表单 */
export type DictForm = Partial<
  Pick<
    DictVO,
    'id' | 'parentId' | 'code' | 'dictKey' | 'dictValue' | 'sort' | 'remark' | 'isSealed' | 'color'
  >
>

/** 业务字典新增/编辑表单 */
export type DictBizForm = Partial<
  Pick<
    DictBizVO,
    'id' | 'parentId' | 'code' | 'dictKey' | 'dictValue' | 'sort' | 'remark' | 'isSealed'
  >
>
