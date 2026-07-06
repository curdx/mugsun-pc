import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'

/**
 * 导出所有模块化路由（仅真实功能模块，已移除模板演示路由）
 * dashboard 置于首位，作为登录后落地页
 */
export const routeModules: AppRouteRecord[] = [dashboardRoutes, systemRoutes]
