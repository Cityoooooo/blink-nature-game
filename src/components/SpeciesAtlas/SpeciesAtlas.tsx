import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import animalsData from '../../data/animals.json'
import './SpeciesAtlas.css'

const CONSERVATION_LABEL: Record<string, string> = {
  LC: '无危',
  NT: '近危',
  VU: '易危',
  EN: '濒危',
  CR: '极危',
  DD: '数据缺乏',
}


/* 单张收集卡 */
function CollectCard({
  src,
  animalName,
  knowledgeText,
  knowledgeLabel,
  unlocked,
  sceneId,
  conservationCode,
}: {
  src: string
  animalName: string
  knowledgeText: string
  knowledgeLabel: string
  unlocked: boolean
  sceneId: string
  conservationCode: string
}) {
  const bgSvg     = `/assets/cards/bg-${sceneId}.svg`
  const borderSvg = `/assets/cards/border-${sceneId}.svg`
  const badgeSvg  = `/assets/cards/badge-${conservationCode}.svg`

  return (
    <div className={`sa-card ${unlocked ? 'sa-card--unlocked' : 'sa-card--locked'}`}>
      <img className="sa-card__bg"     src={bgSvg}     alt="" aria-hidden />

      {unlocked && (
        <div className="sa-card__photo">
          <img src={src} alt={animalName} />
        </div>
      )}
      {!unlocked && (
        <div className="sa-card__lock-overlay">
          <span className="sa-card__lock-icon">🔒</span>
          <span className="sa-card__lock-text">未解锁</span>
        </div>
      )}

      <img className="sa-card__border" src={borderSvg} alt="" aria-hidden />
      <img className="sa-card__badge"  src={badgeSvg}  alt="" aria-hidden />

      {/* 动物名（叠在梯形横幅上，仅解锁时显示） */}
      {unlocked && (
        <div className="sa-card__name-overlay">
          <span className="sa-card__name-text">{animalName}</span>
        </div>
      )}

      {/* 知识文字区（白色面板内，仅解锁时显示） */}
      {unlocked && (
        <div className="sa-card__knowledge-area">
          <p className="sa-card__knowledge-text">{knowledgeText}</p>
        </div>
      )}

      {/* 知识标签（底部，仅解锁时显示） */}
      {unlocked && (
        <div className="sa-card__knowledge-label">{knowledgeLabel}</div>
      )}
    </div>
  )
}

export function SpeciesAtlas() {
  const { detailAnimalId, bestiary, goToBestiary } = useGameStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  if (!detailAnimalId) return null

  const animal = animalsData.animals[detailAnimalId as keyof typeof animalsData.animals]
  const record  = bestiary[detailAnimalId]
  const sceneId = animal.sceneId

  const allPhotos = [animal.baseImage, ...animal.unlockImages]
  const captureCount = record?.captureCount ?? 0

  const handlePlayAudio = () => {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    const audio = new Audio(animal.sound)
    audioRef.current = audio
    audio.play()
    setPlaying(true)
    audio.onended = () => setPlaying(false)
  }

  const totalDiscovered = Object.keys(bestiary).length
  const totalAnimals    = Object.keys(animalsData.animals).length

  return (
    <motion.div
      className="sa-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── 顶部导航栏 ── */}
      <header className="sa-header">
        <div className="sa-header__brand">
          <span className="sa-header__icon">🐾</span>
          <div className="sa-header__titles">
            <span className="sa-header__zh">稀有物种图鉴</span>
            <span className="sa-header__en">SPECIES ATLAS</span>
          </div>
        </div>

        <div className="sa-header__actions">
          <button className="sa-header__exit-btn" onClick={goToBestiary}>
            <span className="sa-header__exit-icon">↩</span>
            退出档案 (EXIT)
          </button>
          <div className="sa-header__progress">
            <span className="sa-header__progress-label">已收集</span>
            <span className="sa-header__progress-val">{totalDiscovered}<span className="sa-header__progress-total">/{totalAnimals}</span></span>
          </div>
        </div>
      </header>

      {/* ── 主体区域（黄色圆角大框） ── */}
      <main className="sa-main">
        <div className="sa-main-card">
          {/* 左侧卡通大图 */}
          <div className="sa-photo-wrap">
            <img
              className="sa-photo"
              src={animal.cartoonImage}
              alt={animal.nameZh}
            />
            <div className="sa-photo__fade" />
          </div>

          {/* 右侧信息区 */}
          <div className="sa-info">
            {/* 物种名 */}
            <div className="sa-info__names">
              <h1 className="sa-info__name-zh">{animal.nameZh}</h1>
              <p  className="sa-info__name-en">{animal.nameEn}</p>
            </div>

            {/* 声学特征 + 主要栖息地 */}
            <div className="sa-info__cards-row">
              {/* 声学特征卡 */}
              <div className="sa-info-card sa-info-card--sound">
                <div className="sa-info-card__head">
                  <img className="sa-info-card__icon" src="/assets/icons/icon-acoustic.svg" alt="" aria-hidden />
                  <div className="sa-info-card__titles">
                    <div className="sa-info-card__title">声学特征</div>
                    <div className="sa-info-card__subtitle">ACOUSTIC FEATURES</div>
                  </div>
                </div>
                <button
                  className={`sa-play-btn ${playing ? 'sa-play-btn--playing' : ''}`}
                  onClick={handlePlayAudio}
                >
                  <span>{playing ? '⏹' : '▶'}</span>
                  {playing ? '停止' : '播放音频'}
                </button>
              </div>

              {/* 主要栖息地卡 */}
              <div className="sa-info-card sa-info-card--habitat">
                <div className="sa-info-card__head">
                  <img className="sa-info-card__icon" src="/assets/icons/icon-habitat.svg" alt="" aria-hidden />
                  <div className="sa-info-card__titles">
                    <div className="sa-info-card__title">主要栖息地</div>
                    <div className="sa-info-card__subtitle">PRIMARY HABITAT</div>
                  </div>
                </div>
                <div className="sa-habitat-detail">
                  <div className="sa-habitat-detail__name">{animal.habitat}</div>
                  <div className="sa-habitat-detail__meta">
                    {animal.climate}
                    {animal.altitude !== '海平面' ? ` / 海拔 ${animal.altitude}` : ' / 海平面'}
                  </div>
                </div>
              </div>
            </div>

            {/* 声音描述 */}
            <p className="sa-info__sound-desc">
              <span className="sa-info__sound-bar">|</span>
              {' '}声音：{animal.soundDescription}
            </p>

            {/* 4 格属性 */}
            <div className="sa-stats">
              {[
                { key: 'diet',     label: '食性', value: animal.diet },
                { key: 'activity', label: '活动', value: animal.activity },
                { key: 'lifespan', label: '寿命', value: animal.lifespan },
                { key: 'weight',   label: '重量', value: animal.weight },
              ].map(({ key, label, value }) => (
                <div key={key} className="sa-stat">
                  <div className="sa-stat__upper">
                    <span className="sa-stat__value">{value}</span>
                  </div>
                  <div className="sa-stat__divider" />
                  <div className="sa-stat__lower">
                    <img
                      className="sa-stat__icon"
                      src={`/assets/icons/icon-${key}.svg`}
                      alt=""
                      aria-hidden
                    />
                    <span className="sa-stat__label">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 濒危徽章：独立 SVG，悬浮在黄色大框右上角 */}
        <div className="sa-conservation-badge">
          <img
            src={`/assets/icons/badge-standalone-${animal.conservationCode}.svg`}
            alt={CONSERVATION_LABEL[animal.conservationCode]}
          />
        </div>
      </main>

      {/* ── 底部收集卡片行 ── */}
      <section className="sa-cards-section">
        {/* 装饰背景图（绝对定位在卡片区底层） */}
        <img className="sa-cards-bg" src="/assets/ui/cards-bg.png" alt="" aria-hidden />
        <div className="sa-cards-row">
          {allPhotos.map((src, i) => {
            const isFirst      = i === 0
            const knowledgeText  = isFirst ? animal.mythology : (animal.trivia[i - 1] ?? '')
            const knowledgeLabel = isFirst ? '神话传说' : '物种冷知识'
            return (
              <CollectCard
                key={i}
                src={src}
                animalName={animal.nameZh}
                knowledgeText={knowledgeText}
                knowledgeLabel={knowledgeLabel}
                unlocked={captureCount > i}
                sceneId={sceneId}
                conservationCode={animal.conservationCode}
              />
            )
          })}
        </div>

      </section>

      {/* ── 底部状态栏 ── */}
      <footer className="sa-footer">
        <span>SYS_STATUS: OPTIMAL</span>
        <span>CONNECTION: ENCRYPTED</span>
        <span>DATA_VERSION: 10.02.DR</span>
        <span>RESOLUTION: 16:9 NATIVE</span>
        <span className="sa-footer__live">● LIVE ARCHIVE ACCESS</span>
      </footer>
    </motion.div>
  )
}
