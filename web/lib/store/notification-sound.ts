import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface NotificationSoundState {
  activeConversationId: string | null
  isSoundEnabled: boolean
  lastPlayedAt: number
  setActiveConversationId: (conversationId: string | null) => void
  playSound: (conversationId: string) => void
  setSoundEnabled: (enabled: boolean) => void
}

// Função para criar e tocar o som
function createAndPlaySound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()

    // Função para criar um beep
    const createBeep = (startTime: number, frequency: number, duration: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      // Envelope para suavizar o som
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01) // Attack (volume reduzido)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration) // Decay

      oscillator.start(startTime)
      oscillator.stop(startTime + duration)

      return oscillator
    }

    // Criar dois beeps estilo WhatsApp
    const now = audioContext.currentTime
    createBeep(now, 800, 0.15) // Primeiro beep
    createBeep(now + 0.15, 600, 0.15) // Segundo beep (tom mais grave)
  } catch (error) {
    console.warn('Erro ao tocar som de notificação:', error)
  }
}

export const useNotificationSoundStore = create<NotificationSoundState>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        activeConversationId: null,
        isSoundEnabled: true,
        lastPlayedAt: 0,

        setActiveConversationId: (conversationId: string | null) => {
          set((state) => {
            state.activeConversationId = conversationId
          })
        },

        playSound: (conversationId: string) => {
          set((state) => {
            // Não tocar se o som estiver desabilitado
            if (!state.isSoundEnabled) return

            // Não tocar se for a conversa ativa
            if (state.activeConversationId === conversationId) return

            // Throttle: não tocar se tocou há menos de 500ms
            const now = Date.now()
            if (now - state.lastPlayedAt < 500) return

            // Tocar o som
            createAndPlaySound()
            state.lastPlayedAt = now
          })
        },

        setSoundEnabled: (enabled: boolean) => {
          set((state) => {
            state.isSoundEnabled = enabled
          })
        },
      }))
    ),
    { name: 'NotificationSoundStore' }
  )
)
