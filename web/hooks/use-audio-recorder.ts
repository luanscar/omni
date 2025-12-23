import { useState, useRef, useCallback } from 'react'

export interface AudioRecorderState {
    isRecording: boolean
    recordingTime: number
    audioBlob: Blob | null
}

export function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('Não foi possível acessar o microfone.')
        }
    }, [])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [isRecording])

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setAudioBlob(null)
            chunksRef.current = [] // Discard chunks

            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        } else {
            setAudioBlob(null)
        }
        setRecordingTime(0)
    }, [isRecording])

    const resetRecording = useCallback(() => {
        setAudioBlob(null)
        setRecordingTime(0)
    }, [])

    return {
        isRecording,
        recordingTime,
        audioBlob,
        startRecording,
        stopRecording,
        cancelRecording,
        resetRecording
    }
}
