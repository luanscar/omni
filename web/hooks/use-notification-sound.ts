import { useCallback } from 'react'

/**
 * Hook para tocar som de notificação quando chegar nova mensagem
 * Cria um som estilo WhatsApp usando Web Audio API
 */
export function useNotificationSound() {
    const playSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

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
    }, [])

    return { playSound }
}
