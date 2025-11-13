// API Base URL (use Vite proxy to avoid CORS)
const API_BASE_URL = '/api';

// Backend server URL for static files (images)
export const BACKEND_URL = 'http://localhost:5000';

// Import notification service để hiển thị lỗi tự động
import { showErrorNotification } from './notificationService.js';

// Helper to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  // If already full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // If path starts with /, remove it
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BACKEND_URL}/${cleanPath}`;
};

// Generic API call function với tự động hiển thị lỗi
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Kiểm tra xem có token không để phân biệt:
        // - Có token + 401 = token expired => redirect
        // - Không có token + 401 = login sai => hiển thị notification
        const token = localStorage.getItem('token');
        if (token) {
          // Token expired - redirect về auth
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
          throw new Error('Unauthorized - Token expired');
        }
        // Nếu không có token, để xử lý như lỗi thông thường (hiển thị notification)
      }
      
      // Try to parse error message from response - Parse tất cả các field có thể
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData = null;
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (isJson) {
        try {
          // Đọc response body
          const text = await response.text();
          if (text) {
            errorData = JSON.parse(text);
            
            // ✅ Parse tất cả các field có thể từ backend:
            // - message (phổ biến nhất)
            // - error
            // - warning
            // - desc (description từ PayOS)
            // - errorMessage
            // - msg
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.warning) {
              errorMessage = errorData.warning;
            } else if (errorData.desc) {
              errorMessage = errorData.desc;
            } else if (errorData.errorMessage) {
              errorMessage = errorData.errorMessage;
            } else if (errorData.msg) {
              errorMessage = errorData.msg;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
      } else {
        // Nếu không phải JSON, thử đọc text
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          } else {
            errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
          }
        } catch (textError) {
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
      }
      
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        data: errorData
      });
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    // Parse response JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        // Empty response - return null or empty object
        return null;
      }
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Không thể đọc phản hồi từ server');
      }
    } else {
      // Non-JSON response
      const text = await response.text();
      return text || null;
    }
  } catch (error) {
    console.error('API call failed:', error);
    
    // ✅ Tự động hiển thị error notification
    // Chỉ hiển thị nếu không phải là 401 với token expired (đã redirect)
    const isUnauthorizedRedirect = error.message === 'Unauthorized - Token expired';
    
    if (!isUnauthorizedRedirect) {
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      
      // ✅ Parse tất cả các field có thể từ error object:
      // 1. Từ error.message (đã được parse từ response)
      if (error.message && 
          error.message !== 'API call failed:' && 
          error.message !== 'Unauthorized' &&
          !error.message.includes('HTTP error!')) {
        errorMessage = error.message;
      } 
      // 2. Từ error.data (response body từ backend)
      else if (error.data) {
        if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (error.data.warning) {
          errorMessage = error.data.warning;
        } else if (error.data.desc) {
          errorMessage = error.data.desc;
        } else if (error.data.errorMessage) {
          errorMessage = error.data.errorMessage;
        } else if (error.data.msg) {
          errorMessage = error.data.msg;
        }
      } 
      // 3. Fallback cho 401 (login sai)
      else if (error.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
      }
      
      // Hiển thị notification bằng notificationService
      showErrorNotification(errorMessage);
    }
    
    throw error;
  }
};

// Helper to build query string from params
const buildQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  const qs = new URLSearchParams(entries).toString();
  return `?${qs}`;
};

// Movie API calls
export const movieAPI = {
  // Get all movies
  getMovies: (params) => apiCall(`/movies${buildQuery(params)}`),
  
  // Get trending movies
  getTrendingMovies: () => apiCall('/movies/trending'),
  
  // Get movie by ID
  getMovieById: (id) => apiCall(`/movies/${id}`),
  
  // Get recommended movies
  getRecommendedMovies: () => apiCall(`/movies/recommended`),
  
  // Create movie (admin only)
  createMovie: (movieData) => apiCall('/movies', {
    method: 'POST',
    body: JSON.stringify(movieData),
  }),
  
  // Update movie (admin only)
  updateMovie: (id, movieData) => apiCall(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(movieData),
  }),
  
  // Delete movie (admin only)
  deleteMovie: (id) => apiCall(`/movies/${id}`, {
    method: 'DELETE',
  }),
};

// Showtime API calls
export const showtimeAPI = {
  // Get all showtimes with filters
  getShowtimes: (params) => apiCall(`/showtimes${buildQuery(params)}`),
  
  // Get showtimes by movie
  getShowtimesByMovie: (movieId, params) => apiCall(`/showtimes?movie=${movieId}${buildQuery(params) ? '&' + buildQuery(params).slice(1) : ''}`),
  
  // Get showtimes by branch
  getShowtimesByBranch: (branchId, params) => apiCall(`/showtimes?branch=${branchId}${buildQuery(params) ? '&' + buildQuery(params).slice(1) : ''}`),
  
  // Get showtimes by date
  getShowtimesByDate: (date, params) => apiCall(`/showtimes?date=${date}${buildQuery(params) ? '&' + buildQuery(params).slice(1) : ''}`),
  
  // Get showtime by ID
  getShowtimeById: (id) => apiCall(`/showtimes/${id}`),
  
  // Get showtime stats
  getShowtimeStats: () => apiCall('/showtimes/stats'),
  
  // Create showtime (admin only)
  createShowtime: (showtimeData) => apiCall('/showtimes', {
    method: 'POST',
    body: JSON.stringify(showtimeData),
  }),
  
  // Update showtime (admin only)
  updateShowtime: (id, showtimeData) => apiCall(`/showtimes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(showtimeData),
  }),
  
  // Delete showtime (admin only)
  deleteShowtime: (id) => apiCall(`/showtimes/${id}`, {
    method: 'DELETE',
  }),
};

// Seat API calls
export const seatAPI = {
  // Get seat layouts
  getSeatLayouts: () => apiCall('/seats/layouts'),
  
  // Get seat layout by ID
  getSeatLayoutById: (id) => apiCall(`/seats/layouts/${id}`),
  
  // Get seats by theater
  getSeatsByTheater: (theaterId) => apiCall(`/seats/theater/${theaterId}`),
  
  // Get seat availability
  getSeatAvailability: (showtimeId) => apiCall(`/seats/availability/${showtimeId}`),
};

// Seat Status API calls
export const seatStatusAPI = {
  // Reserve seats
  reserveSeats: (seatData) => apiCall('/seat-status/reserve', {
    method: 'POST',
    body: JSON.stringify(seatData),
  }),
  
  // Release reserved seats
  releaseReservedSeats: (seatData) => apiCall('/seat-status/release', {
    method: 'POST',
    body: JSON.stringify(seatData),
  }),
  
  // Book seats
  bookSeats: (seatData) => apiCall('/seat-status/book', {
    method: 'POST',
    body: JSON.stringify(seatData),
  }),
  
  // Get seat statuses by showtime
  getSeatStatusByShowtime: (showtimeId) => apiCall(`/seat-status/${showtimeId}`),
};

// Branch API calls
export const branchAPI = {
  // Get all branches
  getBranches: (params) => apiCall(`/branches${buildQuery(params)}`),
  
  // Get branches grouped by cinema chain
  getBranchesGrouped: () => apiCall('/branches?groupByChain=true'),
  
  // Get branch by ID
  getBranchById: (id) => apiCall(`/branches/${id}`),
};

// Theater API calls
export const theaterAPI = {
  // Get all theaters
  getTheaters: () => apiCall('/theaters'),
  
  // Get theater by ID
  getTheaterById: (id) => apiCall(`/theaters/${id}`),
};

// Auth API calls
export const authAPI = {
  // Login
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  // Register
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // Get current user
  getCurrentUser: () => apiCall('/auth/me'),
  
  // Logout
  logout: () => apiCall('/auth/logout', {
    method: 'POST',
  }),
};

// User API calls
export const userAPI = {
  // Get all users (admin only)
  getUsers: () => apiCall('/users'),
  
  // Get user by ID (admin only)
  getUserById: (id) => apiCall(`/users/${id}`),
  
  // Create user (admin only)
  createUser: (userData) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // Update user (admin only)
  updateUser: (id, userData) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};

// Booking API calls
export const bookingAPI = {
  // Create booking
  createBooking: (bookingData) => apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),
  
  // Get user bookings
  getUserBookings: () => apiCall('/bookings/my-bookings'),
  
  // Get booking by ID
  getBookingById: (id) => apiCall(`/bookings/${id}`),
  
  // Cancel booking
  cancelBooking: (id) => apiCall(`/bookings/${id}/cancel`, {
    method: 'PUT',
  }),
  
  // Resend email with QR code
  resendEmailQRCode: (id) => apiCall(`/bookings/${id}/resend-email`, {
    method: 'POST',
  }),
};

// PayOS API calls
export const payOSAPI = {
  // Create payment link from booking ID
  createPaymentFromBooking: (bookingId) => apiCall(`/payos/create-from-booking/${bookingId}`, {
    method: 'POST',
  }),
  
  // Get payment status
  getPaymentStatus: (orderCode) => apiCall(`/payos/status/${orderCode}`),

  // Check and update payment status from PayOS
  checkAndUpdatePayment: (bookingId) => apiCall(`/payos/check-and-update/${bookingId}`, {
    method: 'POST',
  }),

  // Update payment status from PayOS redirect URL (when cannot connect to PayOS API)
  updatePaymentFromRedirect: (bookingId, params) => apiCall(`/payos/update-from-redirect/${bookingId}`, {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  // Cancel payment and release seats
  cancelPayment: (bookingId, status, orderCode) => apiCall(`/payos/cancel-booking/${bookingId}`, {
    method: 'POST',
    body: JSON.stringify({ status, orderCode }),
  }),
};

// Combo API calls
export const comboAPI = {
  // Get all active combos
  getCombos: () => apiCall('/combos'),
  
  // Get combo by ID
  getComboById: (id) => apiCall(`/combos/${id}`),
  
  // Get admin combos (admin only)
  getAdminCombos: () => apiCall('/combos/admin'),
  
  // Create combo (admin only)
  createCombo: (comboData) => apiCall('/combos', {
    method: 'POST',
    body: JSON.stringify(comboData),
  }),
  
  // Update combo (admin only)
  updateCombo: (id, comboData) => apiCall(`/combos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(comboData),
  }),
  
  // Delete combo (admin only)
  deleteCombo: (id) => apiCall(`/combos/${id}`, {
    method: 'DELETE',
  }),
};

// Voucher API calls
export const voucherAPI = {
  // Get vouchers (admin only)
  getVouchers: () => apiCall('/vouchers'),
  
  // Get voucher by ID (admin only)
  getVoucherById: (id) => apiCall(`/vouchers/${id}`),
  
  // Get voucher by code
  getVoucherByCode: (code) => apiCall(`/vouchers/code/${code}`),
  
  // Create voucher (admin only)
  createVoucher: (voucherData) => apiCall('/vouchers', {
    method: 'POST',
    body: JSON.stringify(voucherData),
  }),
  
  // Update voucher (admin only)
  updateVoucher: (id, voucherData) => apiCall(`/vouchers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(voucherData),
  }),
  
  // Delete voucher (admin only)
  deleteVoucher: (id) => apiCall(`/vouchers/${id}`, {
    method: 'DELETE',
  }),
};

// Chat API calls
export const chatAPI = {
  // Send message to chatbot
  sendMessage: (data) => apiCall('/chat/message', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Get chat history by session ID
  getHistory: (sessionId) => apiCall(`/chat/history/${sessionId}`),
  
  // Clear chat history
  clearHistory: (sessionId) => apiCall(`/chat/history/${sessionId}`, {
    method: 'DELETE',
  }),
};

export default {
  movieAPI,
  showtimeAPI,
  seatAPI,
  seatStatusAPI,
  branchAPI,
  theaterAPI,
  authAPI,
  userAPI,
  bookingAPI,
  comboAPI,
  voucherAPI,
  chatAPI,
};
