import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { EventSeat } from "@mui/icons-material";
import { showtimeService } from "../services/showtimeService";

const SeatSelection = ({ showtimeId, onSeatSelectionChange, maxSeats = 8 }) => {
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showtimeId) {
      fetchShowtimeDetails();
    }
  }, [showtimeId]);

  const fetchShowtimeDetails = async () => {
    try {
      setLoading(true);
      const detail = await showtimeService.getShowtimeById(showtimeId);
      setShowtime(detail);

      // Tạo layout ghế mặc định nếu không có dữ liệu
      if (detail.seats && detail.seats.length > 0) {
        setSeats(detail.seats);
      } else {
        // Tạo layout ghế mặc định 8x10 với VIP ở giữa
        const defaultSeats = [];
        const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const columns = Array.from({ length: 10 }, (_, i) => i + 1);

        rows.forEach((row) => {
          columns.forEach((col) => {
            const isVIP =
              (row === "E" || row === "F" || row === "G" || row === "H") &&
              col >= 5 &&
              col <= 6;
            const isBooked = Math.random() < 0.2; // 20% ghế đã đặt

            defaultSeats.push({
              _id: `${row}${col}`,
              row,
              number: col,
              type: isVIP ? "VIP" : "normal",
              price: isVIP ? 120000 : 80000,
              status: isBooked ? "booked" : "available",
            });
          });
        });

        setSeats(defaultSeats);
      }
    } catch (error) {
      console.error("Error fetching showtime details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === "booked") return;

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s._id === seat._id);
      let newSelection;

      if (isSelected) {
        newSelection = prev.filter((s) => s._id !== seat._id);
      } else {
        if (prev.length >= maxSeats) return prev;
        newSelection = [
          ...prev,
          {
            ...seat,
            price: seat.price || (seat.type === "VIP" ? 120000 : 80000),
          },
        ];
      }

      onSeatSelectionChange(newSelection);
      return newSelection;
    });
  };

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.some((s) => s._id === seat._id);

    if (seat.status === "booked") return "#374151";
    if (isSelected) return "#dc2626";
    if (seat.type === "VIP") return "#eab308";
    return "#6b7280";
  };

  const getSeatBorderColor = (seat) => {
    const isSelected = selectedSeats.some((s) => s._id === seat._id);
    return isSelected ? "#ef4444" : "#9ca3af";
  };

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const columns = Array.from({ length: 10 }, (_, i) => i + 1);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ color: "white" }}>
          Đang tải thông tin ghế...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#1a1a1a",
        border: "1px solid #dc2626",
        borderRadius: 2,
        p: 3,
        minHeight: "600px",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <EventSeat sx={{ color: "#dc2626", mr: 1, fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: "white", fontWeight: "bold" }}>
          Chọn ghế
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: "#9ca3af", mb: 3 }}>
        Chọn vị trí ngồi yêu thích
      </Typography>

      {/* Screen */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="body2" sx={{ color: "#9ca3af", mb: 1 }}>
          Màn hình
        </Typography>
        <Box
          sx={{
            height: 4,
            bgcolor: "#9ca3af",
            borderRadius: 2,
            maxWidth: 400,
            mx: "auto",
          }}
        />
      </Box>

      {/* Seat Map */}
      <Box sx={{ mb: 4 }}>
        {/* Column Headers */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Box sx={{ width: 40 }} />
          {columns.map((col) => (
            <Box
              key={col}
              sx={{
                width: 40,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              {col}
            </Box>
          ))}
        </Box>

        {/* Seat Grid */}
        {rows.map((row) => (
          <Box key={row} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            {/* Row Label */}
            <Typography
              sx={{
                width: 40,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              {row}
            </Typography>

            {/* Seats */}
            {columns.map((col) => {
              const seat = seats.find((s) => s.row === row && s.number === col);
              if (!seat) return <Box key={`${row}${col}`} sx={{ width: 40 }} />;

              return (
                <Box
                  key={seat._id}
                  sx={{
                    width: 32,
                    height: 32,
                    mx: 0.5,
                    cursor:
                      seat.status === "booked" ? "not-allowed" : "pointer",
                    bgcolor: getSeatColor(seat),
                    border: `1px solid ${getSeatBorderColor(seat)}`,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    "&:hover":
                      seat.status !== "booked"
                        ? {
                            transform: "scale(1.1)",
                            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                          }
                        : {},
                  }}
                  onClick={() => handleSeatClick(seat)}
                >
                  {seat.status !== "booked" && (
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {seat.number}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Seat Legend */}
      <Box sx={{ display: "flex", gap: 3, mb: 3, justifyContent: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "#6b7280",
              borderRadius: 0.5,
            }}
          />
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Ghế thường
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "#eab308",
              borderRadius: 0.5,
            }}
          />
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Ghế VIP
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "#dc2626",
              borderRadius: 0.5,
            }}
          />
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Đã chọn
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: "#374151",
              borderRadius: 0.5,
            }}
          />
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Đã đặt
          </Typography>
        </Box>
      </Box>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "white", mb: 2 }}>
            Đã chọn {selectedSeats.length}/{maxSeats} ghế
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {selectedSeats.map((seat) => (
              <Box
                key={seat._id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#2a2a2a",
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid #dc2626",
                }}
              >
                <Typography
                  sx={{ color: "white", display: "flex", alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: "#dc2626",
                      borderRadius: 0.5,
                      mr: 1,
                    }}
                  />
                  Ghế {seat.row}
                  {seat.number}
                </Typography>
                <Typography sx={{ color: "white", fontWeight: "bold" }}>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(seat.price)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SeatSelection;
