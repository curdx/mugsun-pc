import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        icon: 'ri:user-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        icon: 'ri:user-settings-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'dept',
      name: 'Dept',
      component: '/system/dept',
      meta: {
        title: '部门管理',
        icon: 'ri:organization-chart',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'post',
      name: 'Post',
      component: '/system/post',
      meta: {
        title: '岗位管理',
        icon: 'ri:contacts-book-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'param',
      name: 'Param',
      component: '/system/param',
      meta: {
        title: '参数管理',
        icon: 'ri:settings-3-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'crypto',
      name: 'CryptoDemo',
      component: '/system/crypto',
      meta: {
        title: '接口加解密',
        icon: 'ri:shield-keyhole-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'mail-template',
      name: 'MailTemplate',
      component: '/system/mail-template',
      meta: {
        title: '邮件模板',
        icon: 'ri:mail-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'dict',
      name: 'Dict',
      component: '/system/dict',
      meta: {
        title: '字典管理',
        icon: 'ri:book-2-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'dict-biz',
      name: 'DictBiz',
      component: '/system/dict-biz',
      meta: {
        title: '业务字典',
        icon: 'ri:book-marked-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'tenant',
      name: 'Tenant',
      component: '/system/tenant',
      meta: {
        title: '租户管理',
        icon: 'ri:building-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'notice',
      name: 'Notice',
      component: '/system/notice',
      meta: {
        title: '通知公告',
        icon: 'ri:notification-2-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'attach',
      name: 'Attach',
      component: '/system/attach',
      meta: {
        title: '附件管理',
        icon: 'ri:folder-2-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'oss',
      name: 'Oss',
      component: '/system/oss',
      meta: {
        title: '存储配置',
        icon: 'ri:cloud-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'sms',
      name: 'Sms',
      component: '/system/sms',
      meta: {
        title: '短信配置',
        icon: 'ri:message-2-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'gen',
      name: 'Gen',
      component: '/system/gen',
      meta: {
        title: '代码生成',
        icon: 'ri:code-box-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'flow-def',
      name: 'FlowDef',
      component: '/system/flow-def',
      meta: {
        title: '流程定义',
        icon: 'ri:git-branch-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'flow-todo',
      name: 'FlowTodo',
      component: '/system/flow-todo',
      meta: {
        title: '待办工作台',
        icon: 'ri:task-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'job',
      name: 'Job',
      component: '/system/job',
      meta: {
        title: '定时任务',
        icon: 'ri:timer-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'report',
      name: 'Report',
      component: '/system/report',
      meta: {
        title: '报表管理',
        icon: 'ri:bar-chart-2-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'login-log',
      name: 'LoginLog',
      component: '/system/login-log',
      meta: {
        title: '登录日志',
        icon: 'ri:shield-keyhole-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
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
      path: 'region',
      name: 'Region',
      component: '/system/region',
      meta: {
        title: '行政区划',
        icon: 'ri:map-pin-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'log',
      name: 'OperLog',
      component: '/system/log',
      meta: {
        title: '操作日志',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'data-audit',
      name: 'DataAudit',
      component: '/system/data-audit',
      meta: {
        title: '变更记录',
        icon: 'ri:history-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        icon: 'ri:user-line',
        isHide: true,
        keepAlive: true,
        isHideTab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        icon: 'ri:menu-line',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    }
  ]
}
