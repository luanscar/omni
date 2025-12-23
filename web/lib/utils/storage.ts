const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Converte URLs relativas de storage para URLs absolutas
 * @param url URL relativa ou absoluta
 * @returns URL absoluta completa
 */
export function getStorageUrl(url: string | null | undefined): string {
    if (!url) return ''

    // Se já for uma URL completa, retorna como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }

    // Se for URL relativa, adiciona o base URL
    if (url.startsWith('/')) {
        return `${API_URL}${url}`
    }

    // Caso seja apenas o caminho sem barra inicial
    return `${API_URL}/${url}`
}

/**
 * Extrai o ID do storage de uma URL como /storage/{id}/download
 */
export function extractStorageId(url: string | null | undefined): string | null {
    if (!url) return null

    const match = url.match(/\/storage\/([^\/]+)\/download/)
    return match ? match[1] : null
}
