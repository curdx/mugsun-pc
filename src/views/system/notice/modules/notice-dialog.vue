<!-- 通知公告新增/编辑弹窗：分类/置顶/富文本内容 + 可见范围（全部 / 按员工·部门穿梭框） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? '新增公告' : '编辑公告'"
    width="820px"
    align-center
    @open="onOpen"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem label="标题" prop="title">
        <ElInput v-model="formData.title" placeholder="请输入标题" />
      </ElFormItem>
      <ElFormItem label="分类" prop="category">
        <ElSelect v-model="formData.category" placeholder="请选择分类" style="width: 220px">
          <ElOption
            v-for="opt in CATEGORY_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="置顶" prop="isTop">
        <ElSwitch v-model="formData.isTop" :active-value="1" :inactive-value="0" />
      </ElFormItem>
      <ElFormItem label="可见范围" prop="allVisible">
        <ElRadioGroup v-model="formData.allVisible">
          <ElRadio :value="1">全部可见</ElRadio>
          <ElRadio :value="0">指定范围</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem v-if="formData.allVisible === 0" label="指定对象">
        <ElTransfer
          v-model="selectedKeys"
          :data="transferData"
          filterable
          :titles="['可选（员工/部门）', '已选范围']"
          :props="{ key: 'key', label: 'label' }"
          class="notice-transfer"
        />
      </ElFormItem>
      <ElFormItem label="内容" prop="content">
        <ArtWangEditor v-model="formData.content" height="300px" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import { fetchNoticeDetail } from '@/api/system-manage'
  import { fetchDeptSelect } from '@/api/system-manage'
  import { fetchUserSelect } from '@/api/message'

  interface Props {
    visible: boolean
    type: string
    noticeData?: Record<string, any>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', form: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const CATEGORY_OPTIONS = [
    { label: '通知', value: 'notice' },
    { label: '公告', value: 'announcement' },
    { label: '预警', value: 'warning' }
  ]

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()

  const defaultForm = () => ({
    id: undefined as number | string | undefined,
    title: '',
    category: 'notice',
    isTop: 0,
    allVisible: 1,
    content: ''
  })
  const formData = reactive<Record<string, any>>(defaultForm())

  // 穿梭框：员工(u:)与部门(d:)合并为一个数据源，key 前缀区分类型
  const transferData = ref<Array<{ key: string; label: string }>>([])
  const selectedKeys = ref<string[]>([])

  const rules: FormRules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    category: [{ required: true, message: '请选择分类', trigger: 'change' }]
  }

  const loadTransferSource = async () => {
    if (transferData.value.length) return
    const [users, depts] = await Promise.all([fetchUserSelect(), fetchDeptSelect()])
    transferData.value = [
      ...(depts || []).map((d: any) => ({ key: `d:${d.value}`, label: `【部门】${d.label}` })),
      ...(users || []).map((u: any) => ({ key: `u:${u.value}`, label: `【员工】${u.label}` }))
    ]
  }

  const onOpen = async () => {
    Object.assign(formData, defaultForm(), props.noticeData || {})
    selectedKeys.value = []
    formRef.value?.clearValidate()
    await loadTransferSource()
    // 编辑态：拉详情回显可见范围明细
    if (props.type === 'edit' && formData.id != null) {
      const detail = await fetchNoticeDetail(formData.id)
      formData.allVisible = detail?.allVisible ?? 1
      selectedKeys.value = (detail?.scopeList || []).map(
        (s: any) => `${s.scopeType === 2 ? 'd' : 'u'}:${s.scopeId}`
      )
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (!valid) return
      if (formData.allVisible === 0 && selectedKeys.value.length === 0) {
        ElMessage.warning('指定范围时请至少选择一个员工或部门')
        return
      }
      const scopeList =
        formData.allVisible === 0
          ? selectedKeys.value.map((k) => {
              const [type, id] = k.split(':')
              return { scopeType: type === 'd' ? 2 : 1, scopeId: id }
            })
          : []
      emit('submit', { ...formData, scopeList })
    })
  }
</script>

<style lang="scss" scoped>
  .notice-transfer {
    width: 100%;

    :deep(.el-transfer-panel) {
      width: 300px;
    }
  }
</style>
