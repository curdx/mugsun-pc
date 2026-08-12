<!-- 在线会话管理：枚举当前所有在线终端（多端），支持强制下线；会话落 Redis，重启不失效 -->
<template>
  <div class="online-page art-full-height">
    <ElCard class="art-table-card">
      <div class="online-toolbar">
        <span class="online-title">在线会话</span>
        <div>
          <ElTag type="info" size="small" class="online-hint"
            >会话持久化至 Redis，重启后仍在线</ElTag
          >
          <ElButton :loading="loading" @click="loadData">刷新</ElButton>
        </div>
      </div>

      <div class="online-table-scroll">
        <ElTable :data="tableData" border v-loading="loading">
          <ElTableColumn type="index" label="序号" width="60" />
          <ElTableColumn prop="username" label="账号" min-width="150" show-overflow-tooltip />
          <ElTableColumn prop="nickname" label="昵称" min-width="140" show-overflow-tooltip />
          <ElTableColumn prop="deviceType" label="设备" width="100" />
          <ElTableColumn prop="ip" label="登录 IP" min-width="130" show-overflow-tooltip />
          <ElTableColumn prop="userAgent" label="浏览器 UA" min-width="220" show-overflow-tooltip />
          <ElTableColumn prop="tokenMask" label="令牌" min-width="160" show-overflow-tooltip />
          <ElTableColumn prop="loginTime" label="登录时间" min-width="180">
            <template #default="{ row }">{{ formatTableTime(row.loginTime) }}</template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <ElButton
                v-perm="'sys:session:kickout'"
                link
                type="danger"
                size="small"
                @click="kickout(row)"
                >强制下线</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <div class="online-count">共 {{ tableData.length }} 个在线终端</div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchOnlineList, fetchKickoutOnline } from '@/api/system-manage'
  import { formatTableTime } from '@/utils/date'

  defineOptions({ name: 'Online' })

  const tableData = ref<any[]>([])
  const loading = ref(false)

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      tableData.value = (await fetchOnlineList()) ?? []
    } finally {
      loading.value = false
    }
  }

  const kickout = (row: any): void => {
    ElMessageBox.confirm(`确定将「${row.nickname}」的该终端强制下线吗？`, '强制下线', {
      type: 'warning'
    }).then(async () => {
      await fetchKickoutOnline({
        loginId: row.loginId,
        deviceType: row.deviceType,
        tokenMask: row.tokenMask
      })
      ElMessage.success('已强制下线')
      loadData()
    })
  }

  onMounted(loadData)
</script>

<style scoped>
  /* 在线终端列表无分页、行数无上限：.art-table-card 定高 + .el-card__body 裁剪下
     表格须自备内部滚动，否则矮视口/多会话时底部行被切断不可达（范式同 monitor/track-user） */
  .art-table-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
  }

  .online-toolbar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .online-title {
    font-size: 15px;
    font-weight: 500;
  }

  .online-hint {
    margin-right: 12px;
  }

  .online-table-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .online-count {
    flex-shrink: 0;
    margin-top: 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: right;
  }
</style>
