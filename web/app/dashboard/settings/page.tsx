'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useMyTenant, useUpdateTenant } from '@/lib/api/modules/tenants'
import { Loader2, Save, MessageSquare, Users, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { themePresets, getDefaultThemePreset } from '@/lib/themes'
import type { TenantSettings } from '@/lib/api/modules/tenants/types'

export default function SettingsPage() {
    const { data: tenant, isLoading: isLoadingTenant } = useMyTenant()
    const { mutate: updateTenant, isPending: isSaving } = useUpdateTenant()

    // Valor atual do tenant
    const currentChatMode = useMemo(() => tenant?.settings?.chatMode || 'ATTENDANCE', [tenant?.settings?.chatMode])
    const currentThemePresetId = useMemo(() => tenant?.settings?.themePresetId || 'default', [tenant?.settings?.themePresetId])

    const [chatMode, setChatMode] = useState<'ATTENDANCE' | 'SIMPLE'>(currentChatMode)
    const [themePresetId, setThemePresetId] = useState<string>(currentThemePresetId)

    // Sincronizar estados quando tenant mudar
    useEffect(() => {
        setChatMode(currentChatMode)
    }, [currentChatMode])

    useEffect(() => {
        setThemePresetId(currentThemePresetId)
    }, [currentThemePresetId])

    // Calcular se há mudanças
    const hasChatModeChanges = chatMode !== currentChatMode
    const hasThemeChanges = themePresetId !== currentThemePresetId
    const hasChanges = hasChatModeChanges || hasThemeChanges

    const handleSave = () => {
        if (!tenant?.id) {
            toast.error('Erro ao salvar: Tenant não encontrado')
            return
        }

        const newSettings: TenantSettings = {
            ...tenant.settings,
            chatMode,
            themePresetId: themePresetId === 'default' ? undefined : themePresetId,
        }

        updateTenant(
            {
                id: tenant.id,
                data: { settings: newSettings },
            },
            {
                onSuccess: () => {
                    toast.success('Configurações salvas com sucesso!')
                },
                onError: (error: unknown) => {
                    const errorMessage =
                        error instanceof Error ? error.message : 'Erro ao salvar configurações'
                    toast.error(errorMessage)
                },
            }
        )
    }

    if (isLoadingTenant || !tenant) {
        return (
            <>
                <Header />
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto max-w-2xl">
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const selectedTheme = themePresets.find(p => p.id === themePresetId) || getDefaultThemePreset()

    return (
        <>
            <Header />
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="mx-auto max-w-2xl">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-2xl font-semibold tracking-tight mb-2">Configurações</h1>
                        <p className="text-sm text-muted-foreground">
                            Personalize o comportamento e aparência do sistema
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Modo de Chat */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="chatMode" className="text-base font-medium">
                                        Modo de operação
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Como o sistema de chat funciona
                                    </p>
                                </div>
                                <Select value={chatMode} onValueChange={(value) => setChatMode(value as 'ATTENDANCE' | 'SIMPLE')}>
                                    <SelectTrigger id="chatMode" className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ATTENDANCE">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                <span>Atendimento</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="SIMPLE">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>Chat Simples</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                {chatMode === 'ATTENDANCE' ? (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Modo Atendimento</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    Sistema completo com controle de status, atribuição de agentes e gestão de conversas.
                                                    Ideal para equipes que precisam de organização e rastreamento de atendimentos.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Modo Chat Simples</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    Chat direto sem controle de status ou atribuições.
                                                    Perfeito para comunicação informal e conversas sempre ativas.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Personalização de Tema */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-primary" />
                                        <Label className="text-base font-medium">Tema</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Escolha um tema pré-definido para personalizar a aparência
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="themePreset" className="text-sm font-medium">
                                        Tema de cores
                                    </Label>
                                    <Select value={themePresetId} onValueChange={setThemePresetId}>
                                        <SelectTrigger id="themePreset" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {themePresets.map((preset) => (
                                                <SelectItem key={preset.id} value={preset.id}>
                                                    {preset.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Preview do tema selecionado */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Preview</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <div
                                                className="h-12 rounded-md border"
                                                style={{ backgroundColor: selectedTheme.light.primary }}
                                            />
                                            <p className="text-xs text-muted-foreground text-center">Primary</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div
                                                className="h-12 rounded-md border"
                                                style={{ backgroundColor: selectedTheme.light.secondary }}
                                            />
                                            <p className="text-xs text-muted-foreground text-center">Secondary</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div
                                                className="h-12 rounded-md border"
                                                style={{ backgroundColor: selectedTheme.light.accent }}
                                            />
                                            <p className="text-xs text-muted-foreground text-center">Accent</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Informações do Tenant */}
                        <div className="space-y-4">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Organização</Label>
                                <p className="text-sm text-muted-foreground">
                                    Dados da sua empresa
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-muted-foreground">Nome</span>
                                    <span className="text-sm font-medium">{tenant.name}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-muted-foreground">Identificador</span>
                                    <span className="text-sm font-mono text-muted-foreground">{tenant.slug}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Salvar */}
                    {hasChanges && (
                        <div className="fixed bottom-6 right-6 md:right-8 z-50">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="shadow-lg"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
