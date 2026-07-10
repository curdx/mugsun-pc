import { AppRouteRecord } from '@/types/router'

/**
 * 开放平台应用（顶级应用分组）：API 密钥与 OAuth2 开放接口。
 */
export const openPlatformRoutes: AppRouteRecord = {
  path: '/open-platform',
  name: 'OpenPlatform',
  component: '/index/index',
  meta: {
    title: '开放平台',
    icon: 'ri:apps-2-line',
    roles: ['R_SUPER']
  },
  children: [
    {
      path: 'api-key',
      name: 'ApiKey',
      component: '/system/api-key',
      meta: {
        title: 'API密钥',
        icon: 'ri:key-2-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'oauth-client',
      name: 'OauthClient',
      component: '/system/oauth-client',
      meta: {
        title: '客户端管理',
        icon: 'ri:apps-2-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'oauth-debug',
      name: 'OauthDebug',
      component: '/system/oauth-debug',
      meta: {
        title: '接口调试',
        icon: 'ri:terminal-box-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'oauth-log',
      name: 'OauthLog',
      component: '/system/oauth-log',
      meta: {
        title: '调用日志',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    }
  ]
}
