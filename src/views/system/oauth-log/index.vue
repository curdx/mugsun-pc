<!-- 开放接口调用日志（对接 /system/oauth-log） -->
<template>
  <div class="oauth-log-page art-full-height">
    <ElCard class="art-table-card">
      <div class="oauth-log-toolbar">
        <ElSelect
          v-model="statusFilter"
          placeholder="全部状态"
          clearable
          style="width: 140px"
          @change="loadData"
        >
          <ElOption label="放行" :value="1" />
          <ElOption label="拒绝" :value="0" />
        </ElSelect>
        <ElButton type="primary" @click="loadData">刷新</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="clientId" label="ClientId" min-width="170" />
        <ElTableColumn prop="apiPath" label="接口" min-width="180" />
        <ElTableColumn prop="scope" label="所需范围" min-width="110" />
        <ElTableColumn label="结果" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '放行' : '拒绝' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="msg" label="说明" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="ip" label="IP" width="130" />
        <ElTableColumn prop="createTime" label="时间" min-width="170" />
      </ElTable>

      <div class="oauth-log-pager">
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
  import { fetchOauthLogPage } from '@/api/oauth'

  defineOptions({ name: 'OauthLog' })

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const statusFilter = ref<number | undefined>(undefined)

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const params: Record<string, any> = { pageNum: pageNum.value, pageSize: pageSize.value }
      if (statusFilter.value !== undefined && statusFilter.value !== null) {
        params.status = statusFilter.value
      }
      const resp = await fetchOauthLogPage(params)
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
  .oauth-log-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .oauth-log-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
