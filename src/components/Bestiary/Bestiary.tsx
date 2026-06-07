import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import animalsData from '../../data/animalsData'
import './Bestiary.css'

const CONSERVATION_COLOR: Record<string, string> = {
  LC: '#4caf50',
  NT: '#EFCC7C',
  VU: '#ff9800',
  EN: '#f44336',
  CR: '#9c27b0',
  DD: '#9e9e9e',
}


export function Bestiary() {
  const { bestiary, backFromBestiary, goToSpeciesDetail } = useGameStore()
  const [filterScene, setFilterScene] = useState<string>('all')

  const filteredAnimals = animalsData.scenes
    .filter((s) => filterScene === 'all' || s.id === filterScene)
    .flatMap((s) => s.animalIds.map((id) => ({ id, sceneId: s.id, sceneNameZh: s.nameZh })))

  return (
    <div className="bestiary">
      {/* 顶部导航 */}
      <div className="bestiary__nav">
        <button type="button" className="bestiary__back" onClick={backFromBestiary}>
          ← 返回
        </button>
        <div className="bestiary__brand">
          <span className="bestiary__brand-icon">🐾</span>
          <div className="bestiary__brand-titles">
            <span className="bestiary__brand-zh">珍稀物种图鉴</span>
            <span className="bestiary__brand-en">SPECIES ATLAS</span>
          </div>
        </div>
        <div className="bestiary__count">
          <span className="bestiary__count-label">已收集</span>
          <span className="bestiary__count-num">
            {Object.keys(bestiary).length}
            <span className="bestiary__count-total">/{Object.keys(animalsData.animals).length}</span>
          </span>
        </div>
      </div>

      {/* 场景筛选 */}
      <div className="bestiary__filter">
        <button
          className={`filter-btn ${filterScene === 'all' ? 'active' : ''}`}
          onClick={() => setFilterScene('all')}
        >
          全部
        </button>
        {animalsData.scenes.map((s) => (
          <button
            key={s.id}
            className={`filter-btn ${filterScene === s.id ? 'active' : ''}`}
            onClick={() => setFilterScene(s.id)}
          >
            {s.nameZh}
          </button>
        ))}
      </div>

      {/* 动物网格 */}
      <div className="bestiary__grid">
        {filteredAnimals.map(({ id, sceneNameZh }) => {
          const record = bestiary[id]
          const discovered = !!record
          const animal = animalsData.animals[id as keyof typeof animalsData.animals]

          return (
            <motion.button
              key={id}
              className={`bestiary-card ${discovered ? 'discovered' : 'undiscovered'}`}
              onClick={() => discovered && goToSpeciesDetail(id)}
              whileHover={discovered ? { scale: 1.05 } : {}}
              whileTap={discovered ? { scale: 0.96 } : {}}
              layout
            >
              {discovered ? (
                <>
                  <div className="bestiary-card__img-wrap">
                    <img src={animal.cartoonImage} alt={animal.nameZh} />
                    <span
                      className="bestiary-card__conservation"
                      style={{ background: CONSERVATION_COLOR[animal.conservationCode] }}
                    >
                      {animal.conservationCode}
                    </span>
                  </div>
                  <p className="bestiary-card__name">{animal.nameZh}</p>
                  <p className="bestiary-card__scene">{sceneNameZh}</p>
                  <div className="bestiary-card__photos">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`photo-dot ${i < record.captureCount ? 'unlocked' : ''}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="bestiary-card__unknown">?</div>
                  <p className="bestiary-card__name">???</p>
                  <p className="bestiary-card__scene">{sceneNameZh}</p>
                </>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
