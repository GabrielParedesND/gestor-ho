import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users with hashed passwords
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Usuario',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Manager Usuario',
      email: 'manager@example.com',
      password: await bcrypt.hash('Manager123!', 10),
      role: 'MANAGER',
    },
  });

  const devLeader = await prisma.user.create({
    data: {
      name: 'Dev Leader',
      email: 'dev@example.com',
      password: await bcrypt.hash('Dev123!', 10),
      role: 'LEADER_DEV',
    },
  });

  const poLeader = await prisma.user.create({
    data: {
      name: 'PO Leader',
      email: 'po@example.com',
      password: await bcrypt.hash('Po123!', 10),
      role: 'LEADER_PO',
    },
  });

  const member = await prisma.user.create({
    data: {
      name: 'Miembro Usuario',
      email: 'member@example.com',
      password: await bcrypt.hash('Member123!', 10),
      role: 'MEMBER',
    },
  });

  console.log('✅ Users created');

  // Create a team
  const team = await prisma.team.create({
    data: {
      name: 'Equipo Principal',
      description: 'Equipo principal de desarrollo',
    },
  });

  console.log('✅ Team created');

  console.log('✅ Users and team created - No default period created');

  // Create settings
  await prisma.setting.createMany({
    data: [
      {
        key: 'system_name',
        value: JSON.stringify('Sistema de Incentivo HO'),
        description: 'Nombre del sistema',
      },
      {
        key: 'voting_deadline_hour',
        value: JSON.stringify(17),
        description: 'Hora límite para votar (24h)',
      },
      {
        key: 'max_votes_per_candidate',
        value: JSON.stringify(4),
        description: 'Máximo de votos por candidato',
      },
      {
        key: 'grant_expiry_days',
        value: JSON.stringify(60),
        description: 'Días de expiración de grants',
      },
      {
        key: 'points_for_bonus_day',
        value: JSON.stringify(4),
        description: 'Puntos necesarios para día extra',
      },
    ],
  });

  console.log('✅ Settings created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });