import { AppRouteRecord } from '@/types/router'

/**
 * 埋点分析应用（顶级应用分组）：数据概览、事件分析、性能分析、错误监控、会话回放与接入管理。
 */
export const trackRoutes: AppRouteRecord = {
  path: '/track',
  name: 'Track',
  component: '/index/index',
  meta: {
    title: '埋点分析',
    icon: 'ri:line-chart-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'overview',
      name: 'TrackOverview',
      component: '/track/overview',
      meta: {
        title: '数据概览',
        icon: 'ri:bar-chart-box-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'event',
      name: 'TrackEvent',
      component: '/track/event',
      meta: {
        title: '事件分析',
        icon: 'ri:cursor-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'perf',
      name: 'TrackPerf',
      component: '/track/perf',
      meta: {
        title: '性能分析',
        icon: 'ri:speed-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'error',
      name: 'TrackError',
      component: '/track/error',
      meta: {
        title: '错误监控',
        icon: 'ri:bug-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'replay',
      name: 'TrackReplay',
      component: '/track/replay',
      meta: {
        title: '会话回放',
        icon: 'ri:play-circle-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'user',
      name: 'TrackUser',
      component: '/track/user',
      meta: {
        title: '用户细查',
        icon: 'ri:user-search-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'app',
      name: 'TrackApp',
      component: '/track/app',
      meta: {
        title: '接入管理',
        icon: 'ri:plug-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
