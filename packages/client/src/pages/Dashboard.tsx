import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/authStore';

interface Board {
  id: string;
  title: string;
}

export default function Dashboard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const fetchBoards = async () => {
    const { data } = await api.get('/boards');
    setBoards(data);
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const createBoard = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await api.post('/boards', { title: newTitle });
      setNewTitle('');
      fetchBoards();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:underline">
          Logout
        </button>
      </div>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New board name"
          className="flex-1 p-2 border rounded"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createBoard()}
        />
        <button
          onClick={createBoard}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Create
        </button>
      </div>
      <ul className="space-y-2">
        {boards.map((board) => (
          <li
            key={board.id}
            className="p-3 bg-white rounded shadow cursor-pointer hover:bg-gray-100"
            onClick={() => navigate(`/board/${board.id}`)}
          >
            {board.title}
          </li>
        ))}
      </ul>
    </div>
  );
}