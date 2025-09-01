import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findFirst({
      where: { 
        email,
        active: true 
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña con bcrypt
    if (!user.password) {
      return res.status(401).json({ error: 'Usuario sin contraseña configurada' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    res.json({ user: { id: user.id, email: user.email }, profile: user });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Users routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;
    
    // Validar campos requeridos
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }
    
    // Hashear la contraseña con bcrypt
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'MEMBER',
        active: active !== undefined ? active : true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error('Error creando usuario:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El email ya está en uso' });
    } else {
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;
    
    const updateData: any = {
      name,
      email,
      role,
      active,
    };
    
    // Si se proporciona contraseña, hashearla e incluirla en la actualización
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(user);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El email ya está en uso' });
    } else {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json(user);
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

// Periods routes
app.get('/api/periods', async (req, res) => {
  try {
    const periods = await prisma.period.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(periods);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener períodos' });
  }
});

app.get('/api/periods/current', async (req, res) => {
  try {
    const period = await prisma.period.findFirst({
      where: {
        OR: [
          { status: 'OPEN' },
          { status: 'VOTING' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener período actual' });
  }
});

app.post('/api/periods', async (req, res) => {
  try {
    const { weekLabel, startDate, endDate } = req.body;
    
    const period = await prisma.period.create({
      data: {
        weekLabel,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'OPEN',
      },
    });
    
    // Ya no se crean candidatos automáticamente
    // Los candidatos se crearán cuando tengan 2+ nominaciones
    
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear período' });
  }
});

app.get('/api/periods/:periodId/results', async (req, res) => {
  try {
    const results = await prisma.tally.findMany({
      where: { periodId: req.params.periodId },
      include: {
        user: true,
        discardedVoter: true,
      },
      orderBy: { resultDays: 'desc' },
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
});

app.post('/api/periods/:periodId/close', async (req, res) => {
  try {
    const { periodId } = req.params;
    
    // Get all votes for this period
    const votes = await prisma.vote.findMany({
      where: { periodId },
      include: {
        voter: true,
        targetUser: true,
      },
    });

    // Get all candidates for this period
    const candidates = await prisma.candidate.findMany({
      where: { periodId },
      include: { user: true },
    });

    // Seleccionar un voto global al azar de líderes/manager para descartar
    const leaderManagerVotes = votes.filter(v => 
      ['MANAGER', 'LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA'].includes(v.voter?.role)
    );
    
    let globalDiscardedVoterId = null;
    if (leaderManagerVotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * leaderManagerVotes.length);
      globalDiscardedVoterId = leaderManagerVotes[randomIndex].voterId;
    }

    // Calculate results for each candidate
    const tallies = [];
    const grants = [];

    for (const candidate of candidates) {
      const userVotes = votes.filter(v => v.targetUserId === candidate.userId);
      const rawVotes = userVotes.length;
      
      // Filtrar votos excluyendo el voto globalmente descartado
      const finalVotes = userVotes.filter(v => v.voterId !== globalDiscardedVoterId);
      
      const countedVotes = finalVotes.length;
      const managerVote = finalVotes.find(v => v.voter?.role === 'MANAGER');
      
      // Lógica de días según el flujo requerido:
      // 2 votos → 1 día
      // 3+ votos sin manager → 2 días  
      // 3+ votos con manager → 3 días
      let resultDays = 0;
      if (countedVotes >= 3 && managerVote) {
        resultDays = 3; // 3+ votos incluyendo manager
      } else if (countedVotes >= 3) {
        resultDays = 2; // 3+ votos sin manager
      } else if (countedVotes >= 2) {
        resultDays = 1; // 2 votos
      }

      const tally = {
        periodId,
        userId: candidate.userId,
        rawVotes,
        countedVotes,
        discardedVoterId: globalDiscardedVoterId,
        managerIncluded: !!managerVote,
        resultDays,
        calculationSeed: `${periodId}-${candidate.userId}`,
      };

      tallies.push(tally);

      // Create individual home office grants (1 day each)
      if (resultDays > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60); // 60 days expiration

        // Crear un grant de 1 día por cada día ganado
        for (let i = 0; i < resultDays; i++) {
          grants.push({
            userId: candidate.userId,
            periodId,
            days: 1,
            source: 'NORMAL',
            expiresAt,
            redeemed: false,
          });
        }
      }
    }

    // Insert tallies and grants
    if (tallies.length > 0) {
      await prisma.tally.createMany({ data: tallies });
    }

    if (grants.length > 0) {
      await prisma.homeOfficeGrant.createMany({ data: grants });
    }

    // Close the period
    await prisma.period.update({
      where: { id: periodId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar período' });
  }
});

// Nominations routes
app.post('/api/nominations', async (req, res) => {
  try {
    const { periodId, nominatorId, nomineeId, reason, projectId, category, contributionType } = req.body;
    
    // Verificar que el nominador puede nominar (MANAGER, LEADER, ADMIN)
    const nominator = await prisma.user.findUnique({ where: { id: nominatorId } });
    if (!nominator || !['MANAGER', 'LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA', 'ADMIN'].includes(nominator.role)) {
      return res.status(403).json({ error: 'No tienes permisos para nominar' });
    }
    
    // Verificar que el nominado es un MEMBER activo
    const nominee = await prisma.user.findUnique({ where: { id: nomineeId } });
    if (!nominee || nominee.role !== 'MEMBER' || !nominee.active) {
      return res.status(400).json({ error: 'Solo se pueden nominar miembros activos' });
    }
    
    const nomination = await prisma.nomination.create({
      data: {
        periodId,
        nominatorId,
        nomineeId,
        reason,
        projectId: projectId || null,
        category: category || 'COLLABORATION',
        contributionType: contributionType || 'DELIVERY',
      },
      include: {
        nominator: true,
        nominee: true,
        project: true,
      },
    });
    
    // Crear candidato inmediatamente con 1 nominación
    await prisma.candidate.upsert({
      where: {
        userId_periodId: {
          userId: nomineeId,
          periodId,
        },
      },
      update: {},
      create: {
        userId: nomineeId,
        periodId,
        roleAtPeriod: nominee.role,
      },
    });
    
    res.json(nomination);
  } catch (error) {
    console.error('Error creating nomination:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya has nominado a este usuario para este período' });
    } else {
      res.status(500).json({ error: 'Error al crear nominación' });
    }
  }
});

app.get('/api/periods/:periodId/nominations', async (req, res) => {
  try {
    const nominations = await prisma.nomination.findMany({
      where: { periodId: req.params.periodId },
      include: {
        nominator: true,
        nominee: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(nominations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener nominaciones' });
  }
});

app.delete('/api/nominations/:id', async (req, res) => {
  try {
    const nomination = await prisma.nomination.findUnique({
      where: { id: req.params.id },
      include: { nominee: true },
    });
    
    if (!nomination) {
      return res.status(404).json({ error: 'Nominación no encontrada' });
    }
    
    await prisma.nomination.delete({
      where: { id: req.params.id },
    });
    
    // Verificar si el nominado aún tiene nominaciones
    const remainingNominations = await prisma.nomination.count({
      where: {
        periodId: nomination.periodId,
        nomineeId: nomination.nomineeId,
      },
    });
    
    // Si no tiene nominaciones, eliminar candidato
    if (remainingNominations === 0) {
      await prisma.candidate.deleteMany({
        where: {
          userId: nomination.nomineeId,
          periodId: nomination.periodId,
        },
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar nominación' });
  }
});

// Voting routes
app.get('/api/periods/:periodId/votes', async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { periodId: req.params.periodId },
      include: {
        voter: true,
        targetUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(votes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener votos' });
  }
});

app.get('/api/periods/:periodId/candidates', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { 
        periodId: req.params.periodId,
        user: { active: true }
      },
      include: { user: true },
    });
    
    // Obtener nominaciones para cada candidato
    const candidatesWithNominations = await Promise.all(
      candidates.map(async (candidate) => {
        const nominations = await prisma.nomination.findMany({
          where: {
            periodId: req.params.periodId,
            nomineeId: candidate.userId,
          },
          include: { 
            nominator: true,
            project: true,
          },
        });
        
        return {
          ...candidate.user,
          nominations,
        };
      })
    );
    
    res.json(candidatesWithNominations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener candidatos' });
  }
});

app.post('/api/votes', async (req, res) => {
  try {
    const { periodId, voterId, targetUserId, comment, remove } = req.body;
    
    if (remove) {
      await prisma.vote.deleteMany({
        where: {
          periodId,
          voterId,
          targetUserId,
        },
      });
      res.json({ success: true });
    } else {
      const vote = await prisma.vote.upsert({
        where: {
          periodId_voterId_targetUserId: {
            periodId,
            voterId,
            targetUserId,
          },
        },
        update: {
          comment,
          updatedAt: new Date(),
        },
        create: {
          periodId,
          voterId,
          targetUserId,
          weight: 1,
          comment,
        },
        include: {
          targetUser: true,
        },
      });
      
      res.json(vote);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar voto' });
  }
});

// Grants routes
app.get('/api/users/:userId/grants', async (req, res) => {
  try {
    const { userId } = req.params;
    const { available } = req.query;
    
    const where: any = { userId };
    
    if (available === 'true') {
      where.redeemed = false;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];
    } else if (available === 'false') {
      where.redeemed = true;
    }
    
    const grants = await prisma.homeOfficeGrant.findMany({
      where,
      include: { period: true },
      orderBy: available === 'false' ? { redeemedAt: 'desc' } : { expiresAt: 'asc' },
    });
    
    res.json(grants);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grants' });
  }
});

app.post('/api/grants/:id/redeem', async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedDate, userId } = req.body;
    
    // Verificar si el usuario ya tiene un día solicitado para esa fecha
    const existingRequest = await prisma.auditLog.findFirst({
      where: {
        actor: { id: userId },
        action: 'GRANT_REDEEMED',
        newValues: {
          contains: `"requestedDate":"${requestedDate}"`
        }
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Ya tienes un día de Home Office solicitado para esta fecha' });
    }
    
    const existingGrant = await prisma.homeOfficeGrant.findUnique({ where: { id } });
    
    const grant = await prisma.homeOfficeGrant.update({
      where: { id },
      data: {
        redeemed: true,
        redeemedAt: new Date(),
        notes: existingGrant?.notes ? `${existingGrant.notes} - Solicitado para: ${requestedDate}` : `Solicitado para: ${requestedDate}`,
      },
    });
    

    
    res.json(grant);
  } catch (error) {
    console.error('Error redimiendo grant:', error);
    res.status(500).json({ error: 'Error al redimir grant' });
  }
});

// Initiatives routes
app.get('/api/initiatives', async (req, res) => {
  try {
    const initiatives = await prisma.initiative.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(initiatives);
  } catch (error) {
    console.error('Error obteniendo iniciativas:', error);
    res.status(500).json({ error: 'Error al obtener iniciativas' });
  }
});

app.get('/api/users/:userId/initiatives', async (req, res) => {
  try {
    const initiatives = await prisma.initiative.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(initiatives);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener iniciativas' });
  }
});

app.put('/api/initiatives/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, points = 5 } = req.body;
    
    const initiative = await prisma.initiative.update({
      where: { id },
      data: {
        approved: true,
        approvedBy: approverId,
        approvedAt: new Date(),
        status: 'PLANNED',
      },
    });
    
    // Obtener puntos configurados para aprobación
    const approvalPointsSetting = await prisma.setting.findUnique({
      where: { key: 'points_for_approval' }
    });
    const approvalPoints = approvalPointsSetting ? parseInt(JSON.parse(approvalPointsSetting.value)) : 5;
    
    // Crear puntos de innovación
    await prisma.innovationPoint.create({
      data: {
        userId: initiative.userId,
        periodId: initiative.periodId,
        value: approvalPoints,
        reason: `Iniciativa aprobada: ${initiative.title}`,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });
    
    res.json(initiative);
  } catch (error) {
    console.error('Error aprobando iniciativa:', error);
    res.status(500).json({ error: 'Error al aprobar iniciativa' });
  }
});

app.put('/api/initiatives/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy } = req.body;
    
    const initiative = await prisma.initiative.update({
      where: { id },
      data: {
        approved: false,
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        status: 'DRAFT', // Vuelve a DRAFT cuando se rechaza
      },
    });
    
    res.json(initiative);
  } catch (error) {
    console.error('Error rechazando iniciativa:', error);
    res.status(500).json({ error: 'Error al rechazar iniciativa' });
  }
});

app.put('/api/initiatives/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;
    
    const initiative = await prisma.initiative.update({
      where: { id },
      data: { status },
    });
    
    // Si se marca como IMPACTFUL, dar puntos extra
    if (status === 'IMPACTFUL') {
      // Obtener puntos configurados para impacto
      const impactPointsSetting = await prisma.setting.findUnique({
        where: { key: 'points_for_impact' }
      });
      const impactPoints = impactPointsSetting ? parseInt(JSON.parse(impactPointsSetting.value)) : 5;
      
      await prisma.innovationPoint.create({
        data: {
          userId: initiative.userId,
          periodId: initiative.periodId,
          value: impactPoints,
          reason: `Iniciativa impactante: ${initiative.title}`,
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });
    }
    
    res.json(initiative);
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

app.post('/api/points/redeem', async (req, res) => {
  try {
    const { userId, points } = req.body;
    
    // Verificar puntos disponibles
    const userPoints = await prisma.innovationPoint.findMany({
      where: { userId },
    });
    
    const totalPoints = userPoints.reduce((sum, point) => sum + point.value, 0);
    const settings = await prisma.setting.findUnique({
      where: { key: 'points_for_bonus_day' }
    });
    
    const pointsNeeded = settings ? parseInt(JSON.parse(settings.value)) : 10;
    
    if (totalPoints < pointsNeeded) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }
    
    // Crear grant de día extra
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    
    await prisma.homeOfficeGrant.create({
      data: {
        userId,
        days: 1,
        source: 'POINTS',
        expiresAt,
        redeemed: false,
        notes: `Canjeado por ${pointsNeeded} puntos de innovación`,
      },
    });
    
    // Descontar puntos
    await prisma.innovationPoint.create({
      data: {
        userId,
        value: -pointsNeeded,
        reason: 'Canje por día de Home Office',
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error canjeando puntos:', error);
    res.status(500).json({ error: 'Error al canjear puntos' });
  }
});

app.post('/api/initiatives', async (req, res) => {
  try {
    const { userId, type, title, description } = req.body;
    
    // Validar campos requeridos
    if (!userId || !type || !title) {
      return res.status(400).json({ error: 'UserId, tipo y título son requeridos' });
    }
    
    const currentPeriod = await prisma.period.findFirst({
      where: {
        OR: [
          { status: 'OPEN' },
          { status: 'VOTING' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Verificar que el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userExists) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    const initiative = await prisma.initiative.create({
      data: {
        userId,
        type,
        title,
        description: description || null,
        periodId: currentPeriod?.id,
        status: 'DRAFT',
      },
    });
    
    res.json(initiative);
  } catch (error) {
    console.error('Error creando iniciativa:', error);
    res.status(500).json({ error: 'Error al crear iniciativa' });
  }
});

// Audit logs
app.post('/api/audit', async (req, res) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        ...req.body,
        oldValues: req.body.oldValues ? JSON.stringify(req.body.oldValues) : null,
        newValues: req.body.newValues ? JSON.stringify(req.body.newValues) : null,
        meta: req.body.meta ? JSON.stringify(req.body.meta) : null,
      },
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear log de auditoría' });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
});

// Settings routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { settings, userId } = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { 
          value: JSON.stringify(value),
          updatedBy: userId,
        },
        create: {
          key,
          value: JSON.stringify(value),
          updatedBy: userId,
        },
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar configuraciones' });
  }
});

// Projects routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, createdBy } = req.body;
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy,
      },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate } = req.body;
    
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

// Leaderboard routes
app.get('/api/leaderboard/points', async (req, res) => {
  try {
    const pointsData = await prisma.innovationPoint.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const userPoints = pointsData.reduce((acc, point) => {
      const userId = point.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: point.user,
          totalPoints: 0,
          recentPoints: 0,
          availablePoints: 0,
        };
      }
      
      // Solo contar puntos positivos para el leaderboard
      if (point.value > 0) {
        acc[userId].totalPoints += point.value;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (point.createdAt > thirtyDaysAgo) {
          acc[userId].recentPoints += point.value;
        }
      }
      
      // Balance actual (incluye negativos para disponibles)
      acc[userId].availablePoints += point.value;
      
      return acc;
    }, {} as any);

    const sortedPoints = Object.values(userPoints)
      .filter((entry: any) => entry.totalPoints > 0)
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    res.json(sortedPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener leaderboard de puntos' });
  }
});

app.get('/api/leaderboard/grants', async (req, res) => {
  try {
    const grantsData = await prisma.homeOfficeGrant.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const userGrants = grantsData.reduce((acc, grant) => {
      const userId = grant.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: grant.user,
          totalDays: 0,
          normalDays: 0,
          bonusDays: 0,
          grantsCount: 0,
        };
      }
      acc[userId].totalDays += grant.days;
      acc[userId].grantsCount += 1;
      
      if (grant.source === 'NORMAL') {
        acc[userId].normalDays += grant.days;
      } else {
        acc[userId].bonusDays += grant.days;
      }
      
      return acc;
    }, {} as any);

    const sortedGrants = Object.values(userGrants)
      .sort((a: any, b: any) => b.totalDays - a.totalDays);

    res.json(sortedGrants);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener leaderboard de grants' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});