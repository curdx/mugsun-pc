<!-- 会话回放播放器抽屉（G100，回放列表页/错误详情共用）：
     按 detail 块清单逐 seq 拉取块内容（R 信封外裸 JSON，skipEnvelope），按 seq 排序拼接后
     rrweb-player 渲染（时间轴/倍速/暂停内建）；个别缺失/过期块容错跳过。
     rrweb-player 动态导入独立 chunk，不进入页面首包。 -->
<template>
  <ElDrawer
    v-model="drawerVisible"
    size="960px"
    :title="`会话回放 · ${sessionId}`"
    @opened="onOpened"
    @closed="onClosed"
  >
    <div v-loading="loading" class="replay-player-wrap">
      <!-- 会话元数据头 -->
      <div v-if="meta" class="replay-meta">
        <ElTag v-if="meta.hasError === 1" size="small" type="danger" effect="plain">含错误</ElTag>
        <span>访客 {{ meta.distinctId || '-' }}</span>
        <span>入口 {{ meta.entryPath || '-' }}</span>
        <span>开始 {{ fmtTrackTime(meta.startTime) }}</span>
        <span>时长 {{ fmtTrackDuration(meta.durationMs) }}</span>
        <span>事件 {{ loadedEvents }} 条</span>
        <span>{{ fmtTrackSize(meta.sizeBytes) }}</span>
      </div>
      <ElAlert
        v-if="skippedBlocks > 0"
        type="warning"
        :closable="false"
        show-icon
        class="replay-skip-tip"
        :title="`${skippedBlocks} 个块缺失或已过期，已跳过（时间轴可能有空洞）`"
      />

      <!-- 播放器挂载点（rrweb-player 自建 DOM，禁 v-html） -->
      <div v-show="playerReady" ref="playerRef" class="replay-player"></div>

      <ElEmpty
        v-if="!loading && !playerReady && !errorMsg"
        description="回放数据加载中或无有效块"
      />
      <ElResult v-if="errorMsg" icon="error" :title="errorMsg" />
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { fetchTrackReplayData, fetchTrackReplayDetail } from '@/api/track'
  import { fmtTrackDuration, fmtTrackSize, fmtTrackTime } from '@/views/track/shared/useTrackApp'
  import { ElAlert, ElDrawer, ElEmpty, ElResult, ElTag } from 'element-plus'
  import 'rrweb-player/dist/style.css'

  interface Props {
    visible: boolean
    sessionId: string
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const drawerVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const loading = ref(false)
  const playerReady = ref(false)
  const errorMsg = ref('')
  const meta = ref<Record<string, any> | null>(null)
  const skippedBlocks = ref(0)
  const loadedEvents = ref(0)
  const playerRef = ref<HTMLElement>()
  /** rrweb-player 实例（Svelte 组件，$destroy 卸载） */
  let player: { $destroy?: () => void; pause?: () => void } | null = null
  /** 加载代际：抽屉快速开合/切换会话时丢弃过期异步结果 */
  let loadGen = 0

  /** 打开：拉 detail 块清单 → 逐 seq 拉块（缺失跳过）→ 拼接挂载播放器 */
  const onOpened = async (): Promise<void> => {
    const gen = ++loadGen
    const sessionId = props.sessionId
    if (!sessionId) return
    loading.value = true
    errorMsg.value = ''
    try {
      const detail: any = await fetchTrackReplayDetail({ sessionId })
      if (gen !== loadGen) return
      meta.value = detail?.replay ?? null
      const blocks: Array<{ seq: number }> = [...(detail?.blocks ?? [])].sort(
        (a, b) => a.seq - b.seq
      )
      if (blocks.length === 0) {
        errorMsg.value = '该会话暂无回放块'
        return
      }

      // 逐块拉取（服务端已解压明文数组；缺失/过期块跳过不阻断整体播放）
      const events: unknown[] = []
      let skipped = 0
      for (const block of blocks) {
        try {
          const chunk: any = await fetchTrackReplayData({ sessionId, seq: block.seq })
          // skipEnvelope 下后端错误信封（块不存在等）也会原样返回，须按数组形态甄别
          if (Array.isArray(chunk)) events.push(...chunk)
          else skipped++
        } catch {
          skipped++
        }
        if (gen !== loadGen) return
      }
      skippedBlocks.value = skipped
      if (events.length === 0) {
        errorMsg.value = '回放块全部缺失或已过期'
        return
      }
      loadedEvents.value = events.length

      const { default: Player } = await import('rrweb-player')
      if (gen !== loadGen || !playerRef.value) return
      // 播放器尺寸随抽屉内容宽自适应（纵向按 16:10 收口，超高会话滚动播放区由播放器内部处理）
      const width = playerRef.value.clientWidth || 880
      player = new Player({
        target: playerRef.value,
        props: {
          events: events as any[],
          width,
          height: Math.round(width * 0.62),
          autoPlay: true,
          skipInactive: true,
          speedOption: [1, 2, 4, 8]
        }
      })
      playerReady.value = true
    } catch (e: any) {
      if (gen !== loadGen) return
      errorMsg.value = e?.message || '回放加载失败'
    } finally {
      if (gen === loadGen) loading.value = false
    }
  }

  /** 关闭：销毁播放器（iframe/计时器释放）+ 复位状态，下次打开重新拉取 */
  const onClosed = (): void => {
    loadGen++
    try {
      player?.pause?.()
      player?.$destroy?.()
    } catch {
      /* 播放器卸除失败无妨 */
    }
    player = null
    playerReady.value = false
    loading.value = false
    errorMsg.value = ''
    meta.value = null
    skippedBlocks.value = 0
    loadedEvents.value = 0
  }
</script>

<style lang="scss" scoped>
  .replay-player-wrap {
    .replay-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      align-items: center;
      margin-bottom: 12px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .replay-skip-tip {
      margin-bottom: 12px;
    }

    .replay-player {
      width: 100%;
      overflow: hidden;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;

      // rrweb-player 自带深色控制条，此处仅约束整体不溢出抽屉
      :deep(.rr-player) {
        width: 100% !important;
      }
    }
  }
</style>
