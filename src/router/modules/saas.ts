import { AppRouteRecord } from '@/types/router'

/**
 * 租户运营应用（顶级应用分组）：多租户与独立数据源、业务演示。
 */
export const saasRoutes: AppRouteRecord = {
  path: '/saas',
  name: 'SaasOps',
  component: '/index/index',
  meta: {
    title: 'menus.saas.title',
    icon: 'ri:community-line',
    roles: ['R_SUPER']
  },
  children: [
    {
      path: 'tenant',
      name: 'Tenant',
      component: '/system/tenant',
      meta: {
        title: 'menus.saas.tenant',
        icon: 'ri:building-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'tenant-package',
      name: 'TenantPackage',
      component: '/system/tenant-package',
      meta: {
        title: 'menus.saas.tenantPackage',
        icon: 'ri:price-tag-3-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'tenant-datasource',
      name: 'TenantDatasource',
      component: '/system/tenant-datasource',
      meta: {
        title: 'menus.saas.tenantDatasource',
        icon: 'ri:database-2-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'customer',
      name: 'Customer',
      component: '/system/customer',
      meta: {
        title: 'menus.saas.customer',
        icon: 'ri:contacts-book-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    }
  ]
}
