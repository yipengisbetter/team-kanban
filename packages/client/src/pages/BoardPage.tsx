import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import api from '../api';
import socket from '../socket';

interface Card {
  id: string;
  title: string;
  order: number;
}

interface List {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
  lists: List[];
}

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const navigate = useNavigate();

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${boardId}`);
      setBoard(data);
    } catch {
      navigate('/');
    }
  };

  useEffect(() => {
    fetchBoard();
    socket.emit('join-board', boardId);
    const handleCardMoved = () => {
      fetchBoard(); // 简单重新拉取，生产环境可局部更新
    };
    socket.on('card-moved', handleCardMoved);
    socket.on('board-updated', handleCardMoved);

    return () => {
      socket.emit('leave-board', boardId);
      socket.off('card-moved', handleCardMoved);
      socket.off('board-updated', handleCardMoved);
    };
  }, [boardId]);

  const addList = async () => {
    if (!newListTitle.trim() || !board) return;
    await api.post(`/boards/${boardId}/lists`, { title: newListTitle });
    setNewListTitle('');
    fetchBoard();
  };

  const addCard = async (listId: string, title: string) => {
    await api.post(`/boards/${boardId}/cards`, { listId, title });
    fetchBoard();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;
    const { source, destination, draggableId } = result;

    // 更新本地顺序（乐观更新）
    const newLists = [...board.lists];
    const sourceList = newLists.find((l) => l.id === source.droppableId);
    const destList = newLists.find((l) => l.id === destination.droppableId);
    if (!sourceList || !destList) return;

    const [movedCard] = sourceList.cards.splice(source.index, 1);
    destList.cards.splice(destination.index, 0, movedCard);
    setBoard({ ...board, lists: newLists });

    try {
      await api.patch(`/boards/${boardId}/cards/${draggableId}/move`, {
        listId: destination.droppableId,
        order: destination.index,
      });
    } catch {
      fetchBoard(); // 失败回退
    }
  };

  if (!board) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate('/')} className="mr-4 text-blue-500">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{board.title}</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="p-2 border rounded"
          placeholder="New list title"
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
        />
        <button onClick={addList} className="px-4 py-2 bg-blue-500 text-white rounded">
          Add List
        </button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto">
          {board.lists
            .sort((a, b) => a.order - b.order)
            .map((list) => (
              <Droppable droppableId={list.id} key={list.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 rounded p-3 w-72 flex-shrink-0"
                  >
                    <h3 className="font-semibold mb-2">{list.title}</h3>
                    {list.cards
                      .sort((a, b) => a.order - b.order)
                      .map((card, index) => (
                        <Draggable draggableId={card.id} index={index} key={card.id}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-2 mb-2 rounded shadow"
                            >
                              {card.title}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                    <AddCardForm listId={list.id} onAdd={addCard} />
                  </div>
                )}
              </Droppable>
            ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function AddCardForm({ listId, onAdd }: { listId: string; onAdd: (listId: string, title: string) => void }) {
  const [title, setTitle] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(listId, title);
      setTitle('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-1 mt-2">
      <input
        className="flex-1 p-1 border rounded text-sm"
        placeholder="New card"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" className="text-sm px-2 py-1 bg-green-500 text-white rounded">
        Add
      </button>
    </form>
  );
}