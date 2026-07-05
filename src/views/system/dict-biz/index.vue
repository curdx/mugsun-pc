<!-- 业务字典管理页面 -->
<template>
  <DictTreeView
    :tree-api="fetchDictBizTree"
    :save-api="fetchSaveDictBiz"
    :remove-api="fetchRemoveDictBiz"
  />
</template>

<script setup lang="ts">
  import DictTreeView from '../dict/components/DictTreeView.vue'
  import { fetchDictBizTree, fetchSaveDictBiz, fetchRemoveDictBiz } from '@/api/system-manage'

  defineOptions({ name: 'DictBiz' })
</script>
