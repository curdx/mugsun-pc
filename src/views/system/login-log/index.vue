<!-- 登录日志页面（只读 + 账号解锁入口，含成功/失败） -->
<template>
  <div class="login-log-page art-full-height">
    <!-- 查询栏：账号/IP/状态，条件实时生效、重置回默认 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleResetSearch"
    />
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        border
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import ArtStatusTag from '@/components/core/base/art-status-tag/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchLoginLogPage } from '@/api/system-manage'
  import { unlockLoginAccount } from '@/api/log'
  import { ElButton, ElMessageBox, ElMessage } from 'element-plus'
  import { DICT_CODE } from '@/utils/constants'
  import { hasPerm } from '@/utils/permission'
  import { formatTableTime } from '@/utils/date'

  defineOptions({ name: 'LoginLog' })

  // ===== 查询栏 =====
  const searchForm = ref({
    username: '',
    ip: '',
    status: undefined as number | undefined
  })
  const searchItems = computed(() => [
    {
      key: 'username',
      label: '账号',
      type: 'input',
      props: { placeholder: '请输入账号', clearable: true }
    },
    {
      key: 'ip',
      label: 'IP',
      type: 'input',
      props: { placeholder: '请输入IP', clearable: true }
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '成功', value: 1 },
          { label: '失败', value: 0 }
        ]
      }
    }
  ])

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    fetchData,
    replaceSearchParams,
    resetSearchParams
  } = useTable({
    core: {
      apiFn: fetchLoginLogPage,
      apiParams: { pageNum: 1, pageSize: 20 },
      // 后端分页参数为 pageNum/pageSize
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        { prop: 'username', label: '账号', minWidth: 120 },
        { prop: 'ip', label: 'IP', minWidth: 130 },
        {
          prop: 'loginLocation',
          label: '归属地',
          minWidth: 130,
          showOverflowTooltip: true,
          // ip2region 关闭/内网/未命中时为空，统一占位
          formatter: (row: any) => row.loginLocation || '-'
        },
        { prop: 'browser', label: '浏览器', minWidth: 110, showOverflowTooltip: true },
        { prop: 'os', label: '操作系统', minWidth: 130, showOverflowTooltip: true },
        {
          prop: 'status',
          label: '结果',
          width: 90,
          // 字典运行时驱动（login_result：1 成功 / 0 失败）
          formatter: (row: any) =>
            h(ArtStatusTag, { code: DICT_CODE.LOGIN_RESULT, value: row.status })
        },
        { prop: 'msg', label: '说明', minWidth: 160, showOverflowTooltip: true },
        {
          prop: 'loginTime',
          label: '登录时间',
          minWidth: 170,
          formatter: (row: any) => formatTableTime(row.loginTime)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 90,
          fixed: 'right',
          // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控；
          // 「解锁」仅对处于锁定中的行展示（locked 由后端按 Redis 锁键富化）
          formatter: (row: any) =>
            hasPerm('sys:login-log:unlock') && row.locked
              ? h(
                  ElButton,
                  { link: true, type: 'warning', size: 'small', onClick: () => unlock(row) },
                  () => '解锁'
                )
              : null
        }
      ]
    },
    transform: {
      // 适配后端 mybatis-flex Page：records + totalRow
      responseAdapter: (resp: any) => ({
        records: resp?.records ?? [],
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 20
      })
    }
  })

  /** 解锁账号：清除该日志行 租户+账号 维度的登录失败锁定 */
  const unlock = (row: any): void => {
    ElMessageBox.confirm(`确定解锁账号"${row.username}"的登录锁定吗？`, '解锁账号', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await unlockLoginAccount(row.id)
      ElMessage.success('解锁成功')
      // 解锁后刷新行级锁定标记（按钮随之隐藏）
      refreshData()
    })
  }

  // ===== 查询栏联动 =====
  const handleSearch = async (params: Record<string, any>): Promise<void> => {
    // 替换全部查询参数（防旧条件残留），回到第一页
    replaceSearchParams({ ...params, pageNum: 1, pageSize: 20 })
    await fetchData()
  }

  const handleResetSearch = async (): Promise<void> => {
    searchForm.value = {
      username: '',
      ip: '',
      status: undefined
    }
    resetSearchParams()
    await fetchData()
  }
</script>
