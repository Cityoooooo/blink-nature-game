import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import './StartScreen.css'

const BG_VIDEO = `/assets/${encodeURIComponent('begin video.mp4')}`

export function StartScreen() {
  const { enterGame, goToCalibration } = useGameStore()

  return (
    <div className="start-screen">
      <video className="start-screen__video" autoPlay muted loop playsInline>
        <source src={BG_VIDEO} type="video/mp4" />
      </video>

      <div className="start-screen__actions-wrap">
        <motion.div
          className="start-screen__actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            type="button"
            className="start-screen__btn start-screen__btn--primary"
            onClick={enterGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            开始游戏
          </motion.button>
          <motion.button
            type="button"
            className="start-screen__btn start-screen__btn--secondary"
            onClick={() => goToCalibration('start')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            眨眼校准
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
