import { SetMetadata } from '@nestjs/common';

export type PlanLimitResource = 'channels' | 'users' | 'conversations';

export const PLAN_LIMIT_KEY = 'plan_limit';

/**
 * Decorator para validar limites do plano
 * @param resource - Tipo de recurso a validar ('channels', 'users', 'conversations')
 * @example
 * ```typescript
 * @Post()
 * @CheckPlanLimit('channels')
 * create() {
 *   // Automaticamente valida se o tenant não excedeu o limite de canais
 * }
 * ```
 */
export const CheckPlanLimit = (resource: PlanLimitResource) =>
  SetMetadata(PLAN_LIMIT_KEY, resource);
