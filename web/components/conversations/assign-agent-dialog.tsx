'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUsers } from '@/lib/api/modules/users'
import { useUpdateConversation } from '@/lib/api/modules/conversations/mutations'
import { Loader2, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignAgentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    conversationId: string
    currentAssigneeId?: string | null
}

export function AssignAgentDialog({
    open,
    onOpenChange,
    conversationId,
    currentAssigneeId,
}: AssignAgentDialogProps) {
    const { data: users, isLoading } = useUsers()
    const { mutate: updateConversation, isPending } = useUpdateConversation()
    const [selectedUserId, setSelectedUserId] = useState<string | null>(currentAssigneeId || null)

    const handleAssign = () => {
        if (!selectedUserId) return

        updateConversation(
            {
                id: conversationId,
                data: { assigneeId: selectedUserId },
            },
            {
                onSuccess: () => {
                    onOpenChange(false)
                },
            }
        )
    }

    const handleUnassign = () => {
        updateConversation(
            {
                id: conversationId,
                data: { assigneeId: null },
            },
            {
                onSuccess: () => {
                    setSelectedUserId(null)
                    onOpenChange(false)
                },
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Atribuir agente</DialogTitle>
                    <DialogDescription>
                        Selecione um agente para atribuir a esta conversa
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-1 max-h-[300px] overflow-y-auto overflow-x-hidden py-1 px-1">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {users?.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            className={cn(
                                "flex items-center gap-2.5 w-full p-2 rounded-md transition-colors hover:bg-accent",
                                selectedUserId === user.id && "bg-primary/10 ring-1 ring-primary"
                            )}
                        >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={user.avatarUrl || ''} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {user.name?.slice(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-medium text-sm truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                            {selectedUserId === user.id && (
                                <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                    {currentAssigneeId && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUnassign}
                            disabled={isPending}
                        >
                            Remover
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={handleAssign}
                        disabled={!selectedUserId || isPending}
                    >
                        {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                        Atribuir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
