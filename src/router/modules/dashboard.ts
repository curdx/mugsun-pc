import { AppRouteRecord } from '@/types/router'

/**
 * 工作台（登录后落地页，承载更新日志等首页卡片）
 */
export const dashboardRoutes: AppRouteRecord = {
  path: '/dashboard',
  name: 'Dashboard',
  component: '/index/index',
  meta: {
    title: '工作台',
    icon: 'ri:dashboard-line'
  },
  children: [
    {
      path: 'console',
      name: 'Console',
      component: '/dashboard/console',
      meta: {
        title: '工作台',
        icon: 'ri:dashboard-line',
        keepAlive: true
      }
    }
  ]
}
