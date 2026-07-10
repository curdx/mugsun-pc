<!-- 登录日志页面（只读，含成功/失败） -->
<template>
  <div class="login-log-page art-full-height">
    <ElCard class="art-table-card">
      <div class="log-toolbar">
        <span class="log-title">登录日志</span>
        <ElButton :loading="loading" @click="loadData">刷新</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="username" label="账号" min-width="140" />
        <ElTableColumn prop="ip" label="IP" min-width="160" />
        <ElTableColumn label="结果" width="100">
          <template #default="{ row }">
            <ArtStatusTag :code="DICT_CODE.LOGIN_RESULT" :value="row.status" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="msg" label="说明" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="loginTime" label="登录时间" min-width="180" />
      </ElTable>

      <div class="log-pager">
        <ElPagination
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="pageNum"
          @current-change="onPage"
        />
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchLoginLogPage } from '@/api/system-manage'
  import { DICT_CODE } from '@/utils/constants'

  defineOptions({ name: 'LoginLog' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = 10

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchLoginLogPage({ pageNum: pageNum.value, pageSize })
      tableData.value = resp?.records ?? []
      total.value = resp?.totalRow ?? 0
    } finally {
      loading.value = false
    }
  }

  const onPage = (p: number): void => {
    pageNum.value = p
    loadData()
  }

  onMounted(loadData)
</script>

<style scoped>
  .log-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .log-title {
    font-size: 15px;
    font-weight: 500;
  }

  .log-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
