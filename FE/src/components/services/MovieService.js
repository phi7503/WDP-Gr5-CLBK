import api from "./api";

export const movieService = {
  async getMovies(params = {}) {
    const response = await api.get("/movies", { params });
    return response.data;
  },

  async getMovieById(id) {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  async createMovie(movieData) {
    // Chỉ cần gọi api.post, interceptor sẽ tự động lo phần còn lại
    const response = await api.post("/movies", movieData);
    return response.data;
  },

  async updateMovie(id, movieData) {
    const response = await api.put(`/movies/${id}`, movieData);
    return response.data;
  },

  async deleteMovie(id) {
    await api.delete(`/movies/${id}`);
  },

  async getRecommendedMovies() {
    const response = await api.get("/movies/recommended");
    return response.data;
  },

  async getTrendingMovies(limit = 5) {
    const response = await api.get("/movies/trending", { params: { limit } });
    return response.data;
  },

  async updateMovieHotness() {
    const response = await api.put("/movies/update-hotness");
    return response.data;
  },
};

export const getAllMovies = async () => {
    const { data } = await api.get(`/movies/all`);
    return data;
};