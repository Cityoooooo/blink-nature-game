import { useRef, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import animalsData from '../../data/animals.json'
import './AnimalCard.css'

/* ─── 濒危等级 ─── */
const CONSERVATION_LABEL: Record<string, string> = {
  LC: '无危',
  NT: '近危',
  VU: '易危',
  EN: '濒危',
  CR: '极危',
  DD: '数据缺乏',
}

interface AnimalCardProps {
  onContinue: () => void
  onBestiary: () => void
  doubleBinkHint?: boolean
}

export function AnimalCard({ onContinue, onBestiary, doubleBinkHint = false }: AnimalCardProps) {
  const { currentAnimalId, currentSceneId, bestiary } = useGameStore()

  /* ─ 所有 hooks 必须在 early return 之前无条件调用 ─ */
  const textRef = useRef<HTMLParagraphElement>(null)

  const animal = currentAnimalId
    ? animalsData.animals[currentAnimalId as keyof typeof animalsData.animals]
    : null
  const record              = currentAnimalId ? bestiary[currentAnimalId] : null
  const captureCount        = record?.captureCount ?? 1
  const unlockedTriviaCount = record?.unlockedTriviaCount ?? 0
  const isFirstCapture      = captureCount === 1
  const newTriviaIndex      = unlockedTriviaCount - 1
  const knowledgeText       = animal
    ? (isFirstCapture ? animal.mythology : (animal.trivia[newTriviaIndex] ?? ''))
    : ''

  /* 渲染后测量文字高度，自动缩小字号直到刚好两行 */
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el || !knowledgeText) return
    const LINE_H    = 1.6
    const MAX_SIZE  = 17.5
    const MIN_SIZE  = 12
    for (let size = MAX_SIZE; size >= MIN_SIZE; size -= 0.5) {
      el.style.fontSize = `${size}px`
      /* scrollHeight = 实际渲染高度；超过两行则继续缩小 */
      if (el.scrollHeight <= Math.ceil(size * LINE_H * 2) + 2) break
    }
  }, [knowledgeText])

  if (!currentAnimalId || !animal) return null

  const displayImage = unlockedTriviaCount > 0
    ? animal.unlockImages[unlockedTriviaCount - 1]
    : animal.baseImage

  const sceneId   = currentSceneId ?? 'savanna'
  const bgSvg     = `/assets/cards/bg-${sceneId}.svg`
  const borderSvg = `/assets/cards/border-${sceneId}.svg`
  const badgeSvg  = `/assets/cards/badge-${animal.conservationCode}.svg`

  const knowledgeLabel = isFirstCapture ? '神话传说' : '物种冷知识'

  return (
    <div className="card-overlay">
      <div className="card-outer-wrap">

        {/* ══ 双眨眼提示占位容器（固定高度，卡片位置不受影响） ══ */}
        <div className="card-hint-slot">
          {doubleBinkHint && (
            <div className="card-hint">👁👁 连续眨眼两次继续探索</div>
          )}
        </div>

        {/* ══ 游戏卡片主体 (488×488) ══ */}
        <motion.div
          className="animal-card"
          initial={{ opacity: 0, scale: 0.72, y: 56 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.72, y: 56 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          {/* 层 0: 场景背景渐变 SVG */}
          <img
            className="card-svg-bg"
            src={bgSvg}
            alt=""
            aria-hidden="true"
          />

          {/* 层 2: 动物图片（上方图片区） */}
          <div className="card-photo">
            <motion.img
              src={displayImage}
              alt={animal.nameZh}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            />
          </div>

          {/* 层 3: 边框 SVG（含白色文字面板、梯形横幅形状、装饰线框） */}
          <img
            className="card-svg-border"
            src={borderSvg}
            alt=""
            aria-hidden="true"
          />

          {/* 层 4: 濒危等级徽章 SVG（与边框同尺寸，自动对齐） */}
          <img
            className="card-svg-badge"
            src={badgeSvg}
            alt={CONSERVATION_LABEL[animal.conservationCode]}
          />

          {/* 层 5a: 动物名称（叠在梯形横幅上） */}
          <div className="card-name-overlay">
            <span className="card-name-text">{animal.nameZh}</span>
          </div>

          {/* 层 5b: 知识文字 */}
          <div className="card-text-content">
            <p ref={textRef} className="card-knowledge-text">{knowledgeText}</p>
          </div>

          {/* 层 5c: 知识类型标签（独立定位，不受文字容器影响） */}
          <div className="card-knowledge-label">{knowledgeLabel}</div>
        </motion.div>

        {/* ══ 卡片下方按钮 ══ */}
        <div className="card-btn-row">
          <motion.button
            className="card-btn card-btn--continue"
            onClick={onContinue}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
          >
            继续探索
          </motion.button>
          <motion.button
            className="card-btn card-btn--bestiary"
            onClick={onBestiary}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
          >
            查看图鉴
          </motion.button>
        </div>

      </div>
    </div>
  )
}
