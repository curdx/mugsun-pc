<!-- 工作台：登录落地页，展示欢迎信息、快速入口与版本更新日志 -->
<template>
  <div class="console-page">
    <ElRow :gutter="16">
      <!-- 左：欢迎 + 快速入口 -->
      <ElCol :xs="24" :lg="16">
        <div class="art-card p-5 welcome-card">
          <p class="text-xl font-medium">你好，{{ userName }} 👋</p>
          <p class="text-sm text-g-600 mt-1">欢迎使用 Mugsun 低代码平台，祝你工作愉快。</p>
        </div>
        <div class="art-card p-5 mt-4">
          <p class="text-lg font-medium pb-3">快速入口</p>
          <div class="quick-grid">
            <div v-for="q in quickLinks" :key="q.path" class="quick-item" @click="go(q.path)">
              <span class="quick-name">{{ q.name }}</span>
            </div>
          </div>
        </div>
      </ElCol>

      <!-- 右：更新日志卡 -->
      <ElCol :xs="24" :lg="8" class="mt-4 mt-lg-0">
        <ArtTimelineListCard
          title="更新日志"
          subtitle="最近版本变更"
          :list="changelogList"
          :max-count="6"
        />
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { fetchChangelogRecent } from '@/api/feedback'

  defineOptions({ name: 'Console' })

  const router = useRouter()
  const userStore = useUserStore()
  const userName = computed(() => userStore.info?.userName || '用户')

  const quickLinks = [
    { name: '用户管理', path: '/system/user' },
    { name: '角色管理', path: '/system/role' },
    { name: '菜单管理', path: '/system/menu' },
    { name: '字典管理', path: '/system/dict' },
    { name: '帮助文档', path: '/system/help-doc' },
    { name: '更新日志', path: '/system/changelog' }
  ]
  const go = (path: string) => router.push(path)

  // 类型 → 时间轴节点颜色
  const typeColor = (type: string) =>
    type === 'fix' ? '#f56c6c' : type === 'optimize' ? '#e6a23c' : '#409eff'

  const changelogList = ref<any[]>([])
  onMounted(async () => {
    const rows = (await fetchChangelogRecent(6)) || []
    changelogList.value = rows.map((r: any) => ({
      time: (r.publishTime || r.createTime || '').slice(0, 10),
      content: r.title,
      status: typeColor(r.type),
      code: r.version
    }))
  })
</script>

<style lang="scss" scoped>
  .console-page {
    .welcome-card {
      background: linear-gradient(
        120deg,
        var(--el-color-primary-light-8),
        var(--el-color-primary-light-9)
      );
    }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
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

    .mt-lg-0 {
      @media (width >= 992px) {
        margin-top: 0;
      }
    }
  }
</style>
