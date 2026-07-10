import App from './App.vue'
import { createApp } from 'vue'
import { initStore } from './store'                 // Store
import { initRouter } from './router'               // Router
import language from './locales'                    // 国际化
import ElementPlus from 'element-plus'              // form-create 动态渲染需全局注册
import 'element-plus/dist/index.css'                // element-plus 基础样式（置于主题前，主题覆盖生效）
import formCreate from '@form-create/element-ui'    // 低代码表单运行时渲染
import FcDesigner from '@form-create/designer'      // 低代码表单设计器
import '@styles/core/tailwind.css'                  // tailwind
import '@styles/index.scss'                         // 样式
import '@utils/sys/console.ts'                      // 控制台输出内容
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'

document.addEventListener(
  'touchstart',
  function () {},
  { passive: false }
)

const app = createApp(App)
initStore(app)
initRouter(app)
setupGlobDirectives(app)
setupErrorHandle(app)

app.use(ElementPlus)
app.use(formCreate)
app.use(FcDesigner)
app.use(language)
app.mount('#app')