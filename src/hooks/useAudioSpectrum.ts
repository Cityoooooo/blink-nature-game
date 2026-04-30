import { useEffect, useRef } from 'react'
import { Howler } from 'howler'

/**
 * 接入 Howler.js 的 AudioContext，返回一个 AnalyserNode ref。
 * 当 Howler 尚未初始化时自动重试，最多等待约 12 秒。
 *
 * 用法：在 Canvas 动画帧里调用 analyserRef.current?.getByteFrequencyData(arr)
 */
export function useAudioSpectrum(fftSize = 128) {
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    let attempts = 0

    const tryConnect = () => {
      try {
        // Howler v2 公开属性
        const ctx = Howler.ctx as AudioContext | undefined
        const masterGain = Howler.masterGain as GainNode | undefined

        if (ctx && masterGain && ctx.state !== 'closed') {
          if (analyserRef.current) return // 已连接

          const analyser = ctx.createAnalyser()
          analyser.fftSize = fftSize
          analyser.smoothingTimeConstant = 0.65   // 降低平滑，衰减更快，律动更脆
          // 仅"监听"信号，不影响音频路由
          masterGain.connect(analyser)
          analyserRef.current = analyser
          return
        }
      } catch {
        // Howler 尚未初始化，忽略
      }

      if (attempts++ < 30) {
        setTimeout(tryConnect, 400)
      }
    }

    tryConnect()

    return () => {
      try {
        analyserRef.current?.disconnect()
      } catch {
        // ignore
      }
      analyserRef.current = null
    }
  }, [fftSize])

  return analyserRef
}
