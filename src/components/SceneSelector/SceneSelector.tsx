import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import animalsData from '../../data/animals.json'
import './SceneSelector.css'

const SCENE_EMOJIS: Record<string, string> = {
  arctic: '❄️',
  rainforest: '🌿',
  savanna: '🌾',
  island: '🌊',
  desert: '🏜️',
}

export function SceneSelector() {
  const { selectScene, goToBestiary, bestiary } = useGameStore()

  const totalAnimals = Object.keys(animalsData.animals).length
  const caughtAnimals = Object.keys(bestiary).length

  return (
    <div className="scene-selector">
      <motion.div
        className="scene-selector__header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="scene-selector__title">自然捕影</h1>
        <p className="scene-selector__subtitle">闭上眼睛，聆听自然，睁眼时用眨眼捕捉珍稀动物</p>
      </motion.div>

      <motion.div
        className="scene-selector__grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {animalsData.scenes.map((scene, i) => {
          const caughtInScene = scene.animalIds.filter((id) => bestiary[id]).length
          return (
            <motion.button
              key={scene.id}
              className="scene-card"
              onClick={() => selectScene(scene.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(/assets/scenes/${scene.id}/bg.jpg)`,
              }}
            >
              <span className="scene-card__emoji">{SCENE_EMOJIS[scene.id]}</span>
              <h2 className="scene-card__name">{scene.nameZh}</h2>
              <p className="scene-card__name-en">{scene.nameEn}</p>
              <p className="scene-card__progress">
                {caughtInScene} / {scene.animalIds.length} 已发现
              </p>
            </motion.button>
          )
        })}
      </motion.div>

      <motion.button
        className="bestiary-entry-btn"
        onClick={goToBestiary}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        📖 动物图鉴 · {caughtAnimals}/{totalAnimals}
      </motion.button>
    </div>
  )
}
