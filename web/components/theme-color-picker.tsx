'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { converter } from 'culori'

interface ThemeColorPickerProps {
  label: string
  value?: string
  onChange: (value: string) => void
  description?: string
}

// Função para converter hex para OKLCH usando culori
function hexToOklch(hex: string): string {
  if (!hex || !hex.startsWith('#')) return hex
  
  try {
    const toOklch = converter('oklch')
    const color = toOklch(hex)
    
    if (color && typeof color.l === 'number') {
      return `oklch(${color.l.toFixed(3)} ${color.c?.toFixed(3) || 0} ${color.h?.toFixed(3) || 0})`
    }
  } catch (e) {
    console.error('Error converting hex to OKLCH:', e)
  }
  
  return hex
}

// Função para converter OKLCH para hex
function oklchToHex(oklch: string): string {
  if (!oklch) return '#000000'
  
  // Se já for hex, retornar
  if (oklch.startsWith('#')) {
    return oklch.length === 7 ? oklch : '#000000'
  }
  
  try {
    const toHex = converter('hex')
    const color = toHex(oklch)
    return color || '#000000'
  } catch {
    return '#000000'
  }
}

export function ThemeColorPicker({ label, value = '', onChange, description }: ThemeColorPickerProps) {
  // Converter OKLCH para hex para exibição
  const hexValue = useMemo(() => {
    if (!value) return '#000000'
    try {
      return oklchToHex(value)
    } catch {
      return value.startsWith('#') ? value : '#000000'
    }
  }, [value])
  
  const [open, setOpen] = useState(false)
  const [tempHex, setTempHex] = useState<string | null>(null)

  // Usar tempHex durante edição, senão usar hexValue calculado
  const displayHex = tempHex || hexValue

  const handleHexChange = (hex: string) => {
    // Converter hex para OKLCH automaticamente quando válido
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setTempHex(null) // Limpar temp quando válido
      const oklch = hexToOklch(hex)
      onChange(oklch)
    } else {
      // Durante digitação, manter temp
      setTempHex(hex)
    }
  }

  const handleColorInputChange = (hex: string) => {
    handleHexChange(hex)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`color-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-16 p-1 border-2"
              style={{ backgroundColor: displayHex }}
            >
              <span className="sr-only">Selecionar cor</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Selecione uma cor</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={displayHex}
                    onChange={(e) => handleColorInputChange(e.target.value)}
                    className="h-12 w-full rounded border-2 border-input cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Código:</Label>
                  <Input
                    type="text"
                    value={displayHex}
                    onChange={(e) => {
                      let hex = e.target.value
                      if (!hex.startsWith('#')) {
                        hex = `#${hex}`
                      }
                      if (hex.length <= 7) {
                        handleHexChange(hex)
                      }
                    }}
                    placeholder="#000000"
                    className="w-24 font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1 flex items-center gap-2">
          <div
            className="h-10 w-16 rounded-md border-2 border-input flex-shrink-0"
            style={{ backgroundColor: displayHex }}
            title={`Preview da cor ${label}`}
          />
          <div className="flex-1 text-xs text-muted-foreground truncate font-mono">
            {value || 'Nenhuma cor selecionada'}
          </div>
        </div>
      </div>
    </div>
  )
}
