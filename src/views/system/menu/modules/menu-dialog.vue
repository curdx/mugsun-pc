<!-- 菜单新增/编辑弹窗（对接后端 /system/menu/submit） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    :title="type === 'add' ? $t('pages.system.menu.addMenu') : $t('pages.system.menu.editMenu')"
    width="560px"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
      <ElFormItem :label="$t('pages.system.menu.fields.parent')" prop="parentId">
        <ElSelect v-model="formData.parentId" style="width: 100%">
          <ElOption :label="$t('pages.system.menu.topMenu')" :value="0" />
          <ElOption
            v-for="opt in menuOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.menuName')" prop="menuName">
        <ElInput
          v-model="formData.menuName"
          :placeholder="$t('pages.system.menu.placeholder.menuName')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.menuType')" prop="menuType">
        <ElSelect v-model="formData.menuType" style="width: 100%">
          <ElOption :label="$t('pages.system.menu.type.directory')" value="M" />
          <ElOption :label="$t('pages.system.menu.type.menu')" value="C" />
          <ElOption :label="$t('pages.system.menu.type.button')" value="F" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.icon')" prop="icon">
        <IconSelector v-model="formData.icon" style="width: 100%" />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.path')" prop="path">
        <ElInput v-model="formData.path" :placeholder="$t('pages.system.menu.placeholder.path')" />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.component')" prop="component">
        <ElInput
          v-model="formData.component"
          :placeholder="$t('pages.system.menu.placeholder.path')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.permission')" prop="permission">
        <ElInput
          v-model="formData.permission"
          :placeholder="$t('pages.system.menu.placeholder.permission')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.sort')" prop="sort">
        <ElInputNumber v-model="formData.sort" :min="0" />
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.isHideForm')" prop="isHide">
        <ElSwitch v-model="formData.isHide" :active-value="1" :inactive-value="0" />
        <span class="switch-tip">{{ $t('pages.system.menu.tips.hide') }}</span>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.pageCache')" prop="isKeepAlive">
        <ElSwitch v-model="formData.isKeepAlive" :active-value="1" :inactive-value="0" />
        <span class="switch-tip">{{ $t('pages.system.menu.tips.keepAlive') }}</span>
      </ElFormItem>
      <ElFormItem :label="$t('pages.system.menu.fields.isExternalForm')" prop="isExternal">
        <ElSwitch v-model="formData.isExternal" :active-value="1" :inactive-value="0" />
        <span class="switch-tip">{{ $t('pages.system.menu.tips.external') }}</span>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">{{
          $t('table.form.submit')
        }}</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'
  import IconSelector from './icon-selector.vue'

  interface Props {
    visible: boolean
    type: string
    menuData?: Record<string, any>
    menuTree?: any[]
    /** 父级保存进行中（防重复提交） */
    saving?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', form: Record<string, any>): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { t } = useI18n()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 上级菜单选项：菜单树扁平化（按层级缩进）；编辑态剔除自身及全部后代（防父级成环致子树蒸发）
  const menuOptions = computed(() => {
    const selfId = formData.id
    const exclude = new Set<any>()
    if (selfId != null) {
      const mark = (nodes: any[]) => {
        ;(nodes || []).forEach((node) => {
          if (node.id === selfId) {
            const all = (ns: any[]) =>
              ns.forEach((n) => {
                exclude.add(n.id)
                if (n.children?.length) all(n.children)
              })
            all([node])
          } else if (node.children?.length) {
            mark(node.children)
          }
        })
      }
      mark(props.menuTree || [])
    }
    const out: Array<{ label: string; value: any }> = []
    const walk = (nodes: any[], prefix: string) => {
      ;(nodes || []).forEach((node) => {
        if (!exclude.has(node.id)) {
          out.push({ label: prefix + node.menuName, value: node.id })
          if (node.children?.length) walk(node.children, prefix + '　')
        }
      })
    }
    walk(props.menuTree || [], '')
    return out
  })

  const formRef = ref<FormInstance>()

  const formData = reactive<Record<string, any>>({
    id: undefined,
    parentId: 0,
    menuName: '',
    menuType: 'M',
    icon: '',
    path: '',
    component: '',
    permission: '',
    sort: 0,
    isHide: 0,
    isKeepAlive: 1,
    isExternal: 0
  })

  const rules = computed<FormRules>(() => ({
    menuName: [
      { required: true, message: t('pages.system.menu.placeholder.menuName'), trigger: 'blur' }
    ],
    menuType: [
      { required: true, message: t('pages.system.menu.rules.menuTypeRequired'), trigger: 'change' }
    ]
  }))

  watch(
    () => [props.visible, props.menuData],
    ([visible]) => {
      if (visible) {
        Object.assign(
          formData,
          {
            id: undefined,
            parentId: 0,
            menuName: '',
            menuType: 'M',
            icon: '',
            path: '',
            component: '',
            permission: '',
            sort: 0,
            isHide: 0,
            isKeepAlive: 1,
            isExternal: 0
          },
          props.menuData || {}
        )
        nextTick(() => formRef.value?.clearValidate())
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        emit('submit', { ...formData })
      }
    })
  }
</script>

<style scoped>
  .switch-tip {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
