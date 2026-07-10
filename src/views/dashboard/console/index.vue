<!-- 工作台：登录落地页——概览统计 + echarts 图表 + 我的待办/通知/更新日志卡 + 可配置快捷入口 -->
<template>
  <div class="console-page">
    <!-- 概览统计瓦片 -->
    <ElRow :gutter="16">
      <ElCol v-for="s in statTiles" :key="s.key" :xs="12" :sm="12" :md="6">
        <div class="art-card stat-tile" @click="s.path && go(s.path)">
          <div class="stat-icon" :style="{ background: s.bg }">{{ s.icon }}</div>
          <div class="stat-body">
            <div class="stat-count">{{ s.count }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 图表 -->
    <ElRow :gutter="16" class="mt-4">
      <ElCol :xs="24" :lg="12">
        <div class="art-card chart-card">
          <p class="card-title">用户状态分布</p>
          <div ref="pieRef" class="chart-box"></div>
        </div>
      </ElCol>
      <ElCol :xs="24" :lg="12" class="mt-4 mt-lg-0">
        <div class="art-card chart-card">
          <p class="card-title">租户用户数</p>
          <div ref="barRef" class="chart-box"></div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 卡片：待办 / 通知 / 更新日志 -->
    <ElRow :gutter="16" class="mt-4">
      <ElCol :xs="24" :lg="8">
        <div class="art-card list-card" v-loading="todoLoading">
          <div class="card-head">
            <span class="card-title">我的待办</span>
            <ElButton link type="primary" size="small" @click="go('/system/flow-todo')">
              全部
            </ElButton>
          </div>
          <ElEmpty v-if="!todoList.length" description="暂无待办" :image-size="60" />
          <ul v-else class="mini-list">
            <li v-for="t in todoList" :key="t.taskId" @click="go('/system/flow-todo')">
              <span class="mini-title">{{ t.flowName }} · {{ t.nodeName }}</span>
              <span class="mini-sub">{{ fmt(t.createTime) }}</span>
            </li>
          </ul>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="8" class="mt-4 mt-lg-0">
        <div class="art-card list-card" v-loading="noticeLoading">
          <div class="card-head">
            <span class="card-title">
              通知公告
              <ElBadge
                v-if="overview.noticeUnread"
                :value="overview.noticeUnread"
                class="unread-badge"
              />
            </span>
            <ElButton link type="primary" size="small" @click="go('/system/my-notice')"
              >全部</ElButton
            >
          </div>
          <ElEmpty v-if="!noticeList.length" description="暂无通知" :image-size="60" />
          <ul v-else class="mini-list">
            <li v-for="n in noticeList" :key="n.id" @click="go('/system/my-notice')">
              <span class="mini-title">
                <ElTag v-if="n.isTop === 1" type="danger" size="small" class="top-tag">顶</ElTag>
                {{ n.title }}
              </span>
              <span class="mini-sub">{{ fmt(n.releaseTime || n.createTime) }}</span>
            </li>
          </ul>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="8" class="mt-4 mt-lg-0">
        <ArtTimelineListCard
          title="更新日志"
          subtitle="最近版本变更"
          :list="changelogList"
          :max-count="6"
        />
      </ElCol>
    </ElRow>

    <!-- 可配置快捷入口 -->
    <div class="art-card p-5 mt-4">
      <div class="card-head">
        <span class="card-title">快捷入口</span>
        <ElButton link type="primary" size="small" @click="openShortcutEditor">编辑</ElButton>
      </div>
      <ElEmpty
        v-if="!shortcuts.length"
        description="未配置快捷入口，点击右上角编辑添加"
        :image-size="60"
      />
      <div v-else class="quick-grid">
        <div v-for="q in shortcuts" :key="q.path" class="quick-item" @click="go(q.path)">
          <span class="quick-name">{{ q.name }}</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口编辑弹窗 -->
    <ElDialog v-model="editorVisible" title="配置快捷入口" width="560px" align-center>
      <p class="editor-tip">勾选需要在工作台展示的功能页（可多选）</p>
      <ElCheckboxGroup v-model="selectedPaths" class="catalog-grid">
        <ElCheckbox v-for="c in CATALOG" :key="c.path" :value="c.path" :label="c.path">
          {{ c.name }}
        </ElCheckbox>
      </ElCheckboxGroup>
      <template #footer>
        <ElButton @click="editorVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="saveShortcuts">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { echarts } from '@/plugins/echarts'
  import { ElMessage } from 'element-plus'
  import { fetchChangelogRecent } from '@/api/feedback'
  import { fetchFlowMyTodo, fetchMyNoticePage } from '@/api/system-manage'
  import {
    fetchWorkbenchOverview,
    fetchWorkbenchShortcuts,
    saveWorkbenchShortcuts
  } from '@/api/workbench'

  defineOptions({ name: 'Console' })

  const router = useRouter()
  const go = (path: string) => router.push(path)

  // ===== 快捷入口候选目录（真实路由，验证过 path）=====
  const CATALOG = [
    { name: '用户管理', path: '/system/user' },
    { name: '角色管理', path: '/system/role' },
    { name: '菜单管理', path: '/system/menu' },
    { name: '部门管理', path: '/system/dept' },
    { name: '岗位管理', path: '/system/post' },
    { name: '字典管理', path: '/system/dict' },
    { name: '参数管理', path: '/system/param' },
    { name: '租户管理', path: '/saas/tenant' },
    { name: '通知公告', path: '/system/notice' },
    { name: '我的通知', path: '/system/my-notice' },
    { name: '代码生成', path: '/system/gen' },
    { name: '定时任务', path: '/system/job' },
    { name: '报表管理', path: '/system/report' },
    { name: '待办工作台', path: '/system/flow-todo' },
    { name: '帮助文档', path: '/system/help-doc' },
    { name: '更新日志', path: '/system/changelog' }
  ]
  const DEFAULT_PATHS = [
    '/system/user',
    '/system/role',
    '/system/menu',
    '/system/dict',
    '/system/notice',
    '/system/changelog'
  ]

  const fmt = (t?: string) => (t || '').replace('T', ' ').slice(0, 16)

  // ===== 概览统计 =====
  const overview = reactive<any>({
    userCount: 0,
    deptCount: 0,
    roleCount: 0,
    todoCount: 0,
    noticeUnread: 0
  })
  const statTiles = computed(() => [
    {
      key: 'user',
      label: '用户数',
      count: overview.userCount,
      path: '/system/user',
      bg: '#e8f3ff',
      icon: '👤'
    },
    {
      key: 'dept',
      label: '部门数',
      count: overview.deptCount,
      path: '/system/dept',
      bg: '#e8fff3',
      icon: '🏢'
    },
    {
      key: 'role',
      label: '角色数',
      count: overview.roleCount,
      path: '/system/role',
      bg: '#fff5e8',
      icon: '🔑'
    },
    {
      key: 'todo',
      label: '我的待办',
      count: overview.todoCount,
      path: '/system/flow-todo',
      bg: '#ffe8ec',
      icon: '📋'
    }
  ])

  // ===== echarts =====
  const pieRef = ref<HTMLElement>()
  const barRef = ref<HTMLElement>()
  let pieChart: echarts.ECharts | null = null
  let barChart: echarts.ECharts | null = null
  const COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9c6cff']

  const renderPie = (data: any[]) => {
    if (!pieRef.value) return
    pieChart = echarts.init(pieRef.value)
    pieChart.setOption({
      color: COLORS,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          data: data.map((d) => ({ name: d.name, value: Number(d.value) })),
          label: { formatter: '{b}\n{c}' }
        }
      ]
    })
  }

  const renderBar = (data: any[]) => {
    if (!barRef.value) return
    barChart = echarts.init(barRef.value)
    barChart.setOption({
      color: COLORS,
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: data.map((d) => d.name), axisLabel: { interval: 0 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ type: 'bar', barMaxWidth: 40, data: data.map((d) => Number(d.value)) }]
    })
  }

  const resize = () => {
    pieChart?.resize()
    barChart?.resize()
  }

  // ===== 各卡片数据 =====
  const todoList = ref<any[]>([])
  const todoLoading = ref(false)
  const noticeList = ref<any[]>([])
  const noticeLoading = ref(false)
  const changelogList = ref<any[]>([])

  const typeColor = (type: string) =>
    type === 'fix' ? '#f56c6c' : type === 'optimize' ? '#e6a23c' : '#409eff'

  const loadOverview = async () => {
    const d = (await fetchWorkbenchOverview()) || {}
    Object.assign(overview, {
      userCount: d.userCount ?? 0,
      deptCount: d.deptCount ?? 0,
      roleCount: d.roleCount ?? 0,
      todoCount: d.todoCount ?? 0,
      noticeUnread: d.noticeUnread ?? 0
    })
    await nextTick()
    renderPie(d.charts?.userStatus || [])
    renderBar(d.charts?.tenantUser || [])
  }

  const loadTodo = async () => {
    todoLoading.value = true
    try {
      todoList.value = ((await fetchFlowMyTodo()) || []).slice(0, 6)
    } finally {
      todoLoading.value = false
    }
  }

  const loadNotice = async () => {
    noticeLoading.value = true
    try {
      const resp: any = await fetchMyNoticePage({ pageNum: 1, pageSize: 6 })
      noticeList.value = resp?.records ?? []
    } finally {
      noticeLoading.value = false
    }
  }

  const loadChangelog = async () => {
    const rows = (await fetchChangelogRecent(6)) || []
    changelogList.value = rows.map((r: any) => ({
      time: (r.publishTime || r.createTime || '').slice(0, 10),
      content: r.title,
      status: typeColor(r.type),
      code: r.version
    }))
  }

  // ===== 快捷入口 =====
  const shortcuts = ref<Array<{ name: string; path: string }>>([])
  const editorVisible = ref(false)
  const selectedPaths = ref<string[]>([])
  const saving = ref(false)

  const loadShortcuts = async () => {
    const json = await fetchWorkbenchShortcuts()
    let paths: string[]
    if (json) {
      try {
        paths = (JSON.parse(json) as Array<{ path: string }>).map((s) => s.path)
      } catch {
        paths = DEFAULT_PATHS
      }
    } else {
      paths = DEFAULT_PATHS
    }
    applyShortcuts(paths)
  }

  // 按候选目录顺序过滤，剔除失效 path，保证名称与路由一致
  const applyShortcuts = (paths: string[]) => {
    shortcuts.value = CATALOG.filter((c) => paths.includes(c.path))
  }

  const openShortcutEditor = () => {
    selectedPaths.value = shortcuts.value.map((s) => s.path)
    editorVisible.value = true
  }

  const saveShortcuts = async () => {
    saving.value = true
    try {
      const list = CATALOG.filter((c) => selectedPaths.value.includes(c.path))
      await saveWorkbenchShortcuts(JSON.stringify(list))
      shortcuts.value = list
      editorVisible.value = false
      ElMessage.success('保存成功')
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    loadOverview()
    loadTodo()
    loadNotice()
    loadChangelog()
    loadShortcuts()
    window.addEventListener('resize', resize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    pieChart?.dispose()
    barChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .console-page {
    .mt-4 {
      margin-top: 16px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 500;
    }

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    // 统计瓦片
    .stat-tile {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 18px;
      cursor: pointer;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
      }

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        font-size: 22px;
        color: var(--el-color-primary);
        border-radius: 12px;
      }

      .stat-count {
        font-size: 24px;
        font-weight: 600;
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    // 图表
    .chart-card {
      padding: 16px;

      .chart-box {
        width: 100%;
        height: 280px;
        margin-top: 8px;
      }
    }

    // 列表卡
    .list-card {
      min-height: 340px;
      padding: 16px;

      .unread-badge {
        margin-left: 6px;
      }

      .mini-list {
        li {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 4px;
          cursor: pointer;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:hover .mini-title {
            color: var(--el-color-primary);
          }
        }

        .mini-title {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 14px;
        }

        .mini-sub {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }

        .top-tag {
          flex-shrink: 0;
        }
      }
    }

    // 快捷入口
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;

      @media (width <= 768px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .quick-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      cursor: pointer;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      .quick-name {
        font-size: 14px;
      }
    }

    .editor-tip {
      margin-bottom: 14px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .mt-lg-0 {
      @media (width >= 992px) {
        margin-top: 0;
      }
    }
  }
</style>
