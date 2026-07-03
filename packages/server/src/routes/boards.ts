import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res) => {
  const { title } = req.body;
  const board = await prisma.board.create({
    data: {
      title,
      ownerId: req.userId!,
      members: { create: { userId: req.userId!, role: 'OWNER' } },
    },
    include: { lists: { include: { cards: true } }, members: { include: { user: true } } },
  });
  res.json(board);
});

router.get('/', async (req: AuthRequest, res) => {
  const boards = await prisma.board.findMany({
    where: { members: { some: { userId: req.userId! } } },
    include: { lists: { include: { cards: true } }, members: true },
  });
  res.json(boards);
});

router.get('/:boardId', async (req: AuthRequest, res) => {
  const { boardId } = req.params;
  const board = await prisma.board.findFirst({
    where: { id: boardId, members: { some: { userId: req.userId! } } },
    include: { lists: { include: { cards: { orderBy: { order: 'asc' } } } } },
  });
  if (!board) return res.status(404).json({ message: 'Board not found' });
  res.json(board);
});

// 邀请成员
router.post('/:boardId/invite', async (req: AuthRequest, res) => {
  const { boardId } = req.params;
  const { email } = req.body;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: req.userId! } },
  });
  if (!membership || membership.role !== 'OWNER') {
    return res.status(403).json({ message: 'Only owner can invite' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await prisma.boardMember.create({
    data: { boardId, userId: user.id, role: 'MEMBER' },
  });
  getIO().to(`board:${boardId}`).emit('board-updated');
  res.json({ success: true });
});

export default router;