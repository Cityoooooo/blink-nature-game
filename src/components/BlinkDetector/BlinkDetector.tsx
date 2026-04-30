import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBlinkDetection, type BlinkMode } from '../../hooks/useBlinkDetection'
import './BlinkDetector.css'

export interface BlinkDetectorPipPreview {
  /** 外层容器 class，用于页面级定位（如 fixed 右下角） */
  className?: string
  width?: number
  height?: number
  /** 是否绘制 MediaPipe 人脸关键点（与主检测同源） */
  showLandmarks?: boolean
  /**
   * 默认 true：画中画通过 Portal 挂到 document.body，
   * 避免父级（如 Framer Motion 的 transform）使 position:fixed 相对卡片定位而被裁切或看不见。
   */
  portal?: boolean
}

interface BlinkDetectorProps {
  onEyeClose?: () => void
  onEyeOpen?: () => void
  onBlink?: () => void
  onDoubleBlink?: () => void
  blinkMode?: BlinkMode
  enabled?: boolean
  showPreview?: boolean
  /** 预览窗口宽度（showPreview 为 true 时生效） */
  previewWidth?: number
  /** 预览窗口高度（showPreview 为 true 时生效） */
  previewHeight?: number
  /** 额外画中画（同一摄像头流），用于校准页右下角等 */
  pipPreview?: BlinkDetectorPipPreview
}

export function BlinkDetector({
  onEyeClose,
  onEyeOpen,
  onBlink,
  onDoubleBlink,
  blinkMode = 'single',
  enabled = true,
  showPreview = false,
  previewWidth = 160,
  previewHeight = 120,
  pipPreview,
}: BlinkDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pipVideoRef = useRef<HTMLVideoElement>(null)
  const pipCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [streamReady, setStreamReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const landmarkOverlay =
    pipPreview?.showLandmarks && pipPreview
      ? { canvasRef: pipCanvasRef, displayVideoRef: pipVideoRef }
      : undefined

  // 启动摄像头
  useEffect(() => {
    let stream: MediaStream | null = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setStreamReady(true)
          }
        } else {
          setStreamReady(true)
        }
      } catch {
        setCameraError('无法访问摄像头，请在浏览器中允许摄像头权限')
      }
    }

    startCamera()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // 画中画绑定同一 MediaStream（可与主 video 同时播放）
  useEffect(() => {
    if (!streamReady || !pipPreview || !streamRef.current) return
    const el = pipVideoRef.current
    if (!el) return
    el.srcObject = streamRef.current
    el.play().catch(() => {})
  }, [streamReady, pipPreview])

  const { isReady, eyeState, error } = useBlinkDetection(videoRef, {
    onEyeClose,
    onEyeOpen,
    onBlink,
    onDoubleBlink,
    blinkMode,
    enabled: enabled && streamReady,
    landmarkOverlay,
  })

  const anyError = cameraError || error

  const pipW = pipPreview?.width ?? 200
  const pipH = pipPreview?.height ?? 150

  const pipEl =
    pipPreview &&
    (pipPreview.portal === false ? ( // 显式 false 时才留在组件树内
      <div
        className={`blink-detector__pip ${pipPreview.className ?? ''}`}
        style={{ width: pipW, height: pipH }}
      >
        <div className="blink-detector__pip-stack">
          <video
            ref={pipVideoRef}
            className="blink-detector__pip-video"
            muted
            playsInline
            style={{ transform: 'scaleX(-1)' }}
          />
          {pipPreview.showLandmarks && (
            <canvas ref={pipCanvasRef} className="blink-detector__pip-canvas" aria-hidden />
          )}
        </div>
      </div>
    ) : (
      createPortal(
        <div
          className={`blink-detector__pip blink-detector__pip--portal ${pipPreview.className ?? ''}`}
          style={{ width: pipW, height: pipH }}
        >
          <div className="blink-detector__pip-stack">
            <video
              ref={pipVideoRef}
              className="blink-detector__pip-video"
              muted
              playsInline
              style={{ transform: 'scaleX(-1)' }}
            />
            {pipPreview.showLandmarks && (
              <canvas ref={pipCanvasRef} className="blink-detector__pip-canvas" aria-hidden />
            )}
          </div>
        </div>,
        document.body
      )
    ))

  return (
    <div className="blink-detector">
      {/* 摄像头视频流（检测用；主预览可选显示） */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: showPreview ? 'static' : 'absolute',
          opacity: showPreview ? 1 : 0,
          pointerEvents: 'none',
          width: showPreview ? previewWidth : 1,
          height: showPreview ? previewHeight : 1,
          borderRadius: showPreview ? 8 : 0,
          transform: 'scaleX(-1)',
        }}
      />

      {pipEl}

      {/* 状态指示器 */}
      {showPreview && (
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 4, textAlign: 'center' }}>
          {anyError
            ? `⚠️ ${anyError}`
            : !streamReady
              ? '正在启动摄像头...'
              : !isReady
                ? '正在加载检测模型...'
                : eyeState === 'closed'
                  ? '😌 检测到：闭眼'
                  : '👁 检测到：睁眼'}
        </div>
      )}
    </div>
  )
}
