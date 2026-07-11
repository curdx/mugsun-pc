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

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="username" label="账号" min-width="120" />
        <ElTableColumn prop="nickname" label="昵称" min-width="140" />
        <ElTableColumn prop="deviceType" label="设备" width="100" />
        <ElTableColumn prop="tokenMask" label="令牌" min-width="160" />
        <ElTableColumn prop="loginTime" label="登录时间" min-width="180" />
        <ElTableColumn label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <ElButton link type="danger" size="small" @click="kickout(row)">强制下线</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="online-count">共 {{ tableData.length }} 个在线终端</div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { fetchOnlineList, fetchKickoutOnline } from '@/api/system-manage'

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
      await fetchKickoutOnline(row.tokenValue)
      ElMessage.success('已强制下线')
      loadData()
    })
  }

  onMounted(loadData)
</script>

<style scoped>
  .online-toolbar {
    display: flex;
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

  .online-count {
    margin-top: 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: right;
  }
</style>
