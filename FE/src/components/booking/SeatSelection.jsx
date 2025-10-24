import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SeatSelection = ({ showtimeId, onSeatSelectionChange, maxSeats = 8 }) => {
  const [selected, setSelected] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load seats from API
  useEffect(() => {
    const loadSeats = async () => {
      if (!showtimeId) return;
      
      try {
        setLoading(true);
        // Since /showtimes/:id/seats route was removed, use fake data
        setSeats(generateFakeSeats());
      } catch (error) {
        console.error('Error loading seats:', error);
        // Fallback to fake data
        setSeats(generateFakeSeats());
      } finally {
        setLoading(false);
      }
    };

    loadSeats();
  }, [showtimeId]);

  // Generate fake seats as fallback
  const generateFakeSeats = () => {
    const rows = 8;
    const cols = 12;
    const seats = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const id = `${letters[r]}${c}`;
        seats.push({
          _id: id,
          row: letters[r],
          number: c,
          type: c % 6 === 0 ? 'vip' : 'standard',
          price: c % 6 === 0 ? 150000 : 120000,
          status: 'available',
        });
      }
    }
    return seats;
  };

  const layout = useMemo(() => seats, [seats]);

  useEffect(() => {
    onSeatSelectionChange?.(selected);
  }, [selected, onSeatSelectionChange]);

  const toggleSeat = (seat) => {
    const exists = selected.find((s) => s._id === seat._id);
    if (exists) {
      setSelected(selected.filter((s) => s._id !== seat._id));
    } else {
      if (selected.length >= maxSeats) return; // limit
      setSelected([...selected, seat]);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-400">Đang tải ghế...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-red-600 rounded-lg p-6 min-h-[500px]">
      <div className="flex items-center mb-6">
        <div className="w-7 h-7 bg-red-600 rounded mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          Chọn ghế
        </h2>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-gray-700 border border-gray-600" /> <span className="text-white">Trống</span></div>
        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-red-600" /> <span className="text-white">Đang chọn</span></div>
        <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-yellow-700" /> <span className="text-white">VIP</span></div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `repeat(12, minmax(36px, 1fr))`, gap: 8 }}>
          {layout.map((seat) => {
            const isSelected = selected.some((s) => s._id === seat._id);
            const isVip = seat.type === 'vip';
            return (
              <button
                key={seat._id}
                onClick={() => toggleSeat(seat)}
                className={`h-9 rounded text-xs font-semibold transition-colors border ${
                  isSelected ? 'bg-red-600 border-red-600 text-white' : isVip ? 'bg-yellow-700/50 border-yellow-700 text-white' : 'bg-gray-700 border-gray-600 text-gray-200'
                }`}
                title={`${seat.row}${seat.number} • ${seat.price.toLocaleString()} VNĐ`}
              >
                {seat.row}{seat.number}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-300">
        <div className="mb-2">Đã chọn ({selected.length}/{maxSeats}): {selected.map(s => `${s.row}${s.number}`).join(', ') || '—'}</div>
        <div>Tạm tính: {selected.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString()} VNĐ</div>
      </div>
    </div>
  );
};

export default SeatSelection;