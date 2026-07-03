import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res) => {
  const { boardId } = req.params;
  const { listId, title } = req.body;

  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: req.userId! } },
  });
  if (!member) return res.status(403).json({ message: 'Not a board member' });

  const maxOrder = await prisma.card.aggregate({ _max: { order: true }, where: { listId } });
  const card = await prisma.card.create({
    data: { title, listId, order: (maxOrder._max.order ?? 0) + 1 },
  });
  getIO().to(`board:${boardId}`).emit('board-updated');
  res.json(card);
});

router.patch('/:cardId/move', async (req: AuthRequest, res) => {
  const { boardId, cardId } = req.params;
  const { listId, order } = req.body;

  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: req.userId! } },
  });
  if (!member) return res.status(403).json({ message: 'Not a board member' });

  // 简化处理：直接更新列表和顺序，生产环境应重排其他卡片
  await prisma.card.update({
    where: { id: cardId },
    data: { listId, order },
  });
  getIO().to(`board:${boardId}`).emit('card-moved');
  res.json({ success: true });
});

export default router;