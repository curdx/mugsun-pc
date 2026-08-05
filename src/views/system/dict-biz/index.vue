<!-- 业务字典管理页面 -->
<template>
  <DictTreeView
    :tree-api="fetchDictBizTree"
    :save-api="saveDictBiz"
    :remove-api="removeDictBiz"
    perm-prefix="sys:dict-biz"
  />
</template>

<script setup lang="ts">
  import DictTreeView from '../dict/components/DictTreeView.vue'
  import { fetchDictBizTree, saveDictBiz, removeDictBiz } from '@/api/dict'

  defineOptions({ name: 'DictBiz' })
</script>
