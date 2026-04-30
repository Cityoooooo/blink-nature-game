import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { BlinkDetector } from '../BlinkDetector/BlinkDetector'
import { AnimalCard } from '../AnimalCard/AnimalCard'
import { ViewfinderRing } from '../ViewfinderRing/ViewfinderRing'
import { useAudio } from '../../hooks/useAudio'
import animalsData from '../../data/animals.json'
import './GameScene.css'

const CAPTURE_SFX = '/assets/sfx/capture.mp3'

type SceneData = (typeof animalsData.scenes)[number] & {
  navName?: string
  navIcon?: string
  altitude?: string
  climate?: string
  gps?: string
  description?: string
  ringColor?: string
}

export function GameScene() {
  const {
    phase,
    currentSceneId,
    currentAnimalId,
    setPhase,
    selectScene,
    spawnAnimal,
    captureAnimal,
    continueInScene,
    goToBestiary,
    goToProfile,
  } = useGameStore()

  const { playAmbient, playAnimalSound, fadeOutAmbient, playSfx } = useAudio()

  const [eyesClosed, setEyesClosed] = useState(false)   // 用户当前是否物理闭眼
  const [captureFlash, setCaptureFlash] = useState(false)
  const [doubleBinkHint, setDoubleBinkHint] = useState(false)
  const [journalVisible, setJournalVisible] = useState(false)
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSpawnedRef = useRef(false)

  const scenes = animalsData.scenes as SceneData[]
  const scene = scenes.find((s) => s.id === currentSceneId) as SceneData | undefined
  const animal = currentAnimalId
    ? animalsData.animals[currentAnimalId as keyof typeof animalsData.animals]
    : null

  const ringColor = scene?.ringColor ?? '#FB923C'

  // 将 hex 转为 rgba（透明度 25%），用于动物头像描边
  const ringColorBorder = (() => {
    const h = ringColor.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},0.25)`
  })()

  // 进入场景播放背景音，重置状态
  useEffect(() => {
    if (!scene) return
    hasSpawnedRef.current = false
    setEyesClosed(false)
    setJournalVisible(false)
    playAmbient(scene.ambientSound)
    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    }
  }, [scene?.id])

  // 卡片出现时显示双眨眼提示
  useEffect(() => {
    if (phase === 'card-reveal') {
      const t = setTimeout(() => setDoubleBinkHint(true), 1200)
      return () => clearTimeout(t)
    } else {
      setDoubleBinkHint(false)
    }
  }, [phase])

  // 动物出现时显示感官日志
  useEffect(() => {
    if (phase === 'animal-appears' || phase === 'blink-capture') {
      setJournalVisible(true)
    } else if (phase === 'eyes-closed') {
      setJournalVisible(false)
    }
  }, [phase])

  // 闭眼 → 记录物理状态 + 随机延迟后生成动物
  const handleEyeClose = useCallback(() => {
    setEyesClosed(true)
    if (phase !== 'eyes-closed' || hasSpawnedRef.current) return
    hasSpawnedRef.current = true

    const delay = 3000 + Math.random() * 4000
    spawnTimerRef.current = setTimeout(() => {
      if (!scene) return
      const randomId = scene.animalIds[Math.floor(Math.random() * scene.animalIds.length)]
      const animalData = animalsData.animals[randomId as keyof typeof animalsData.animals]
      playAnimalSound(animalData.sound)
      spawnAnimal(randomId)
    }, delay)
  }, [phase, scene, playAnimalSound, spawnAnimal])

  // 睁眼 → 记录物理状态 + 切换到等待抓拍
  const handleEyeOpen = useCallback(() => {
    setEyesClosed(false)
    if (phase === 'animal-appears') {
      setPhase('blink-capture')
    }
  }, [phase, setPhase])

  // 单次眨眼 → 抓拍
  const handleBlink = useCallback(() => {
    if (phase !== 'blink-capture') return
    playSfx(CAPTURE_SFX)
    setCaptureFlash(true)
    setTimeout(() => setCaptureFlash(false), 400)
    fadeOutAmbient(800)
    setTimeout(() => captureAnimal(), 400)
  }, [phase, playSfx, fadeOutAmbient, captureAnimal])

  // 双眨眼 → 关闭卡片，留在当前场景继续
  const handleDoubleBlink = useCallback(() => {
    if (phase !== 'card-reveal') return
    hasSpawnedRef.current = false
    setEyesClosed(false)
    playAmbient(scene?.ambientSound ?? '')
    continueInScene()
  }, [phase, scene, playAmbient, continueInScene])

  // 切换场景
  const handleSceneSwitch = useCallback((sceneId: string) => {
    if (sceneId === currentSceneId) return
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    hasSpawnedRef.current = false
    setEyesClosed(false)
    selectScene(sceneId)
  }, [currentSceneId, selectScene])

  const blinkEnabled =
    phase === 'eyes-closed' ||
    phase === 'animal-appears' ||
    phase === 'blink-capture' ||
    phase === 'card-reveal'

  // 取景器显示条件：用户已闭眼 或 动物已出现
  const ringVisible =
    eyesClosed ||
    phase === 'animal-appears' ||
    phase === 'blink-capture'

  // 提示文字：仅在 eyes-closed 阶段且用户尚未闭眼时显示
  const showHint = phase === 'eyes-closed' && !eyesClosed

  const isBlinkCapture = phase === 'blink-capture'

  return (
    <div
      className="gs-root"
      style={{
        backgroundImage: scene
          ? `url(${scene.bgImage})`
          : 'linear-gradient(135deg, #1a1a2e, #0f3460)',
      }}
    >
      {/* 黑色遮罩 */}
      <motion.div
        className="gs-overlay"
        animate={{ opacity: eyesClosed ? 0.55 : 0.15 }}
        transition={{ duration: 0.6 }}
      />

      {/* 抓拍闪光 */}
      <AnimatePresence>
        {captureFlash && (
          <motion.div
            className="gs-flash"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* ===== 顶部左侧：标题 + 场景卡片 ===== */}
      <div className="gs-topleft">
        <div className="gs-title-row">
          <span className="gs-title-zh">地球耳语</span>
          <span className="gs-title-en">EARTH WHISPERER</span>
          <div className="gs-title-bar" />
        </div>

        <div className="gs-scene-card">
          <div className="gs-scene-card__header">
            <span className="gs-scene-name">{scene?.nameZh ?? '加载中...'}</span>
            <div className="gs-scene-divider" />
            <div className="gs-scene-tags">
              <span className="gs-tag gs-tag--blue">
                <span className="gs-tag-icon">⛰</span>
                海拔: {scene?.altitude ?? '--'}
              </span>
              <span className="gs-tag gs-tag--orange">
                <span className="gs-tag-icon">🌡</span>
                气候: {scene?.climate ?? '--'}
              </span>
            </div>
          </div>
        </div>

        <div className="gs-scene-quote">
          "{scene?.description ?? ''}"
        </div>
      </div>

      {/* ===== 顶部右侧：GPS + 场景导航 ===== */}
      <div className="gs-topright">
        <div className="gs-gps">
          <span className="gs-gps__label">GLOBAL COORDINATES</span>
          <span className="gs-gps__value">{scene?.gps ?? '--'}</span>
          <span className="gs-gps__icon">🌐</span>
        </div>

        <div className="gs-nav">
          {scenes.map((s) => (
            <button
              key={s.id}
              className={`gs-nav__btn ${s.id === currentSceneId ? 'gs-nav__btn--active' : ''}`}
              onClick={() => handleSceneSwitch(s.id)}
            >
              <span className="gs-nav__icon">{s.navIcon}</span>
              <span className="gs-nav__label">{s.navName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 中央取景器 ===== */}
      <div className="gs-center">
        {/* 取景器：闭眼后或动物出现后才显示 */}
        <AnimatePresence>
          {ringVisible && (
            <motion.div
              className="gs-ring-wrap"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <ViewfinderRing
                active={isBlinkCapture}
                size={600}
                color={ringColor}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 闭眼提示文字（未闭眼时显示） */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              className="gs-listen-hint"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span>闭上眼睛</span>
              <span className="gs-listen-hint__sub">聆听自然之声...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 圆形动物头像（动物出现后在取景器中央显示） */}
        <AnimatePresence>
          {animal && (phase === 'animal-appears' || phase === 'blink-capture') && (
            <motion.div
              className="gs-animal-portrait"
              style={{ borderColor: ringColorBorder }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <img src={animal.cartoonImage} alt={animal.nameZh} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 眨眼抓拍提示 */}
        <AnimatePresence>
          {isBlinkCapture && (
            <motion.div
              className="gs-capture-hint"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.3 }}
            >
              眨眼抓拍！
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== 底部左侧：感官日志 ===== */}
      <AnimatePresence>
        {journalVisible && animal && (
          <motion.div
            className="gs-journal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="gs-journal__title">
              <span className="gs-journal__icon">🎙</span>
              <span>感官日志 / JOURNAL</span>
            </div>
            <div className="gs-journal__content">
              | &nbsp;{animal.soundDescription}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 底部右侧：个人主页 + 珍稀物种图鉴 ===== */}
      <div className="gs-bottom-actions">
        <button type="button" className="gs-profile-btn" onClick={goToProfile}>
          <div className="gs-profile-btn__text">
            <span className="gs-profile-btn__zh">个人主页</span>
            <span className="gs-profile-btn__en">Profile</span>
          </div>
          <span className="gs-profile-btn__icon">👤</span>
        </button>
        <button type="button" className="gs-bestiary-btn" onClick={goToBestiary}>
          <div className="gs-bestiary-btn__text">
            <span className="gs-bestiary-btn__zh">珍稀物种图鉴</span>
            <span className="gs-bestiary-btn__en">Species Atlas</span>
          </div>
          <span className="gs-bestiary-btn__icon">🐾</span>
        </button>
      </div>

      {/* ===== 科普卡片叠加层 ===== */}
      <AnimatePresence>
        {phase === 'card-reveal' && (
          <AnimalCard
            onContinue={() => {
              hasSpawnedRef.current = false
              setEyesClosed(false)
              playAmbient(scene?.ambientSound ?? '')
              continueInScene()
            }}
            onBestiary={goToBestiary}
            doubleBinkHint={doubleBinkHint}
          />
        )}
      </AnimatePresence>

      {/* ===== 眨眼检测器 ===== */}
      <BlinkDetector
        onEyeClose={handleEyeClose}
        onEyeOpen={handleEyeOpen}
        onBlink={handleBlink}
        onDoubleBlink={handleDoubleBlink}
        blinkMode={phase === 'card-reveal' ? 'double' : 'single'}
        enabled={blinkEnabled}
      />
    </div>
  )
}
