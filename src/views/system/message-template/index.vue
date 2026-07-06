<!-- 站内信模板管理：title/content 含 ${key} 占位 -->
<template>
  <div class="msg-template-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton type="primary" @click="showDialog('add')" v-ripple>新增模板</ElButton>
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

    <ElDialog v-model="dialogVisible" :title="form.id ? '编辑模板' : '新增模板'" width="640px">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="模板编码" required>
          <ElInput v-model="form.code" :disabled="!!form.id" placeholder="唯一编码，如 welcome" />
        </ElFormItem>
        <ElFormItem label="标题" required>
          <ElInput v-model="form.title" placeholder="支持 ${key} 占位，如 欢迎 ${name}" />
        </ElFormItem>
        <ElFormItem label="内容">
          <ElInput
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="支持 ${key} 占位，如 你好 ${name}，你的角色是 ${role}"
          />
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
  import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchMsgTemplatePage,
    fetchMsgTemplateDetail,
    fetchSaveMsgTemplate,
    fetchRemoveMsgTemplate
  } from '@/api/message'

  defineOptions({ name: 'MessageTemplate' })

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
      apiFn: fetchMsgTemplatePage,
      apiParams: { pageNum: 1, pageSize: 10 },
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      columnsFactory: () => [
        { prop: 'code', label: '编码', width: 160 },
        { prop: 'title', label: '标题', minWidth: 220 },
        { prop: 'createTime', label: '创建时间', minWidth: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: any) =>
            h('div', [
              h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
              h(ArtButtonTable, { type: 'delete', onClick: () => remove(row) })
            ])
        }
      ]
    },
    transform: {
      responseAdapter: (resp: any) => ({
        records: resp?.records ?? [],
        total: resp?.totalRow ?? 0,
        current: resp?.pageNumber ?? 1,
        size: resp?.pageSize ?? 10
      })
    }
  })

  const dialogVisible = ref(false)
  const form = reactive<any>({ id: undefined, code: '', title: '', content: '' })

  const showDialog = async (type: 'add' | 'edit', row?: any) => {
    if (type === 'add') {
      Object.assign(form, { id: undefined, code: '', title: '', content: '' })
    } else {
      const detail = await fetchMsgTemplateDetail(row.id)
      Object.assign(form, {
        id: detail.id,
        code: detail.code,
        title: detail.title,
        content: detail.content || ''
      })
    }
    dialogVisible.value = true
  }

  const submit = async () => {
    if (!form.code?.trim() || !form.title?.trim()) {
      return ElMessage.warning('请填写编码与标题')
    }
    await fetchSaveMsgTemplate({ ...form })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    refreshData()
  }

  const remove = (row: any) => {
    ElMessageBox.confirm(`确定删除模板「${row.code}」吗？`, '删除', { type: 'warning' }).then(
      async () => {
        await fetchRemoveMsgTemplate([row.id])
        ElMessage.success('删除成功')
        refreshData()
      }
    )
  }
</script>
