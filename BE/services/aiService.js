import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get AI response for movie recommendation
 * @param {string} userMessage - User's message
 * @param {Array} moviesContext - Array of movies from database
 * @param {Array} chatHistory - Previous chat messages
 * @returns {Promise<Object>} AI response with message and recommended movie IDs
 */
export const getAIResponse = async (userMessage, moviesContext, chatHistory) => {
  try {
    // Use gemini-2.5-flash model (free tier, latest version)
    // Available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ✅ PHÂN TÍCH GENRE TỪ USER MESSAGE TRƯỚC
    const userMessageLower = userMessage.toLowerCase();
    let requestedGenre = null;
    const genreMap = {
      'hành động': 'Action',
      'action': 'Action',
      'tình cảm': ['Romance', 'Drama'],
      'romance': 'Romance',
      'drama': 'Drama',
      'kinh dị': 'Horror',
      'horror': 'Horror',
      'hài': 'Comedy',
      'comedy': 'Comedy',
      'phiêu lưu': 'Adventure',
      'adventure': 'Adventure',
      'khoa học viễn tưởng': 'Sci-Fi',
      'sci-fi': 'Sci-Fi',
      'science fiction': 'Sci-Fi',
      'giả tưởng': 'Fantasy',
      'fantasy': 'Fantasy',
      'trinh thám': 'Mystery',
      'mystery': 'Mystery',
      'tội phạm': 'Crime',
      'crime': 'Crime',
      'hoạt hình': 'Animation',
      'animation': 'Animation',
    };

    // Tìm genre được yêu cầu
    for (const [keyword, genre] of Object.entries(genreMap)) {
      if (userMessageLower.includes(keyword)) {
        requestedGenre = genre;
        break;
      }
    }

    // Filter movies theo genre nếu có yêu cầu cụ thể
    let filteredMoviesContext = moviesContext;
    if (requestedGenre) {
      if (Array.isArray(requestedGenre)) {
        // Nếu là array (ví dụ: tình cảm = Romance hoặc Drama)
        filteredMoviesContext = moviesContext.filter(m => 
          m.genre && m.genre.some(g => requestedGenre.includes(g))
        );
      } else {
        // Nếu là string đơn
        filteredMoviesContext = moviesContext.filter(m => 
          m.genre && m.genre.includes(requestedGenre)
        );
      }
      
      // Nếu không có phim nào phù hợp, dùng lại toàn bộ
      if (filteredMoviesContext.length === 0) {
        filteredMoviesContext = moviesContext;
      }
    }

    const systemPrompt = `
Bạn là CineMate - một chuyên gia tư vấn phim thân thiện của hệ thống CineLink.

NHIỆM VỤ CHÍNH:
1. PHÂN TÍCH KỸ message của người dùng trước khi quyết định hành động
2. Nếu user chỉ chào hỏi ("hello", "hi", "xin chào") → CHỈ chào lại, KHÔNG gợi ý phim
3. Nếu user YÊU CẦU gợi ý phim → mới gợi ý phim PHÙ HỢP
4. CHỈ gợi ý phim PHÙ HỢP với yêu cầu cụ thể, KHÔNG gợi ý linh tinh
5. Nếu user hỏi chung chung về phim → gợi ý phim hot nhất + hỏi thêm sở thích
6. QUAN TRỌNG: Nếu user KHÔNG yêu cầu gợi ý phim → recommendedMovieIds có thể để trống []

QUY TẮC NGHIÊM NGẶT:
- PHÂN TÍCH message: User đang làm gì? Chào hỏi? Yêu cầu gợi ý phim? Hỏi về phim?
- Nếu user CHỈ chào hỏi ("hello", "hi", "xin chào", "heello") → CHỈ chào lại, recommendedMovieIds = []
- Nếu user YÊU CẦU gợi ý phim → mới gợi ý phim
- CHỈ gợi ý phim có trong danh sách được cung cấp (dùng đúng ID)
- Gợi ý 5-8 phim PHÙ HỢP với yêu cầu, KHÔNG trùng với phim đã gợi ý trước đó
- Nếu user nói "phim hành động" → CHỈ gợi ý phim có genre CHỨA "Action" (chưa gợi ý)
- Nếu user nói "phim tình cảm" → CHỈ gợi ý phim có genre CHỨA "Romance" HOẶC "Drama" (chưa gợi ý)
- Nếu user nói "phim kinh dị" → CHỈ gợi ý phim có genre CHỨA "Horror" (chưa gợi ý)
- Nếu user nói "phim hài" → CHỈ gợi ý phim có genre CHỨA "Comedy" (chưa gợi ý)
- QUAN TRỌNG: Nếu user yêu cầu genre cụ thể → CHỈ được gợi ý phim có genre đó, KHÔNG được gợi ý phim khác genre
- Nếu user hỏi chung chung "có phim gì", "gợi ý phim", "thời tiết như này" → gợi ý phim hot nhất CHƯA gợi ý + hỏi thêm sở thích
- QUAN TRỌNG: KHÔNG BAO GIỜ gợi ý lại phim đã gợi ý trong session này

VÍ DỤ MESSAGE:
- User: "hello" → "Xin chào! Tôi là CineMate...", recommendedMovieIds = []
- User: "phim hành động" → "Dựa trên sở thích của bạn, tôi đã tìm thấy một số phim hành động đang hot trong hệ thống. Đây là những lựa chọn phù hợp:", recommendedMovieIds = [5-8 phim Action]
- User: "phim tình cảm" → "Tôi đã tìm thấy một số phim tình cảm lãng mạn cho bạn. Đây là những gợi ý:", recommendedMovieIds = [5-8 phim Romance/Drama]
- User: "hôm nay có phim gì" → "Hôm nay có rất nhiều phim hay đang chiếu! Đây là một số phim đang hot:", recommendedMovieIds = [5-8 phim hot nhất]

LƯU Ý:
- Message phải NGẮN GỌN, tự nhiên, KHÔNG liệt kê từng phim
- KHÔNG đề cập ID trong message
- Gợi ý TỐI THIỂU 5-8 phim trong recommendedMovieIds

FORMAT TRẢ VỀ (QUAN TRỌNG - PHẢI TRẢ VỀ JSON):
{
  "message": "Câu trả lời tự nhiên bằng tiếng Việt, CHỈ đề cập TÊN PHIM (KHÔNG đề cập ID), giải thích ngắn gọn tại sao gợi ý những phim này",
  "recommendedMovieIds": ["movie_id_1", "movie_id_2", "movie_id_3", "movie_id_4", "movie_id_5", "movie_id_6", "movie_id_7", "movie_id_8"],
  "extractedPreferences": {
    "genres": ["Action"],
    "mood": "excited",
    "language": "Vietnamese"
  }
}

LƯU Ý VỀ MESSAGE:
- KHÔNG BAO GIỜ đề cập ID trong message, chỉ đề cập TÊN PHIM
- Message phải tự nhiên, thân thiện, dễ hiểu
- Gợi ý TỐI THIỂU 5-8 phim trong recommendedMovieIds
- KHÔNG liệt kê từng phim trong message, chỉ nói chung chung như "Đây là một số phim hành động..."

LƯU Ý QUAN TRỌNG:
- recommendedMovieIds phải là các ID có trong danh sách phim được cung cấp
- Nếu user CHỈ chào hỏi → recommendedMovieIds = [] (KHÔNG gợi ý phim)
- Nếu user YÊU CẦU gợi ý phim → recommendedMovieIds phải có 5-8 phim CHƯA gợi ý
- Nếu user hỏi chung chung → chọn 5-8 phim hot nhất CHƯA gợi ý từ danh sách
- PHẢI phân tích message user trước khi quyết định: chào lại hay gợi ý phim
- KHÔNG BAO GIỜ gợi ý lại phim đã gợi ý trong session này
`;

    // Format movies list for AI context (chỉ dùng filteredMoviesContext)
    const moviesList = filteredMoviesContext
      .map((m, idx) => 
        `${idx + 1}. ID: ${m.id}\n   Tên phim: ${m.title}\n   Thể loại: ${m.genre.join(", ")}\n   Mô tả: ${m.description.substring(0, 200)}...\n   Độ hot: ${m.hotness}/10\n   Rating: ${m.rating}/10\n   Thời lượng: ${m.duration} phút\n   Ngày phát hành: ${m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'N/A'}`
      )
      .join("\n\n");

    // Format chat history (last 5 messages)
    // Extract ALL previously recommended movie IDs from ENTIRE session to avoid duplicates
    const previouslyRecommendedIds = [];
    // Lấy từ toàn bộ chatHistory (không chỉ 5 messages gần nhất)
    chatHistory.forEach((msg) => {
      if (msg.recommendedMovies && Array.isArray(msg.recommendedMovies)) {
        msg.recommendedMovies.forEach((movieId) => {
          if (typeof movieId === 'string') {
            if (!previouslyRecommendedIds.includes(movieId)) {
              previouslyRecommendedIds.push(movieId);
            }
          } else if (movieId && typeof movieId.toString === 'function') {
            const idStr = movieId.toString();
            if (!previouslyRecommendedIds.includes(idStr)) {
              previouslyRecommendedIds.push(idStr);
            }
          }
        });
      }
    });

    const historyText = chatHistory
      .slice(-5)
      .map((m) => {
        if (m.role === "user") {
          return `User: ${m.content}`;
        } else {
          return `CineMate: ${m.content}`;
        }
      })
      .join("\n");

    // Build full prompt
    const prompt = `${systemPrompt}

═══════════════════════════════════════════════════════════
DANH SÁCH PHIM CÓ SẴN TRONG HỆ THỐNG CINELINK:
═══════════════════════════════════════════════════════════
${moviesList}

${previouslyRecommendedIds.length > 0 ? `\n⚠️ LƯU Ý: Các phim đã được gợi ý trước đó (KHÔNG gợi ý lại): ${previouslyRecommendedIds.slice(0, 10).join(", ")}` : ""}

═══════════════════════════════════════════════════════════
LỊCH SỬ TRÒ CHUYỆN (5 tin nhắn gần nhất):
═══════════════════════════════════════════════════════════
${historyText || "Chưa có lịch sử trò chuyện"}

═══════════════════════════════════════════════════════════
MESSAGE HIỆN TẠI CỦA USER:
═══════════════════════════════════════════════════════════
${userMessage}

${requestedGenre ? `\n⚠️ QUAN TRỌNG: User đã yêu cầu phim thể loại "${Array.isArray(requestedGenre) ? requestedGenre.join(' hoặc ') : requestedGenre}". CHỈ được gợi ý phim có genre này, KHÔNG được gợi ý phim khác genre!` : ''}

═══════════════════════════════════════════════════════════
HƯỚNG DẪN PHÂN TÍCH:
1. Đọc kỹ message của user
2. Xác định: user muốn thể loại gì? Từ khóa gì? Tâm trạng gì?
3. Tìm phim trong danh sách PHÙ HỢP với yêu cầu đó
4. Gợi ý TỐI THIỂU 5-8 phim (KHÔNG chỉ 3 phim)
5. Message phải NGẮN GỌN, tự nhiên, KHÔNG liệt kê từng phim, KHÔNG đề cập ID

QUAN TRỌNG: 
- Trả về JSON hợp lệ với format đã định nghĩa ở trên
- recommendedMovieIds phải có TỐI THIỂU 5-8 phim
- Message KHÔNG được đề cập ID, chỉ nói chung chung về phim được gợi ý`;

    // Generate content with error handling for model name
    let result, response, text;
    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      text = response.text();
    } catch (modelError) {
      // If model not found, try alternative models
      if (modelError.message && modelError.message.includes("404") || modelError.message.includes("not found")) {
        console.log(`Model ${modelNames[0]} not found, trying alternatives...`);
        
        // Try gemini-pro as fallback
        try {
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
          result = await fallbackModel.generateContent(prompt);
          response = await result.response;
          text = response.text();
          console.log("Successfully used gemini-pro model");
        } catch (fallbackError) {
          // Try gemini-1.0-pro
          try {
            const fallbackModel2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            result = await fallbackModel2.generateContent(prompt);
            response = await result.response;
            text = response.text();
            console.log("Successfully used gemini-1.0-pro model");
          } catch (finalError) {
            console.error("All model attempts failed:", finalError);
            throw new Error(`Không thể kết nối với AI service. Model không khả dụng. Lỗi: ${finalError.message}`);
          }
        }
      } else {
        throw modelError;
      }
    }

    // Parse JSON from response
    // Try to extract JSON from the response
    let jsonResponse;
    
    // Clean text: Remove ID references from message if any
    let cleanedText = text;
    // Remove patterns like "ID: xxx" or "(ID: xxx)" from text
    cleanedText = cleanedText.replace(/\(?ID:\s*[a-f0-9]{24}\)?/gi, '');
    cleanedText = cleanedText.replace(/\(?id:\s*[a-f0-9]{24}\)?/gi, '');
    
    // Method 1: Try to find JSON object in response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
        // Clean message: Remove ID references
        if (jsonResponse.message) {
          jsonResponse.message = jsonResponse.message
            .replace(/\(?ID:\s*[a-f0-9]{24}\)?/gi, '')
            .replace(/\(?id:\s*[a-f0-9]{24}\)?/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      } catch (e) {
        console.error("Error parsing JSON:", e);
      }
    }

    // Method 2: If no JSON found, try to extract movie IDs from text
    if (!jsonResponse) {
      const movieIdPattern = /ID:\s*([a-f0-9]{24})/gi;
      const foundIds = [];
      let match;
      while ((match = movieIdPattern.exec(text)) !== null) {
        foundIds.push(match[1]);
      }

      // Also try to find IDs from movies list (chỉ từ filteredMoviesContext)
      filteredMoviesContext.forEach((movie) => {
        if (text.toLowerCase().includes(movie.title.toLowerCase())) {
          if (!foundIds.includes(movie.id)) {
            foundIds.push(movie.id);
          }
        }
      });

      // Clean message: Remove ID references
      const cleanMessage = cleanedText
        .replace(/\(?ID:\s*[a-f0-9]{24}\)?/gi, '')
        .replace(/\(?id:\s*[a-f0-9]{24}\)?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      jsonResponse = {
        message: cleanMessage,
        recommendedMovieIds: foundIds.slice(0, 8), // Limit to 8 movies
        extractedPreferences: {},
      };
    }

    // Validate recommendedMovieIds exist in filteredMoviesContext (đã filter theo genre)
    const validMovieIds = filteredMoviesContext.map((m) => m.id);
    let validRecommendations = jsonResponse.recommendedMovieIds
      ? jsonResponse.recommendedMovieIds.filter((id) => validMovieIds.includes(id))
      : [];
    
    // ✅ BẢO ĐẢM: Nếu có requestedGenre, CHỈ giữ lại phim đúng genre
    if (requestedGenre && validRecommendations.length > 0) {
      const genreFiltered = validRecommendations.filter(id => {
        const movie = filteredMoviesContext.find(m => m.id === id);
        if (!movie) return false;
        if (Array.isArray(requestedGenre)) {
          return movie.genre && movie.genre.some(g => requestedGenre.includes(g));
        } else {
          return movie.genre && movie.genre.includes(requestedGenre);
        }
      });
      validRecommendations = genreFiltered;
    }

    // Remove previously recommended movies to avoid duplicates
    if (previouslyRecommendedIds.length > 0) {
      validRecommendations = validRecommendations.filter(
        (id) => !previouslyRecommendedIds.includes(id)
      );
    }

    // ✅ Kiểm tra xem user có YÊU CẦU gợi ý phim không
    // userMessageLower đã được khai báo ở trên
    const isGreetingOnly = /^(hello|hi|hey|xin chào|chào|heello|hii)$/i.test(userMessage.trim());
    const isRequestingMovies = 
      userMessageLower.includes('phim') || 
      userMessageLower.includes('gợi ý') || 
      userMessageLower.includes('đề xuất') ||
      userMessageLower.includes('có phim') ||
      userMessageLower.includes('thời tiết') ||
      userMessageLower.includes('hôm nay');

    // Nếu user CHỈ chào hỏi → không gợi ý phim
    if (isGreetingOnly && !isRequestingMovies) {
      jsonResponse.recommendedMovieIds = [];
      return jsonResponse;
    }

    // ✅ Nếu user YÊU CẦU gợi ý phim nhưng không có hoặc quá ít → gợi ý phim hot nhất CHƯA gợi ý
    if (isRequestingMovies && (validRecommendations.length === 0 || validRecommendations.length < 5)) {
      // Filter out previously recommended movies VÀ filter theo genre nếu có
      let availableMovies = filteredMoviesContext.filter(
        (m) => !previouslyRecommendedIds.includes(m.id)
      );
      
      // Nếu có requestedGenre, đảm bảo chỉ lấy phim đúng genre
      if (requestedGenre) {
        if (Array.isArray(requestedGenre)) {
          availableMovies = availableMovies.filter(m => 
            m.genre && m.genre.some(g => requestedGenre.includes(g))
          );
        } else {
          availableMovies = availableMovies.filter(m => 
            m.genre && m.genre.includes(requestedGenre)
          );
        }
      }
      
      if (availableMovies.length > 0) {
        // Đảm bảo có ít nhất 5 phim, tối đa 8 phim
        const minMovies = Math.max(5, validRecommendations.length);
        const maxMovies = 8;
        const neededMovies = Math.max(0, minMovies - validRecommendations.length);
        
        const popularMovies = availableMovies
          .sort((a, b) => b.hotness - a.hotness)
          .slice(0, Math.max(neededMovies, 8)) // Lấy đủ để có ít nhất 5 phim
          .map((m) => m.id);
        
        // Merge with existing recommendations, remove duplicates
        const allRecommendations = [...new Set([...validRecommendations, ...popularMovies])];
        validRecommendations = allRecommendations.slice(0, maxMovies);
        
        // Cập nhật message nếu cần
        if (validRecommendations.length > 0 && !jsonResponse.message.includes("hot")) {
          if (validRecommendations.length === popularMovies.length) {
            // Nếu chỉ có phim hot, thêm vào message
            jsonResponse.message += "\n\nĐây là một số phim đang hot trong hệ thống:";
          } else {
            jsonResponse.message += "\n\nNgoài ra, đây là thêm một số phim đang hot:";
          }
        }
      }
    }

    // ✅ Fallback cuối cùng: chỉ khi user YÊU CẦU gợi ý phim
    if (isRequestingMovies && validRecommendations.length === 0) {
      // Lấy 8 phim hot nhất CHƯA gợi ý, filter theo genre nếu có
      let availableMovies = filteredMoviesContext.filter(
        (m) => !previouslyRecommendedIds.includes(m.id)
      );
      
      // Nếu có requestedGenre, đảm bảo chỉ lấy phim đúng genre
      if (requestedGenre) {
        if (Array.isArray(requestedGenre)) {
          availableMovies = availableMovies.filter(m => 
            m.genre && m.genre.some(g => requestedGenre.includes(g))
          );
        } else {
          availableMovies = availableMovies.filter(m => 
            m.genre && m.genre.includes(requestedGenre)
          );
        }
      }
      
      if (availableMovies.length > 0) {
        // Đảm bảo có ít nhất 5 phim, tối đa 8 phim
        const finalFallback = availableMovies
          .sort((a, b) => b.hotness - a.hotness)
          .slice(0, 8)
          .map((m) => m.id);
        validRecommendations = finalFallback;
        const genreName = requestedGenre ? (Array.isArray(requestedGenre) ? requestedGenre.join('/') : requestedGenre) : '';
        // Clean message: Remove ID references và đảm bảo ngắn gọn
        jsonResponse.message = (genreName 
          ? `Dựa trên yêu cầu của bạn, tôi đã tìm thấy một số phim ${genreName} đang hot trong hệ thống. Đây là những lựa chọn phù hợp:`
          : "Đây là một số phim đang hot trong hệ thống:")
          .replace(/\(?ID:\s*[a-f0-9]{24}\)?/gi, '')
          .replace(/\(?id:\s*[a-f0-9]{24}\)?/gi, '')
          .trim();
      } else {
        // Nếu không có phim đúng genre, thử lấy từ toàn bộ (nhưng vẫn filter trùng)
        const allAvailable = moviesContext.filter(
          (m) => !previouslyRecommendedIds.includes(m.id)
        );
        if (allAvailable.length > 0) {
          // Đảm bảo có ít nhất 5 phim
          const finalFallback = allAvailable
            .sort((a, b) => b.hotness - a.hotness)
            .slice(0, 8)
            .map((m) => m.id);
          validRecommendations = finalFallback;
          const genreName = requestedGenre ? (Array.isArray(requestedGenre) ? requestedGenre.join('/') : requestedGenre) : '';
          // Clean message
          jsonResponse.message = (genreName 
            ? `Xin lỗi, hiện tại không có nhiều phim ${genreName} trong hệ thống. Đây là một số phim đang hot:`
            : "Đây là một số phim đang hot trong hệ thống:")
            .replace(/\(?ID:\s*[a-f0-9]{24}\)?/gi, '')
            .replace(/\(?id:\s*[a-f0-9]{24}\)?/gi, '')
            .trim();
        }
      }
    }

    // ✅ Đảm bảo có ít nhất 5 phim nếu user yêu cầu gợi ý phim
    if (isRequestingMovies && validRecommendations.length > 0 && validRecommendations.length < 5) {
      // Bổ sung thêm phim để đủ 5 phim
      let additionalMovies = filteredMoviesContext
        .filter(m => 
          !validRecommendations.includes(m.id) && 
          !previouslyRecommendedIds.includes(m.id) &&
          (!requestedGenre || (requestedGenre && (
            Array.isArray(requestedGenre) 
              ? m.genre && m.genre.some(g => requestedGenre.includes(g))
              : m.genre && m.genre.includes(requestedGenre)
          )))
        )
        .sort((a, b) => b.hotness - a.hotness)
        .slice(0, 5 - validRecommendations.length)
        .map(m => m.id);
      
      validRecommendations = [...validRecommendations, ...additionalMovies].slice(0, 8);
    }

    // ✅ Clean message một lần nữa trước khi return
    if (jsonResponse.message) {
      jsonResponse.message = jsonResponse.message
        .replace(/\(?ID:\s*[a-f0-9]{24}\)?/gi, '')
        .replace(/\(?id:\s*[a-f0-9]{24}\)?/gi, '')
        .replace(/\*\s*\*\*/g, '') // Remove markdown bold
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\s+/g, ' ')
        .trim();
    }

    jsonResponse.recommendedMovieIds = validRecommendations;

    return jsonResponse;
  } catch (error) {
    console.error("AI Service Error:", error);
    
    // Fallback response
    throw new Error("Không thể kết nối với AI service. Vui lòng thử lại sau.");
  }
};

