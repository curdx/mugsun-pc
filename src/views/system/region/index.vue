<!-- 行政区划页（懒加载树 + 导入导出，对接 /system/region） -->
<template>
  <div class="region-page art-full-height">
    <ElCard class="art-table-card">
      <div class="region-toolbar">
        <ElButton type="primary" @click="showDialog(null)">新增省级</ElButton>
        <ElButton @click="doExport">导出</ElButton>
        <ElButton @click="triggerImport">导入</ElButton>
        <input ref="fileInput" type="file" accept=".xlsx" style="display: none" @change="onFile" />
      </div>

      <ElTable
        :key="tableKey"
        :data="tableData"
        row-key="code"
        border
        lazy
        :load="loadChildren"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <ElTableColumn prop="name" label="名称" min-width="220" />
        <ElTableColumn prop="code" label="区划编码" min-width="140" />
        <ElTableColumn label="层级" width="100">
          <template #default="{ row }">{{ levelText(row.level) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton v-if="row.level < 3" link type="primary" @click="showDialog(row)">
              新增下级
            </ElButton>
            <ElButton link type="danger" @click="remove(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" title="新增区划" width="460px" align-center>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="上级">
          <ElInput :model-value="parentName" disabled />
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="区划编码" prop="code">
          <ElInput v-model="form.code" placeholder="请输入编码" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submit">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchRegionLazyTree,
    fetchSaveRegion,
    fetchRemoveRegion,
    exportRegion,
    importRegion
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'Region' })

  const tableData = ref<any[]>([])
  const tableKey = ref(0)
  const dialogVisible = ref(false)
  const parentName = ref('顶级')
  const formRef = ref<FormInstance>()
  const fileInput = ref<HTMLInputElement>()
  const parentRow = ref<any>(null)

  const form = reactive<Record<string, any>>({ name: '', code: '', parentCode: '0', level: 1 })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入编码', trigger: 'blur' }]
  }

  const levelText = (l: number): string => ({ 1: '省', 2: '市', 3: '区县' })[l] || String(l)

  const mapNodes = (list: any[]): any[] => list.map((r) => ({ ...r, hasChildren: !r.leaf }))

  const loadRoot = async (): Promise<void> => {
    tableData.value = mapNodes((await fetchRegionLazyTree('0')) || [])
    tableKey.value++
  }

  const loadChildren = async (
    row: any,
    _node: any,
    resolve: (data: any[]) => void
  ): Promise<void> => {
    const children = mapNodes((await fetchRegionLazyTree(row.code)) || [])
    resolve(children)
  }

  onMounted(loadRoot)

  const showDialog = (row: any): void => {
    parentRow.value = row
    parentName.value = row ? row.name : '顶级'
    Object.assign(form, {
      name: '',
      code: '',
      parentCode: row ? row.code : '0',
      level: row ? row.level + 1 : 1
    })
    dialogVisible.value = true
  }

  const submit = async (): Promise<void> => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      await fetchSaveRegion({ ...form })
      dialogVisible.value = false
      ElMessage.success('保存成功')
      loadRoot()
    })
  }

  const remove = (row: any): void => {
    ElMessageBox.confirm(`确定删除"${row.name}"吗？`, '删除区划', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchRemoveRegion(row.id)
      ElMessage.success('删除成功')
      loadRoot()
    })
  }

  const doExport = async (): Promise<void> => {
    await exportRegion()
    ElMessage.success('已导出')
  }

  const triggerImport = (): void => fileInput.value?.click()

  const onFile = async (e: Event): Promise<void> => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const count = await importRegion(file)
    ElMessage.success(`导入完成 ${count} 条`)
    ;(e.target as HTMLInputElement).value = ''
    loadRoot()
  }
</script>

<style scoped>
  .region-toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }
</style>
