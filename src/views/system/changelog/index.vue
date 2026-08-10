<!-- 版本更新记录管理：分页 CRUD + 类型分类 + 富文本 -->
<template>
  <div class="changelog-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton
            v-perm="'sys:changelog:manage'"
            type="primary"
            @click="showDialog('add')"
            v-ripple
            >新增记录</ElButton
          >
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data as any[]"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑更新记录' : '新增更新记录'"
      width="780px"
      top="6vh"
    >
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="版本号" required>
          <ElInput v-model="form.version" placeholder="如 v1.2.0" style="width: 220px" />
        </ElFormItem>
        <ElFormItem label="类型" required>
          <ElSelect v-model="form.type" style="width: 220px">
            <ElOption v-for="t in TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标题" required>
          <ElInput v-model="form.title" placeholder="请输入标题" />
        </ElFormItem>
        <ElFormItem label="发布时间">
          <ElDatePicker
            v-model="form.publishTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择发布时间"
          />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort" :min="0" />
        </ElFormItem>
        <ElFormItem label="内容">
          <ArtWangEditor v-model="form.content" height="280px" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { h, reactive } from 'vue'
  import { ElButton, ElTag, ElMessage, ElMessageBox } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { hasPerm } from '@/utils/permission'
  import { formatTableTime } from '@/utils/date'
  import {
    fetchChangelogPage,
    fetchChangelogDetail,
    fetchSaveChangelog,
    fetchRemoveChangelog
  } from '@/api/feedback'

  defineOptions({ name: 'ChangeLog' })

  const TYPES = [
    { label: '新增', value: 'feature', tag: 'primary' },
    { label: '优化', value: 'optimize', tag: 'warning' },
    { label: '修复', value: 'fix', tag: 'danger' }
  ]
  const typeMeta = (v: string) => TYPES.find((t) => t.value === v) || { label: v, tag: 'info' }

  // 语义版本比较（v1.3.0 > v1.10.0）：非数字段兜底字符串比较，非法版本排最后
  const compareVersion = (a: string, b: string): number => {
    const pa = String(a || '')
      .replace(/^v/i, '')
      .split('.')
    const pb = String(b || '')
      .replace(/^v/i, '')
      .split('.')
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i]
      const nb = pb[i]
      if (na === undefined) return -1
      if (nb === undefined) return 1
      const diff =
        /^\d+$/.test(na) && /^\d+$/.test(nb) ? Number(na) - Number(nb) : na.localeCompare(nb)
      if (diff !== 0) return diff
    }
    return 0
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchChangelogPage,
      apiParams: { pageNum: 1, pageSize: 10 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { prop: 'version', label: '版本号', width: 120 },
        {
          prop: 'type',
          label: '类型',
          width: 100,
          formatter: (row: any) => {
            const m = typeMeta(row.type)
            return h(ElTag, { type: m.tag as any }, () => m.label)
          }
        },
        { prop: 'title', label: '标题', minWidth: 220 },
        {
          prop: 'publishTime',
          label: '发布时间',
          minWidth: 170,
          formatter: (row: any) => formatTableTime(row.publishTime)
        },
        { prop: 'sort', label: '排序', width: 80 },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right',
          // 操作列由 h() 渲染（指令够不到），用 hasPerm() 函数按真实权限码门控
          formatter: (row: any) =>
            h('div', [
              hasPerm('sys:changelog:manage')
                ? h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) })
                : null,
              hasPerm('sys:changelog:manage')
                ? h(ArtButtonTable, { type: 'delete', onClick: () => remove(row) })
                : null
            ])
        }
      ]
    },
    transform: {
      // 后端按 sort 字段倒序返回（sort 默认 0，新版本易排老版本后），前端按语义版本倒序重排
      responseAdapter: (resp: any) => ({
        records: [...(resp?.records ?? [])].sort((a: any, b: any) =>
          compareVersion(b.version, a.version)
        ),
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 10
      })
    }
  })

  const dialogVisible = ref(false)
  const form = reactive<any>({
    id: undefined,
    version: '',
    type: 'feature',
    title: '',
    content: '',
    publishTime: '',
    sort: 0
  })

  const showDialog = async (type: 'add' | 'edit', row?: any) => {
    if (type === 'add') {
      Object.assign(form, {
        id: undefined,
        version: '',
        type: 'feature',
        title: '',
        content: '',
        publishTime: '',
        sort: 0
      })
    } else {
      const detail = await fetchChangelogDetail(row.id)
      Object.assign(form, {
        id: detail.id,
        version: detail.version,
        type: detail.type,
        title: detail.title,
        content: detail.content || '',
        publishTime: detail.publishTime || '',
        sort: detail.sort
      })
    }
    dialogVisible.value = true
  }

  const submit = async () => {
    if (!form.version?.trim() || !form.title?.trim()) {
      return ElMessage.warning('请填写版本号与标题')
    }
    await fetchSaveChangelog({ ...form })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    refreshData()
  }

  const remove = (row: any) => {
    ElMessageBox.confirm(`确定删除「${row.version} ${row.title}」吗？`, '删除', {
      type: 'warning'
    }).then(async () => {
      await fetchRemoveChangelog([row.id])
      ElMessage.success('删除成功')
      refreshData()
    })
  }
</script>
