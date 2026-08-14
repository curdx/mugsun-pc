import { AppRouteRecord } from '@/types/router'

/**
 * 开放平台应用（顶级应用分组）：API 密钥与 OAuth2 开放接口。
 */
export const openPlatformRoutes: AppRouteRecord = {
  path: '/open-platform',
  name: 'OpenPlatform',
  component: '/index/index',
  meta: {
    title: 'menus.openPlatform.title',
    icon: 'ri:apps-2-line',
    roles: ['R_SUPER']
  },
  children: [
    {
      path: 'api-key',
      name: 'ApiKey',
      component: '/system/api-key',
      meta: {
        title: 'menus.openPlatform.apiKey',
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
        title: 'menus.openPlatform.oauthClient',
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
        title: 'menus.openPlatform.oauthDebug',
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
        title: 'menus.openPlatform.oauthLog',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    }
  ]
}
