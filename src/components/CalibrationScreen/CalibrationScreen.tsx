import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { BlinkDetector } from '../BlinkDetector/BlinkDetector'
import PixelBlast from '../PixelBlast/PixelBlast'
import './CalibrationScreen.css'

type CalibStep = 'single' | 'double' | 'done'

export function CalibrationScreen() {
  const { backFromCalibration, completeCalibration } = useGameStore()
  const [step, setStep] = useState<CalibStep>('single')
  const [burstCount, setBurstCount] = useState(0)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 整页（含顶栏）布局框，用于 PixelBlast 波纹圆心对齐 */
  const calibrationRootRef = useRef<HTMLDivElement>(null)

  const triggerBurst = useCallback(() => {
    setBurstCount((c) => c + 1)
  }, [])

  const onSingleBlink = useCallback(() => {
    if (step !== 'single') return
    triggerBurst()
    setStep('double')
  }, [step, triggerBurst])

  const onDoubleBlinkComplete = useCallback(() => {
    if (step !== 'double') return
    triggerBurst()
    setStep('done')
  }, [step, triggerBurst])

  useEffect(() => {
    if (step !== 'done') return
    doneTimerRef.current = setTimeout(() => {
      completeCalibration()
    }, 2000)
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    }
  }, [step, completeCalibration])

  const blinkMode = step === 'double' ? 'double' : 'single'
  const detectorEnabled = step === 'single' || step === 'double'

  return (
    <div className="calibration-screen" ref={calibrationRootRef}>
      <div className="calibration-screen__pixel-wrap" aria-hidden>
        <PixelBlast
          variant="square"
          pixelSize={6}
          color="#FFD200"
          patternScale={3}
          patternDensity={0}
          pixelSizeJitter={1.2}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={2.5}
          edgeFade={0}
          transparent
          burstCount={burstCount}
          burstCenterTargetRef={calibrationRootRef}
        />
      </div>

      <header className="calibration-screen__header">
        <button type="button" className="calibration-screen__back" onClick={backFromCalibration}>
          ← 返回
        </button>
        <div className="calibration-screen__title-block">
          <h1 className="calibration-screen__title">眨眼校准</h1>
          <span className="calibration-screen__title-en">Blink Calibration</span>
        </div>
        <span className="calibration-screen__header-spacer" />
      </header>

      <div className="calibration-screen__body">
        <motion.div
          className="calibration-screen__camera-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <BlinkDetector
            blinkMode={blinkMode}
            enabled={detectorEnabled}
            showPreview
            previewWidth={480}
            previewHeight={360}
            onBlink={onSingleBlink}
            onDoubleBlink={onDoubleBlinkComplete}
            pipPreview={{
              className: 'calibration-screen__pip',
              width: 220,
              height: 165,
              showLandmarks: false,
            }}
          />
        </motion.div>

        <motion.div
          className="calibration-screen__task"
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          {step === 'single' && (
            <>
              <span className="calibration-screen__task-step">步骤 1 / 2</span>
              <h2 className="calibration-screen__task-title">请单眨眼一次</h2>
              <p className="calibration-screen__task-desc">自然眨一下眼睛，确认系统能识别单次眨眼。</p>
            </>
          )}
          {step === 'double' && (
            <>
              <span className="calibration-screen__task-step">步骤 2 / 2</span>
              <h2 className="calibration-screen__task-title">请双眨眼一次</h2>
              <p className="calibration-screen__task-desc">在约 0.7 秒内连续眨眼两次，完成双眨眼校准。</p>
            </>
          )}
          {step === 'done' && (
            <>
              <span className="calibration-screen__task-step">完成</span>
              <h2 className="calibration-screen__task-title">校准成功</h2>
              <p className="calibration-screen__task-desc">即将返回开始界面…</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
