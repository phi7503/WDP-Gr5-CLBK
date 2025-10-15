// API Base URL (use Vite proxy to avoid CORS)
const API_BASE_URL = '/api';

// Backend server URL for static files (images)
export const BACKEND_URL = 'http://localhost:5000';

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

// Generic API call function
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
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        throw new Error('Unauthorized');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
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
  getUserBookings: () => apiCall('/bookings/user'),
  
  // Get booking by ID
  getBookingById: (id) => apiCall(`/bookings/${id}`),
  
  // Cancel booking
  cancelBooking: (id) => apiCall(`/bookings/${id}/cancel`, {
    method: 'PUT',
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
};
