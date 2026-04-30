import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import './ProfileScreen.css'

export function ProfileScreen() {
  const {
    profileNickname,
    setProfileNickname,
    backFromProfile,
    goToCalibration,
    goToBestiary,
  } = useGameStore()
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(profileNickname)
  const [contactOpen, setContactOpen] = useState(false)

  const saveName = () => {
    const trimmed = draftName.trim() || '自然观察者'
    setProfileNickname(trimmed)
    setDraftName(trimmed)
    setEditing(false)
  }

  return (
    <div className="profile-screen">
      <header className="profile-screen__header">
        <button type="button" className="profile-screen__back" onClick={backFromProfile}>
          ← 返回
        </button>
        <div className="profile-screen__brand">
          <span className="profile-screen__brand-icon">👤</span>
          <div>
            <span className="profile-screen__brand-zh">个人主页</span>
            <span className="profile-screen__brand-en">PROFILE</span>
          </div>
        </div>
        <span className="profile-screen__header-spacer" />
      </header>

      <div className="profile-screen__main">
        <motion.section
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="profile-card__avatar" aria-hidden>
            <span className="profile-card__avatar-placeholder">🦉</span>
          </div>
          {editing ? (
            <div className="profile-card__edit">
              <input
                className="profile-card__input"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={24}
                autoFocus
                aria-label="昵称"
              />
              <div className="profile-card__edit-actions">
                <button type="button" className="profile-card__btn" onClick={saveName}>
                  保存
                </button>
                <button
                  type="button"
                  className="profile-card__btn profile-card__btn--ghost"
                  onClick={() => {
                    setDraftName(profileNickname)
                    setEditing(false)
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="profile-card__name-btn"
              onClick={() => {
                setDraftName(profileNickname)
                setEditing(true)
              }}
            >
              <span className="profile-card__name">{profileNickname}</span>
              <span className="profile-card__hint">点击编辑昵称</span>
            </button>
          )}
        </motion.section>

        <motion.div
          className="profile-actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <button type="button" className="profile-action" onClick={() => goToCalibration('profile')}>
            <span className="profile-action__icon">👁</span>
            <span className="profile-action__text">
              <span className="profile-action__title">眨眼校准</span>
              <span className="profile-action__sub">调整单次 / 双次眨眼识别</span>
            </span>
          </button>
          <button type="button" className="profile-action" onClick={goToBestiary}>
            <span className="profile-action__icon">🐾</span>
            <span className="profile-action__text">
              <span className="profile-action__title">珍稀图鉴</span>
              <span className="profile-action__sub">查看已收集的物种</span>
            </span>
          </button>
          <button type="button" className="profile-action" onClick={() => setContactOpen(true)}>
            <span className="profile-action__icon">✉️</span>
            <span className="profile-action__text">
              <span className="profile-action__title">联系我们</span>
              <span className="profile-action__sub">反馈与商务合作</span>
            </span>
          </button>
        </motion.div>

        <p className="profile-screen__footer">地球耳语·Blink Nature v1.0</p>
      </div>

      <AnimatePresence>
        {contactOpen && (
          <motion.div
            className="profile-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setContactOpen(false)}
            role="presentation"
          >
            <motion.div
              className="profile-modal"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="contact-title"
            >
              <h2 id="contact-title" className="profile-modal__title">
                联系我们
              </h2>
              <p className="profile-modal__body">
                如有建议、合作或技术支持需求，欢迎通过邮件与我们联系：
              </p>
              <p className="profile-modal__email">hello@blink-nature.example</p>
              <p className="profile-modal__note">（真的会有人联系我们吗？）</p>
              <button type="button" className="profile-modal__close" onClick={() => setContactOpen(false)}>
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
