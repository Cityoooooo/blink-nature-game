import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { GameScene } from './components/GameScene/GameScene'
import { SceneSelector } from './components/SceneSelector/SceneSelector'
import { Bestiary } from './components/Bestiary/Bestiary'
import { SpeciesAtlas } from './components/SpeciesAtlas/SpeciesAtlas'
import { StartScreen } from './components/StartScreen/StartScreen'
import { CalibrationScreen } from './components/CalibrationScreen/CalibrationScreen'
import { ProfileScreen } from './components/ProfileScreen/ProfileScreen'
import ClickSpark from './components/ClickSpark/ClickSpark'

function App() {
  const { phase } = useGameStore()

  const inGame =
    phase === 'eyes-closed' ||
    phase === 'animal-appears' ||
    phase === 'blink-capture' ||
    phase === 'card-reveal'

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#FFFBEF',
      }}
    >
      <ClickSpark
        sparkColor="#FFD200"
        sparkSize={12}
        sparkRadius={20}
        sparkCount={8}
        duration={450}
      >
      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'fixed', inset: 0 }}
          >
            <StartScreen />
          </motion.div>
        )}

        {phase === 'calibration' && (
          <motion.div
            key="calibration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5 }}
          >
            <CalibrationScreen />
          </motion.div>
        )}

        {phase === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'fixed', inset: 0, overflow: 'auto' }}
          >
            <ProfileScreen />
          </motion.div>
        )}

        {phase === 'scene-select' && (
          <motion.div
            key="scene-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'fixed', inset: 0, overflow: 'auto' }}
          >
            <SceneSelector />
          </motion.div>
        )}

        {inGame && (
          <motion.div
            key="game-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0 }}
          >
            <GameScene />
          </motion.div>
        )}

        {phase === 'bestiary' && (
          <motion.div
            key="bestiary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
          >
            <Bestiary />
          </motion.div>
        )}

        {phase === 'species-detail' && (
          <motion.div
            key="species-atlas"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'fixed', inset: 0 }}
          >
            <SpeciesAtlas />
          </motion.div>
        )}
      </AnimatePresence>
      </ClickSpark>
    </div>
  )
}

export default App
