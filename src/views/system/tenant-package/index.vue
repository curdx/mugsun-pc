<!-- 租户套餐管理（对接 /system/tenant-package）：绑定该套餐可用功能菜单 -->
<template>
  <div class="tpkg-page art-full-height">
    <ElCard class="art-table-card">
      <div class="tpkg-toolbar">
        <ElButton type="primary" @click="showCreate">新建套餐</ElButton>
      </div>

      <ElTable :data="tableData" border v-loading="loading">
        <ElTableColumn type="index" label="序号" width="60" />
        <ElTableColumn prop="name" label="套餐名称" min-width="150" />
        <ElTableColumn label="功能菜单数" width="110">
          <template #default="{ row }">{{ keyCount(row.menuKeys) }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <ElTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="showEdit(row)">编辑</ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑套餐' : '新建套餐'"
      width="600px"
      align-center
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="套餐名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入套餐名称" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="功能菜单">
          <ElTree
            ref="treeRef"
            :data="menuTree"
            show-checkbox
            node-key="value"
            :default-expand-all="true"
            :props="{ label: 'label', children: 'children' }"
            class="tpkg-tree"
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="备注" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchTenantPackagePage,
    fetchSubmitTenantPackage,
    fetchRemoveTenantPackage
  } from '@/api/system-manage'
  import { asyncRoutes } from '@/router/routes/asyncRoutes'
  import { formatMenuTitle } from '@/utils'
  import type { AppRouteRecord } from '@/types/router'

  defineOptions({ name: 'TenantPackage' })

  interface TreeNode {
    value: string
    label: string
    children?: TreeNode[]
  }

  // 由前端路由构建可绑定菜单树（以路由 name 为键）
  const buildTree = (routes: AppRouteRecord[]): TreeNode[] =>
    routes
      .filter((r) => r.name && r.meta?.title)
      .map((r) => {
        const node: TreeNode = { value: String(r.name), label: formatMenuTitle(r.meta!.title) }
        const children = r.children?.length ? buildTree(r.children) : []
        if (children.length) node.children = children
        return node
      })

  const menuTree = buildTree(asyncRoutes)

  const tableData = ref<any[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const treeRef = ref<any>()

  const form = reactive<Record<string, any>>({ id: null, name: '', status: 1, remark: '' })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }]
  }

  const keyCount = (keys: string): number => (keys ? keys.split(',').filter(Boolean).length : 0)

  const loadData = async (): Promise<void> => {
    loading.value = true
    try {
      const resp = await fetchTenantPackagePage({ pageNum: 1, pageSize: 50 })
      tableData.value = resp?.records ?? []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  const showCreate = (): void => {
    Object.assign(form, { id: null, name: '', status: 1, remark: '' })
    dialogVisible.value = true
    nextTick(() => treeRef.value?.setCheckedKeys([]))
  }

  const showEdit = (row: any): void => {
    Object.assign(form, { id: row.id, name: row.name, status: row.status, remark: row.remark })
    dialogVisible.value = true
    const keys = (row.menuKeys || '').split(',').filter(Boolean)
    nextTick(() => treeRef.value?.setCheckedKeys(keys))
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      // 仅收集叶子（勾选）节点名作为菜单标识
      const keys: string[] = treeRef.value?.getCheckedKeys(true) ?? []
      await fetchSubmitTenantPackage({ ...form, menuKeys: keys.join(',') })
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    })
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除套餐"${row.name}"吗？`, '删除套餐', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveTenantPackage(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
  }
</script>

<style scoped>
  .tpkg-toolbar {
    margin-bottom: 12px;
  }

  .tpkg-tree {
    width: 100%;
    max-height: 300px;
    padding: 8px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
  }
</style>
