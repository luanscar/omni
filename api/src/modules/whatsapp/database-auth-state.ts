import {
  AuthenticationState,
  initAuthCreds,
  BufferJSON,
} from '@whiskeysockets/baileys';
import { PrismaService } from '../../prisma.service';
import { Logger } from '@nestjs/common';

/**
 * Adapter customizado para armazenar dados de autenticação do Baileys no banco de dados
 * ao invés de arquivos locais. Mantém compatibilidade com a API do useMultiFileAuthState.
 */
export async function useDatabaseAuthState(
  channelId: string,
  prisma: PrismaService,
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const logger = new Logger('DatabaseAuthState');

  // Buscar dados existentes no banco de dados
  const existingSession = await prisma.whatsappSession.findUnique({
    where: { channelId },
  });

  let creds: AuthenticationState['creds'];
  let keys: any = {};

  if (existingSession && existingSession.sessionData) {
    // Carregar credenciais existentes do banco de dados
    const sessionData = existingSession.sessionData as any;

    // Deserializar usando BufferJSON para restaurar os Buffers corretamente
    creds = JSON.parse(JSON.stringify(sessionData.creds), BufferJSON.reviver);
    keys = JSON.parse(
      JSON.stringify(sessionData.keys || {}),
      BufferJSON.reviver,
    );

    logger.log(
      `Credenciais carregadas do banco de dados para canal ${channelId}`,
    );
  } else {
    // Inicializar novas credenciais
    creds = initAuthCreds();
    logger.log(`Novas credenciais inicializadas para canal ${channelId}`);
  }

  /**
   * Função para salvar as credenciais no banco de dados
   */
  const saveCreds = async () => {
    try {
      // Serializar usando BufferJSON para salvar os Buffers corretamente como JSON
      const sessionData = {
        creds: JSON.parse(JSON.stringify(creds, BufferJSON.replacer)),
        keys: JSON.parse(JSON.stringify(keys, BufferJSON.replacer)),
      };

      await prisma.whatsappSession.upsert({
        where: { channelId },
        create: {
          channelId,
          sessionData: sessionData as any,
        },
        update: {
          sessionData: sessionData as any,
        },
      });

      logger.debug(
        `Credenciais salvas no banco de dados para canal ${channelId}`,
      );
    } catch (error) {
      logger.error(
        `Erro ao salvar credenciais para canal ${channelId}:`,
        error,
      );
      throw error;
    }
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type: string, ids: string[]) => {
        const data: any = {};
        for (const id of ids) {
          const key = `${type}-${id}`;
          if (keys[key]) {
            data[id] = keys[key];
          }
        }
        return data;
      },
      set: async (data: any) => {
        for (const category in data) {
          for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            if (value) {
              keys[key] = value;
            } else {
              delete keys[key];
            }
          }
        }
        // Salvar automaticamente quando as keys são atualizadas
        await saveCreds();
      },
    },
  };

  return {
    state,
    saveCreds,
  };
}
