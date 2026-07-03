import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res) => {
  const { boardId } = req.params;
  const { title } = req.body;

  // 权限校验：是否属于该看板
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: req.userId! } },
  });
  if (!member) return res.status(403).json({ message: 'Not a board member' });

  const maxOrder = await prisma.list.aggregate({ _max: { order: true }, where: { boardId } });
  const list = await prisma.list.create({
    data: { title, boardId, order: (maxOrder._max.order ?? 0) + 1 },
  });
  getIO().to(`board:${boardId}`).emit('board-updated');
  res.json(list);
});

export default router;