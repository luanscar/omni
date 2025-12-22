'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getToken } from './use-auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Singleton para manter uma única conexão socket.io
let socketInstance: Socket | null = null
let connectionCount = 0
const connectionListeners = new Set<(connected: boolean) => void>()

function updateAllListeners(connected: boolean) {
  connectionListeners.forEach((listener) => listener(connected))
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const token = getToken()
    
    if (!token) {
      console.warn('Socket.io: Token não encontrado, não conectando')
      return
    }

    // Listener para atualizar estado quando conexão mudar
    const connectionListener = (connected: boolean) => {
      setIsConnected(connected)
    }
    connectionListeners.add(connectionListener)

    // Reutilizar conexão existente se disponível
    if (socketInstance) {
      setSocket(socketInstance)
      setIsConnected(socketInstance.connected)
      connectionCount++
      return () => {
        connectionCount--
        connectionListeners.delete(connectionListener)
        if (connectionCount <= 0 && socketInstance) {
          socketInstance.disconnect()
          socketInstance = null
          connectionCount = 0
          updateAllListeners(false)
        }
      }
    }

    // Criar nova conexão socket.io
    socketInstance = io(API_URL, {
      query: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('Socket.io: Conectado', socketInstance?.id)
      updateAllListeners(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket.io: Desconectado', reason)
      updateAllListeners(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io: Erro de conexão', error)
      updateAllListeners(false)
    })

    setSocket(socketInstance)
    connectionCount++

    // Cleanup
    return () => {
      connectionCount--
      connectionListeners.delete(connectionListener)
      if (connectionCount <= 0 && socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
        connectionCount = 0
        updateAllListeners(false)
      }
    }
  }, [])

  return {
    socket,
    isConnected,
  }
}

/**
 * Hook para escutar eventos específicos do socket.io
 */
export function useSocketEvent<T = unknown>(
  event: string,
  callback: (data: T) => void,
  enabled: boolean = true
) {
  const { socket, isConnected } = useSocket()
  const callbackRef = useRef(callback)

  // Atualizar callback ref quando mudar
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!socket || !isConnected || !enabled) {
      return
    }

    const handler = (data: T) => {
      callbackRef.current(data)
    }

    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [socket, isConnected, event, enabled])
}

