import { useEffect, useRef, useCallback, useState } from 'react'
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from '@mediapipe/tasks-vision'

const LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
const RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

const EAR_CLOSED_THRESHOLD = 0.20
// 需要连续 N 帧低于阈值才确认为闭眼，减少光线波动导致的误触
const CLOSED_FRAMES_THRESHOLD = 2
// 超过此帧数仍未睁眼则不算眨眼（慢闭眼/持续闭眼）
const BLINK_MAX_CLOSED_FRAMES = 18
// 双眨眼时间窗口（毫秒）：第一下睁眼后，此时间内再眨一次算双眨眼
const DOUBLE_BLINK_WINDOW_MS = 700

function computeEAR(
  landmarks: { x: number; y: number; z: number }[],
  indices: number[]
): number {
  const p = indices.map((i) => landmarks[i])
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  const v1 = dist(p[1], p[5])
  const v2 = dist(p[2], p[4])
  const h = dist(p[0], p[3])
  if (h === 0) return 1
  return (v1 + v2) / (2 * h)
}

/**
 * blinkMode:
 *  'single' — 每次眨眼立即触发 onBlink，不等待，用于抓拍阶段
 *  'double' — 只检测双眨眼触发 onDoubleBlink，单次眨眼忽略，用于卡片阶段
 */
export type BlinkMode = 'single' | 'double'

export interface LandmarkOverlayOptions {
  /** 绘制关键点的画布（与 displayVideoRef 叠放同尺寸） */
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  /** 用于取显示区域宽高（与检测视频同源流即可） */
  displayVideoRef: React.RefObject<HTMLVideoElement | null>
}

interface UseBlinkDetectionOptions {
  onEyeClose?: () => void
  onEyeOpen?: () => void
  onBlink?: () => void
  onDoubleBlink?: () => void
  blinkMode?: BlinkMode
  enabled?: boolean
  /** 在每一帧将人脸关键点绘制到画布（与视频镜像一致） */
  landmarkOverlay?: LandmarkOverlayOptions
}

export function useBlinkDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseBlinkDetectionOptions = {}
) {
  const { enabled = true, blinkMode = 'single' } = options

  const [isReady, setIsReady] = useState(false)
  const [eyeState, setEyeState] = useState<'open' | 'closed'>('open')
  const [error, setError] = useState<string | null>(null)

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const callbacksRef = useRef(options)
  const landmarkOverlayRef = useRef(options.landmarkOverlay)

  // 眨眼原始状态
  const closedFramesRef = useRef(0)
  const wasClosedRef = useRef(false)

  // 双眨眼追踪（仅 double 模式使用）
  const firstBlinkTimeRef = useRef<number>(0)
  const doubleBlinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 保持 callbacks 和 mode 最新
  useEffect(() => {
    callbacksRef.current = options
  })

  useEffect(() => {
    landmarkOverlayRef.current = options.landmarkOverlay
  }, [options.landmarkOverlay])

  // blinkMode 切换时，清空双眨眼状态，防止跨阶段污染
  useEffect(() => {
    firstBlinkTimeRef.current = 0
    if (doubleBlinkTimerRef.current) {
      clearTimeout(doubleBlinkTimerRef.current)
      doubleBlinkTimerRef.current = null
    }
    // 重置眼部状态，避免残留的"闭眼"判断影响新阶段
    closedFramesRef.current = 0
    wasClosedRef.current = false
  }, [blinkMode])

  // 初始化 MediaPipe FaceLandmarker
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        })
        if (!cancelled) {
          faceLandmarkerRef.current = landmarker
          setIsReady(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError('无法初始化人脸检测，请确保浏览器支持 WebGL')
          console.error('FaceLandmarker init error:', err)
        }
      }
    }

    init()
    return () => {
      cancelled = true
      faceLandmarkerRef.current?.close()
    }
  }, [])

  const handleBlink = useCallback(() => {
    const { onBlink, onDoubleBlink, blinkMode: mode = 'single' } = callbacksRef.current

    if (mode === 'single') {
      // 立即触发，无任何延迟
      onBlink?.()
      return
    }

    // double 模式：等待第二次眨眼
    const now = performance.now()
    if (
      firstBlinkTimeRef.current > 0 &&
      now - firstBlinkTimeRef.current < DOUBLE_BLINK_WINDOW_MS
    ) {
      // 第二次眨眼在窗口内 → 双眨眼确认
      if (doubleBlinkTimerRef.current) {
        clearTimeout(doubleBlinkTimerRef.current)
        doubleBlinkTimerRef.current = null
      }
      firstBlinkTimeRef.current = 0
      onDoubleBlink?.()
    } else {
      // 第一次眨眼，记录时间，启动等待计时器
      firstBlinkTimeRef.current = now
      if (doubleBlinkTimerRef.current) clearTimeout(doubleBlinkTimerRef.current)
      doubleBlinkTimerRef.current = setTimeout(() => {
        // 超时未等到第二次 → 单次眨眼，double 模式下直接丢弃
        firstBlinkTimeRef.current = 0
        doubleBlinkTimerRef.current = null
      }, DOUBLE_BLINK_WINDOW_MS)
    }
  }, [])

  function drawLandmarkOverlay(
    landmarks: { x: number; y: number; z?: number }[] | undefined
  ) {
    const cfg = landmarkOverlayRef.current
    if (!cfg?.canvasRef.current || !cfg.displayVideoRef.current) return

    const v = cfg.displayVideoRef.current
    const canvas = cfg.canvasRef.current
    const w = Math.max(1, Math.floor(v.clientWidth))
    const h = Math.max(1, Math.floor(v.clientHeight))
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    if (!landmarks?.length) return

    ctx.fillStyle = 'rgba(46, 200, 120, 0.88)'
    const r = Math.max(1, Math.min(w, h) * 0.004)
    for (const p of landmarks) {
      const x = (1 - p.x) * w
      const y = p.y * h
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 检测主循环
  const detect = useCallback(() => {
    const video = videoRef.current
    const landmarker = faceLandmarkerRef.current

    if (!video || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect)
      return
    }

    let result: FaceLandmarkerResult
    try {
      result = landmarker.detectForVideo(video, performance.now())
    } catch {
      animFrameRef.current = requestAnimationFrame(detect)
      return
    }

    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      const landmarks = result.faceLandmarks[0]
      const leftEAR = computeEAR(landmarks, LEFT_EYE_INDICES)
      const rightEAR = computeEAR(landmarks, RIGHT_EYE_INDICES)
      const avgEAR = (leftEAR + rightEAR) / 2
      const isClosed = avgEAR < EAR_CLOSED_THRESHOLD

      if (isClosed) {
        closedFramesRef.current += 1
        if (closedFramesRef.current === CLOSED_FRAMES_THRESHOLD) {
          wasClosedRef.current = true
          setEyeState('closed')
          callbacksRef.current.onEyeClose?.()
        }
      } else {
        if (wasClosedRef.current) {
          const isBlink = closedFramesRef.current <= BLINK_MAX_CLOSED_FRAMES
          wasClosedRef.current = false
          setEyeState('open')
          callbacksRef.current.onEyeOpen?.()
          if (isBlink) handleBlink()
        }
        closedFramesRef.current = 0
      }

      drawLandmarkOverlay(landmarks)
    } else {
      drawLandmarkOverlay(undefined)
    }

    animFrameRef.current = requestAnimationFrame(detect)
  }, [videoRef, handleBlink])

  useEffect(() => {
    if (!isReady || !enabled) return
    animFrameRef.current = requestAnimationFrame(detect)
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isReady, enabled, detect])

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (doubleBlinkTimerRef.current) clearTimeout(doubleBlinkTimerRef.current)
    }
  }, [])

  return { isReady, eyeState, error }
}
