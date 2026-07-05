import { AppRouteRecord } from '@/types/router'
import { systemRoutes } from './system'

/**
 * 导出所有模块化路由（仅真实功能模块，已移除模板演示路由）
 */
export const routeModules: AppRouteRecord[] = [systemRoutes]
