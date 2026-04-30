import { useEffect, useRef } from 'react'
import { useAudioSpectrum } from '../../hooks/useAudioSpectrum'

interface ViewfinderRingProps {
  active?: boolean
  size?: number
  /** 场景专属颜色，hex 格式，如 "#FFFFFF" */
  color?: string
}

const BAR_COUNT = 100    // 与参考代码一致
const FFT_SIZE = 128
const INNER_GAP = 20
const MAX_ALPHA = 0.75   // 统一不透明度上限

/** hex "#RRGGBB" → [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return [r, g, b]
}

export function ViewfinderRing({ active = false, size = 600, color = '#FB923C' }: ViewfinderRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useAudioSpectrum(FFT_SIZE)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const [cr, cg, cb] = hexToRgb(color)

    const cx = size / 2
    const cy = size / 2
    // 参考代码 radius=240 对应 600px 画布，保持比例
    const BASE_R  = size * 0.40
    // 基础高度 15px（参考值），最大高度根据画布比例缩放
    const BASE_HEIGHT = size * 0.025        // ~15px @ 600
    const MAX_EXTRA   = size * 0.095        // 音频满幅时最大额外高度
    // idle noise 振幅（参考：15/2 + 8/2 + 5/2 = 14）
    const NOISE_A1 = size * 0.025           // ~15px
    const NOISE_A2 = size * 0.013           // ~8px
    const NOISE_A3 = size * 0.008           // ~5px

    const freqData = new Uint8Array(FFT_SIZE / 2)

    const angles = Array.from({ length: BAR_COUNT }, (_, i) =>
      (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2,
    )

    function draw(ts: number) {
      rafRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, size, size)

      const analyser = analyserRef.current
      let hasSignal = false
      if (analyser) {
        analyser.getByteFrequencyData(freqData)
        hasSignal = freqData.some((v) => v > 3)
      }

      // 参考代码的时间变量
      const time = ts * 0.002

      ctx.save()
      ctx.translate(cx, cy)
      ctx.lineCap = 'round'

      // ── 刻度线 ──
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = angles[i]

        let barLen: number

        if (hasSignal) {
          // 音频驱动：频率数据 + 少量 noise 叠加，让形状更生动
          const binIdx = Math.min(
            Math.floor(Math.pow(i / BAR_COUNT, 1.3) * freqData.length),
            freqData.length - 1,
          )
          const raw = freqData[binIdx] / 255
          const audioVal = Math.min(Math.pow(raw, 1.5) * 1.3, 1)

          // 叠加小幅 noise 让音频状态下形状不那么"死板"
          const noise = Math.sin(angle * 6 + time) * NOISE_A1 * 0.3 +
                        Math.sin(angle * 14 - time * 0.5) * NOISE_A2 * 0.3
          barLen = BASE_HEIGHT + audioVal * MAX_EXTRA + Math.abs(noise)
        } else {
          // idle：参考代码的多层正弦叠加，形状更有层次
          const noise =
            Math.sin(angle * 6 + time) * NOISE_A1 +
            Math.sin(angle * 14 - time * 0.5) * NOISE_A2 +
            Math.cos(angle * 4 + time * 1.5) * NOISE_A3
          // 加少许随机抖动（参考代码中的 Math.random() * 5）
          barLen = BASE_HEIGHT + Math.abs(noise) + Math.random() * (size * 0.008)
        }

        const x1 = Math.cos(angle) * BASE_R
        const y1 = Math.sin(angle) * BASE_R
        const x2 = Math.cos(angle) * (BASE_R + barLen)
        const y2 = Math.sin(angle) * (BASE_R + barLen)

        // 参考代码：alpha = 0.6 + barHeight/60，缩放后乘以 MAX_ALPHA
        const refAlpha = 0.6 + barLen / (size * 0.1)
        const alpha = Math.min(refAlpha, 1.0) * MAX_ALPHA

        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx.lineWidth = 4   // 参考代码 lineWidth = 4

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // ── 内圈虚线 ──
      const innerR = BASE_R - INNER_GAP
      const dashAlpha = (active ? 0.6 : 0.3) * MAX_ALPHA
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${dashAlpha})`
      ctx.lineWidth = 1.2
      ctx.setLineDash([5, 9])
      ctx.beginPath()
      ctx.arc(0, 0, innerR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, size, color, analyserRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  )
}
