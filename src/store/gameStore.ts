import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import animalsData from '../data/animalsData'

export type GamePhase =
  | 'start'          // 游戏开始界面
  | 'calibration'    // 眨眼校准
  | 'profile'        // 个人主页
  | 'scene-select'   // 选择场景
  | 'eyes-closed'    // 等待用户闭眼
  | 'animal-appears' // 动物出现，等待睁眼确认
  | 'blink-capture'  // 等待眨眼抓拍
  | 'card-reveal'    // 展示科普卡片
  | 'bestiary'       // 图鉴总览
  | 'species-detail' // 物种详情（SPECIES ATLAS）

export interface AnimalRecord {
  animalId: string
  captureCount: number      // 总抓拍次数
  unlockedTriviaCount: number // 已解锁小知识数 (0-3)
}

export interface BestiaryState {
  [animalId: string]: AnimalRecord
}

export type CalibrationBackTarget = 'start' | 'profile'

/** 进入图鉴总览前的界面，用于「返回」恢复 */
export type BestiaryBackPhase = Exclude<GamePhase, 'bestiary' | 'species-detail'>

/** 进入个人主页前的界面，用于「返回」恢复（通常为主玩法各阶段） */
export type ProfileBackPhase = Exclude<GamePhase, 'profile'>

interface GameState {
  // 当前游戏状态
  phase: GamePhase
  currentSceneId: string | null
  currentAnimalId: string | null
  detailAnimalId: string | null  // SPECIES ATLAS 详情页查看的动物
  calibrationBackTarget: CalibrationBackTarget
  bestiaryBackPhase: BestiaryBackPhase
  profileBackPhase: ProfileBackPhase

  // 个人资料（持久化）
  profileNickname: string

  // 图鉴（持久化）
  bestiary: BestiaryState

  // Actions
  setPhase: (phase: GamePhase) => void
  selectScene: (sceneId: string) => void
  spawnAnimal: (animalId: string) => void
  captureAnimal: () => AnimalRecord
  continueInScene: () => void
  goToBestiary: () => void
  backFromBestiary: () => void
  goToSpeciesDetail: (animalId: string) => void
  goToSceneSelect: () => void
  /** 从开始界面进入主玩法（当前场景闭眼阶段），跳过场景网格页 */
  enterGame: () => void
  goToStart: () => void
  goToCalibration: (backTarget?: CalibrationBackTarget) => void
  backFromCalibration: () => void
  completeCalibration: () => void
  goToProfile: () => void
  backFromProfile: () => void
  setProfileNickname: (name: string) => void
  resetCurrentAnimal: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'start',
      currentSceneId: 'arctic',
      currentAnimalId: null,
      detailAnimalId: null,
      calibrationBackTarget: 'start',
      bestiaryBackPhase: 'eyes-closed',
      profileBackPhase: 'eyes-closed',
      profileNickname: '自然观察者',
      bestiary: {},

      setPhase: (phase) => set({ phase }),

      selectScene: (sceneId) =>
        set({ currentSceneId: sceneId, phase: 'eyes-closed' }),

      spawnAnimal: (animalId) =>
        set({ currentAnimalId: animalId, phase: 'animal-appears' }),

      captureAnimal: () => {
        const { currentAnimalId, bestiary } = get()
        if (!currentAnimalId) throw new Error('No animal to capture')

        const existing = bestiary[currentAnimalId]
        const captureCount = (existing?.captureCount ?? 0) + 1
        // 第1次抓拍解锁基础卡，第2~4次各解锁一条小知识
        const unlockedTriviaCount = Math.min(captureCount - 1, 3)

        const updated: AnimalRecord = { animalId: currentAnimalId, captureCount, unlockedTriviaCount }

        set({
          bestiary: { ...bestiary, [currentAnimalId]: updated },
          phase: 'card-reveal',
        })

        return updated
      },

      continueInScene: () =>
        set({ phase: 'eyes-closed', currentAnimalId: null }),

      goToBestiary: () => {
        const s = get()
        // 从物种详情返回图鉴列表：不覆盖 bestiaryBackPhase
        if (s.phase === 'species-detail') {
          set({ phase: 'bestiary', detailAnimalId: null })
          return
        }
        if (s.phase === 'bestiary') return
        set({
          phase: 'bestiary',
          detailAnimalId: null,
          bestiaryBackPhase: s.phase as BestiaryBackPhase,
        })
      },

      backFromBestiary: () => {
        const { bestiaryBackPhase } = get()
        set({ phase: bestiaryBackPhase, detailAnimalId: null })
      },

      goToSpeciesDetail: (animalId) => set({ phase: 'species-detail', detailAnimalId: animalId }),

      goToSceneSelect: () =>
        set({ phase: 'scene-select', currentAnimalId: null }),

      enterGame: () => set({ phase: 'eyes-closed', currentAnimalId: null }),

      goToStart: () => set({ phase: 'start', currentAnimalId: null }),

      goToCalibration: (backTarget = 'start') =>
        set({ phase: 'calibration', calibrationBackTarget: backTarget }),

      backFromCalibration: () =>
        set({ phase: get().calibrationBackTarget }),

      completeCalibration: () => set({ phase: 'start' }),

      goToProfile: () => {
        const s = get()
        if (s.phase === 'profile') return
        set({
          phase: 'profile',
          profileBackPhase: s.phase as ProfileBackPhase,
        })
      },

      backFromProfile: () => {
        const { profileBackPhase } = get()
        set({ phase: profileBackPhase })
      },

      setProfileNickname: (name) => set({ profileNickname: name }),

      resetCurrentAnimal: () => set({ currentAnimalId: null }),
    }),
    {
      name: 'blink-nature-game-bestiary',
      // 只持久化图鉴数据，游戏状态每次重启从头开始
      partialize: (state) => ({
        bestiary: state.bestiary,
        profileNickname: state.profileNickname,
      }),
    }
  )
)

// 类型工具：从 JSON 数据中获取动物信息
export type AnimalData = (typeof animalsData.animals)[keyof typeof animalsData.animals]
export type SceneData = (typeof animalsData.scenes)[number]
