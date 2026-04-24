import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const DEFAULT_COLUMNS = [
  { name: 'Backlog', order: 0 },
  { name: 'Em andamento', order: 1 },
  { name: 'Revisão', order: 2 },
  { name: 'Concluído', order: 3 },
];

async function seed() {
  console.log('Limpando schema flowdesk...');
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Ana Silva',
      email: 'admin@flowdesk.com',
      password: passwordHash,
      role: 'admin',
    },
  });
  const manager = await prisma.user.create({
    data: {
      name: 'Bruno Costa',
      email: 'manager@flowdesk.com',
      password: passwordHash,
      role: 'manager',
    },
  });
  const member = await prisma.user.create({
    data: {
      name: 'Carla Souza',
      email: 'member@flowdesk.com',
      password: passwordHash,
      role: 'member',
    },
  });
  console.log('✓ 3 usuários criados (admin, manager, member)');

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Studio',
      description: 'Workspace de exemplo com projetos ativos.',
      ownerId: admin.id,
      members: {
        createMany: {
          data: [
            { userId: admin.id, role: 'owner' },
            { userId: manager.id, role: 'manager' },
            { userId: member.id, role: 'member' },
          ],
        },
      },
    },
  });

  const secondWorkspace = await prisma.workspace.create({
    data: {
      name: 'Side Projects',
      description: 'Espaço para experimentos pessoais.',
      ownerId: manager.id,
      members: {
        createMany: {
          data: [
            { userId: manager.id, role: 'owner' },
            { userId: admin.id, role: 'admin' },
          ],
        },
      },
    },
  });
  console.log('✓ 2 workspaces criados');

  const projectA = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Lançamento App v2',
      description: 'Refatoração completa da plataforma para a versão 2.0.',
      status: 'active',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      columns: { create: DEFAULT_COLUMNS },
    },
    include: { columns: true },
  });

  const projectB = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Marketing Q2',
      description: 'Campanhas e materiais para o trimestre.',
      status: 'active',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      columns: { create: DEFAULT_COLUMNS },
    },
    include: { columns: true },
  });

  await prisma.project.create({
    data: {
      workspaceId: secondWorkspace.id,
      name: 'Blog pessoal',
      description: 'Migração para Next.js.',
      status: 'paused',
      columns: { create: DEFAULT_COLUMNS },
    },
  });
  console.log('✓ 3 projetos criados');

  // Tasks for project A
  const colsA = projectA.columns.sort((a, b) => a.order - b.order);
  const tasksA: Array<{
    columnIdx: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo: string | null;
  }> = [
    {
      columnIdx: 0,
      title: 'Auditar fluxo de checkout',
      description: 'Mapear todos os pontos de fricção no checkout atual.',
      priority: 'high',
      assignedTo: manager.id,
    },
    {
      columnIdx: 0,
      title: 'Pesquisar bibliotecas de gráficos',
      description: 'Comparar Recharts, Chart.js e Visx.',
      priority: 'low',
      assignedTo: member.id,
    },
    {
      columnIdx: 1,
      title: 'Implementar dashboard novo',
      description: 'Layout do dashboard com cards de métricas e gráfico semanal.',
      priority: 'high',
      assignedTo: member.id,
    },
    {
      columnIdx: 1,
      title: 'Reescrever fluxo de auth',
      description: 'JWT com refresh token rotation.',
      priority: 'urgent',
      assignedTo: admin.id,
    },
    {
      columnIdx: 2,
      title: 'Code review do módulo de pagamento',
      description: 'PR #142 aguardando revisão.',
      priority: 'medium',
      assignedTo: manager.id,
    },
    {
      columnIdx: 3,
      title: 'Setup do projeto e CI',
      description: 'Pipeline de testes e build automatizado.',
      priority: 'medium',
      assignedTo: admin.id,
    },
  ];

  for (let i = 0; i < tasksA.length; i++) {
    const t = tasksA[i];
    await prisma.task.create({
      data: {
        columnId: colsA[t.columnIdx].id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        assignedTo: t.assignedTo,
        createdBy: admin.id,
        position: i,
      },
    });
  }

  // Tasks for project B
  const colsB = projectB.columns.sort((a, b) => a.order - b.order);
  const tasksB = [
    { columnIdx: 0, title: 'Brainstorm de campanha', priority: 'medium' as const, assignedTo: manager.id },
    { columnIdx: 1, title: 'Produção de criativos', priority: 'medium' as const, assignedTo: member.id },
    { columnIdx: 1, title: 'Roteiro do vídeo', priority: 'high' as const, assignedTo: manager.id },
    { columnIdx: 3, title: 'Briefing aprovado', priority: 'low' as const, assignedTo: admin.id },
  ];

  for (let i = 0; i < tasksB.length; i++) {
    const t = tasksB[i];
    await prisma.task.create({
      data: {
        columnId: colsB[t.columnIdx].id,
        title: t.title,
        description: 'Tarefa de exemplo do projeto Marketing.',
        priority: t.priority,
        assignedTo: t.assignedTo,
        createdBy: manager.id,
        position: i,
      },
    });
  }
  console.log('✓ tarefas criadas em todos os projetos');

  // Comments
  const firstTask = await prisma.task.findFirst({ where: { title: 'Implementar dashboard novo' } });
  if (firstTask) {
    await prisma.comment.createMany({
      data: [
        { taskId: firstTask.id, userId: manager.id, content: 'Comecei o layout, depois mando print.' },
        { taskId: firstTask.id, userId: admin.id, content: 'Show, qualquer coisa me avisa.' },
      ],
    });
  }

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        type: 'task_assigned',
        content: 'Você foi atribuído à tarefa "Implementar dashboard novo"',
        link: `/projects/${projectA.id}`,
      },
      {
        userId: member.id,
        type: 'workspace_invite',
        content: 'Bem-vindo ao workspace "Acme Studio"',
        link: `/workspaces/${workspace.id}`,
      },
    ],
  });
  console.log('✓ comentários e notificações criados');

  await prisma.$disconnect();
  console.log('\nSeed concluído!');
  console.log('\nUsuários de teste:');
  console.log('  Admin:    admin@flowdesk.com   / 123456');
  console.log('  Manager:  manager@flowdesk.com / 123456');
  console.log('  Member:   member@flowdesk.com  / 123456');
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
