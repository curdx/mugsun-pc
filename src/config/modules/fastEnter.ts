/**
 * 快速入口配置
 * 包含：应用列表、快速链接等配置
 * 仅保留平台真实存在的入口（死链/演示入口已清理）
 */
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  // 显示条件（屏幕宽度）
  minWidth: 1200,
  // 应用列表（name/description 为 i18n key，由渲染侧 $t 解析）
  applications: [
    {
      name: 'menus.dashboard.console',
      description: 'components.fastEnter.consoleDesc',
      icon: 'ri:pie-chart-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'Console'
    },
    {
      name: 'menus.system.changelog',
      description: 'components.fastEnter.changelogDesc',
      icon: 'ri:gamepad-line',
      iconColor: '#38C0FC',
      enabled: true,
      order: 2,
      routeName: 'ChangeLog'
    }
  ],
  // 快速链接（name 为 i18n key）
  quickLinks: [
    {
      name: 'menus.login.title',
      enabled: true,
      order: 1,
      routeName: 'Login'
    },
    {
      name: 'menus.register.title',
      enabled: true,
      order: 2,
      routeName: 'Register'
    },
    {
      name: 'menus.forgetPassword.title',
      enabled: true,
      order: 3,
      routeName: 'ForgetPassword'
    },
    {
      name: 'menus.system.userCenter',
      enabled: true,
      order: 4,
      routeName: 'UserCenter'
    }
  ]
}

export default Object.freeze(fastEnterConfig)
