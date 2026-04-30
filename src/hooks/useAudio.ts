import { useRef, useCallback, useEffect } from 'react'
import { Howl } from 'howler'

interface AudioLayer {
  ambient: Howl | null
  animal: Howl | null
}

export function useAudio() {
  const layersRef = useRef<AudioLayer>({ ambient: null, animal: null })
  const sfxCacheRef = useRef<Map<string, Howl>>(new Map())

  const stopAll = useCallback(() => {
    layersRef.current.ambient?.stop()
    layersRef.current.animal?.stop()
    layersRef.current.ambient = null
    layersRef.current.animal = null
    sfxCacheRef.current.forEach((h) => h.stop())
  }, [])

  // 播放场景背景环境音（循环）
  const playAmbient = useCallback((src: string) => {
    layersRef.current.ambient?.stop()
    const howl = new Howl({
      src: [src],
      loop: true,
      volume: 0,
      html5: true,
    })
    howl.play()
    howl.fade(0, 0.7, 2000) // 2秒淡入
    layersRef.current.ambient = howl
  }, [])

  // 混入动物叫声（播放一次，叠加在背景音上）
  const playAnimalSound = useCallback(
    (src: string, onEnd?: () => void) => {
      layersRef.current.animal?.stop()
      const howl = new Howl({
        src: [src],
        loop: false,
        volume: 0,
        html5: true,
        onend: onEnd,
      })
      howl.play()
      howl.fade(0, 1.0, 1000) // 1秒淡入，突出于背景音
      layersRef.current.animal = howl
    },
    []
  )

  // 淡出并停止背景环境音
  const fadeOutAmbient = useCallback((duration = 1500) => {
    const ambient = layersRef.current.ambient
    if (!ambient) return
    ambient.fade(ambient.volume(), 0, duration)
    setTimeout(() => {
      ambient.stop()
      layersRef.current.ambient = null
    }, duration + 100)
  }, [])

  /** 短音效（叠加在环境音/动物音上，无淡入淡出；Web Audio 比 html5 更利于短素材） */
  const playSfx = useCallback((src: string, volume = 0.9) => {
    let howl = sfxCacheRef.current.get(src)
    if (!howl) {
      howl = new Howl({
        src: [src],
        loop: false,
        volume,
        html5: false,
        preload: true,
        onloaderror: (_id, err) => {
          if (import.meta.env.DEV) console.warn('[useAudio playSfx] load failed:', src, err)
        },
      })
      sfxCacheRef.current.set(src, howl)
    }
    howl.volume(volume)
    const fire = () => {
      howl!.volume(volume)
      howl!.stop()
      howl!.play()
    }
    // 解码完成前不要 stop()，以免部分环境下首帧无声；就绪后与后续触发统一走 fire
    if (howl.state() !== 'loaded') {
      howl.once('load', fire)
      return
    }
    fire()
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopAll()
      sfxCacheRef.current.forEach((h) => h.unload())
      sfxCacheRef.current.clear()
    }
  }, [stopAll])

  return { playAmbient, playAnimalSound, fadeOutAmbient, playSfx, stopAll }
}
