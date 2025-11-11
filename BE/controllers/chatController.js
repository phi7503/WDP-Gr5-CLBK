import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import ChatHistory from "../models/chatHistoryModel.js";
import Movie from "../models/movieModel.js";
import User from "../models/userModel.js";
import { getAIResponse } from "../services/aiService.js";

/**
 * POST /api/chat/message
 * Send message to chatbot and get AI response
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user?._id || null;

  if (!message || message.trim() === "") {
    return res.status(400).json({ message: "Message không được để trống" });
  }

  // Tạo hoặc lấy chat session
  let chatSession = null;
  if (sessionId) {
    chatSession = await ChatHistory.findOne({ sessionId });
  }

  // Nếu không có session, tạo mới
  if (!chatSession) {
    const newSessionId = uuidv4();
    chatSession = await ChatHistory.create({
      user: userId,
      sessionId: newSessionId,
      messages: [],
      preferences: {},
    });
  }

  // ✅ QUAN TRỌNG: Lấy danh sách phim từ DATABASE
  const availableMovies = await Movie.find({
    status: { $in: ["now-showing", "coming-soon"] }, // Chỉ lấy phim đang chiếu và sắp chiếu
  })
    .select("_id title description genre duration poster hotness rating releaseDate language director cast")
    .limit(50) // Giới hạn để không quá dài prompt
    .sort({ hotness: -1, releaseDate: -1 }); // Sắp xếp theo độ hot và ngày phát hành

  if (availableMovies.length === 0) {
    return res.status(404).json({ 
      message: "Hiện tại không có phim nào trong hệ thống",
      sessionId: chatSession.sessionId 
    });
  }

  // Format movies cho AI context
  const moviesContext = availableMovies.map((m) => ({
    id: m._id.toString(),
    title: m.title,
    genre: m.genre || [],
    description: m.description || "",
    duration: m.duration || 0,
    hotness: m.hotness || 0,
    rating: m.rating || 0,
    releaseDate: m.releaseDate,
    language: m.language || "",
    director: m.director || "",
    cast: m.cast || [],
  }));

  // Lấy lịch sử chat (bao gồm recommendedMovies để tránh trùng lặp)
  const chatHistory = (chatSession.messages || []).map((msg) => ({
    role: msg.role,
    content: msg.content,
    recommendedMovies: msg.recommendedMovies || [],
  }));

  // Gọi AI service
  let aiResponse;
  try {
    aiResponse = await getAIResponse(message, moviesContext, chatHistory);
  } catch (error) {
    console.error("AI Error:", error);
    
    // Fallback: Trả về phim phổ biến nhất (8 phim)
    const popularMovies = availableMovies
      .sort((a, b) => b.hotness - a.hotness)
      .slice(0, 8); // Tăng lên 8 phim
    
    aiResponse = {
      message: "Xin lỗi, tôi gặp sự cố kỹ thuật. Đây là một số phim đang hot trong hệ thống:",
      recommendedMovieIds: popularMovies.map((m) => m._id.toString()),
      extractedPreferences: {},
    };
  }

  // Lưu message của user vào database
  chatSession.messages.push({
    role: "user",
    content: message,
    timestamp: new Date(),
  });

  // Lưu response của AI vào database
  const recommendedMovieIds = aiResponse.recommendedMovieIds || [];
  chatSession.messages.push({
    role: "assistant",
    content: aiResponse.message,
    timestamp: new Date(),
    recommendedMovies: recommendedMovieIds,
  });

  // Cập nhật preferences nếu AI extract được
  if (aiResponse.extractedPreferences) {
    const prefs = aiResponse.extractedPreferences;
    
    if (prefs.genres && Array.isArray(prefs.genres) && prefs.genres.length > 0) {
      // Merge genres, loại bỏ duplicate
      const existingGenres = chatSession.preferences.genres || [];
      chatSession.preferences.genres = [
        ...new Set([...existingGenres, ...prefs.genres]),
      ];
    }
    
    if (prefs.mood) {
      chatSession.preferences.mood = prefs.mood;
    }
    
    if (prefs.language) {
      chatSession.preferences.language = prefs.language;
    }
    
    if (prefs.yearRange) {
      if (prefs.yearRange.min) {
        chatSession.preferences.yearRange = {
          ...chatSession.preferences.yearRange,
          min: prefs.yearRange.min,
        };
      }
      if (prefs.yearRange.max) {
        chatSession.preferences.yearRange = {
          ...chatSession.preferences.yearRange,
          max: prefs.yearRange.max,
        };
      }
    }
  }

  // Lưu session vào database
  await chatSession.save();

  // ✅ Cập nhật user preferences nếu user đã đăng nhập
  if (userId && aiResponse.extractedPreferences?.genres) {
    try {
      const user = await User.findById(userId);
      if (user) {
        const existingGenres = user.preferences?.genres || [];
        const newGenres = [
          ...new Set([...existingGenres, ...aiResponse.extractedPreferences.genres]),
        ];
        
        await User.findByIdAndUpdate(userId, {
          $set: {
            "preferences.genres": newGenres,
          },
        });
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      // Không throw error, chỉ log
    }
  }

  // ✅ Lấy thông tin đầy đủ của phim được gợi ý từ DATABASE
  const recommendedMovies = await Movie.find({
    _id: { $in: recommendedMovieIds },
  })
    .select("_id title description genre poster hotness rating duration releaseDate")
    .limit(10); // Giới hạn tối đa 10 phim

  // Response về frontend
  res.json({
    response: aiResponse.message,
    recommendedMovies: recommendedMovies.map((m) => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      genre: m.genre,
      poster: m.poster,
      hotness: m.hotness,
      rating: m.rating,
      duration: m.duration,
      releaseDate: m.releaseDate,
    })),
    sessionId: chatSession.sessionId,
    preferences: chatSession.preferences,
  });
});

/**
 * GET /api/chat/history/:sessionId
 * Get chat history by session ID
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user?._id || null;

  // Tìm chat session
  const chatSession = await ChatHistory.findOne({
    sessionId,
    // Nếu có userId, chỉ lấy session của user đó
    ...(userId ? { user: userId } : {}),
  }).populate("messages.recommendedMovies", "title poster genre description hotness rating");

  if (!chatSession) {
    return res.status(404).json({ message: "Không tìm thấy lịch sử chat" });
  }

  res.json({
    messages: chatSession.messages,
    preferences: chatSession.preferences,
    sessionId: chatSession.sessionId,
  });
});

/**
 * DELETE /api/chat/history/:sessionId
 * Clear chat history
 */
export const clearChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user?._id || null;

  const chatSession = await ChatHistory.findOneAndUpdate(
    {
      sessionId,
      ...(userId ? { user: userId } : {}),
    },
    {
      $set: {
        messages: [],
        preferences: {},
        isActive: false,
      },
    },
    { new: true }
  );

  if (!chatSession) {
    return res.status(404).json({ message: "Không tìm thấy lịch sử chat" });
  }

  res.json({ 
    message: "Đã xóa lịch sử chat thành công",
    sessionId: chatSession.sessionId 
  });
});

