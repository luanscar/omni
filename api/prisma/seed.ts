import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
    console.log('Iniciando seed...');

    const tenantId = uuidv4();
    const tenant = await prisma.tenants.upsert({
        where: { slug: 'master' },
        update: {},
        create: {
            id: tenantId,
            name: 'Omni Master',
            slug: 'master',
            updatedAt: new Date(),
        },
    });

    console.log(`Inquilino criado/encontrado: ${tenant.name}`);

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar Usuário Administrador
    const user = await prisma.users.upsert({
        where: { email: 'admin@omni.com' },
        update: {},
        create: {
            id: uuidv4(),
            name: 'Administrador Master',
            email: 'admin@omni.com',
            password: hashedPassword,
            role: 'ADMIN',
            tenantId: tenant.id,
            updatedAt: new Date(),
        },
    });

    console.log(`Usuário administrador criado: ${user.email}`);
    console.log('Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error('Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
