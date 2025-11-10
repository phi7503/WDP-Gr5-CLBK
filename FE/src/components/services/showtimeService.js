import api from "./api"

export const showtimeService = {
  // CREATE - Add new showtime
  async createShowtime(showtimeData) {
    try {
      console.log("🔄 Creating showtime:", showtimeData)

      // Transform data to match database structure
      const transformedData = {
        movie: showtimeData.movieId,
        branch: showtimeData.branchId,
        theater: showtimeData.theaterId,
        startTime: new Date(`${showtimeData.date}T${showtimeData.time}`).toISOString(),
        endTime:
            showtimeData.endTime || this.calculateEndTime(showtimeData.date, showtimeData.time, showtimeData.duration),
        price: {
          standard: Number(showtimeData.standardPrice),
          vip: Number(showtimeData.vipPrice || 0),
          couple: Number(showtimeData.couplePrice || 0),
        },
        isFirstShow: showtimeData.isFirstShow || false,
        isLastShow: showtimeData.isLastShow || false,
      }
      
      const response = await api.post("/showtimes", transformedData)
      console.log("✅ Showtime created successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error creating showtime:", error)
      throw new Error(error.response?.data?.message || "Failed to create showtime")
    }
  },

  // READ - Get all showtimes with advanced filtering
  async getShowtimes(params = {}) {
    try {
      console.log("🔄 Fetching showtimes with params:", params)

      // Build query parameters for advanced filtering
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 50,
        sort: params.sort || "-createdAt",
        populate: "movie,branch,theater",
        ...params,
      }

      const response = await api.get("/showtimes", { params: queryParams })
      console.log("✅ Showtimes fetched successfully:", response.data)

      // Ensure consistent data structure
      const result = {
        showtimes: response.data.showtimes || response.data.data || response.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        hasNext: response.data.hasNext || false,
        hasPrev: response.data.hasPrev || false,
      }

      return result
    } catch (error) {
      console.error("❌ Error fetching showtimes:", error)
      throw new Error("Failed to fetch showtimes")
    }
  },

  // READ - Get single showtime by ID with full details
  async getShowtimeById(id) {
    try {
      console.log("🔄 Fetching showtime by ID:", id)

      const response = await api.get(`/showtimes/${id}`, {
        params: { populate: "movie,branch,theater" },
      })

      console.log("✅ Showtime fetched successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error fetching showtime:", error)
      throw new Error("Failed to fetch showtime details")
    }
  },

  // UPDATE - Update existing showtime
  async updateShowtime(id, showtimeData) {
    try {
      console.log("🔄 Updating showtime:", id, showtimeData)

      // Transform data similar to create
      const transformedData = {
        movie: showtimeData.movieId,
        branch: showtimeData.branchId,
        theater: showtimeData.theaterId,
        startTime: new Date(`${showtimeData.date}T${showtimeData.time}`).toISOString(),
        endTime:
            showtimeData.endTime || this.calculateEndTime(showtimeData.date, showtimeData.time, showtimeData.duration),
        price: {
          standard: Number(showtimeData.standardPrice),
          vip: Number(showtimeData.vipPrice || 0),
          couple: Number(showtimeData.couplePrice || 0),
        },
        isFirstShow: showtimeData.isFirstShow || false,
        isLastShow: showtimeData.isLastShow || false,
      }

      const response = await api.put(`/showtimes/${id}`, transformedData)
      console.log("✅ Showtime updated successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error updating showtime:", error)
      throw new Error(error.response?.data?.message || "Failed to update showtime")
    }
  },

  // DELETE - Delete single showtime
  async deleteShowtime(id) {
    try {
      console.log("🔄 Deleting showtime:", id)

      await api.delete(`/showtimes/${id}`)
      console.log("✅ Showtime deleted successfully")
      return { success: true, message: "Showtime deleted successfully" }
    } catch (error) {
      console.error("❌ Error deleting showtime:", error)
      throw new Error(error.response?.data?.message || "Failed to delete showtime")
    }
  },

// Modify the bulkDeleteShowtimes function in showtimeService.js
  async bulkDeleteShowtimes(ids) {
    try {
      console.log("🔄 Bulk deleting showtimes:", ids)

      // Match the backend API endpoint structure
      const response = await api.delete("/showtimes/bulk", {
        data: { ids } // Pass ids array in request body
      })

      console.log("✅ Showtimes bulk deleted successfully")
      return {
        success: true,
        deletedCount: response.data.deletedCount,
        message: `Successfully deleted ${response.data.deletedCount} showtimes`
      }
    } catch (error) {
      console.error("❌ Error bulk deleting showtimes:", error)
      // Include the specific error message from the backend
      throw new Error(error.response?.data?.message || "Failed to delete selected showtimes")
    }
  },

  // READ - Get showtime statistics for dashboard
  async getShowtimeStats(params = {}) {
    try {
      console.log("🔄 Fetching showtime statistics")

      const response = await api.get("/showtimes/stats", { params })
      console.log("✅ Statistics fetched successfully:", response.data)

      return {
        total: response.data.total || 0,
        today: response.data.today || 0,
        thisWeek: response.data.thisWeek || 0,
        thisMonth: response.data.thisMonth || 0,
        branches: response.data.branches || 0,
        movies: response.data.movies || 0,
        theaters: response.data.theaters || 0,
        revenue: response.data.revenue || 0,
        occupancyRate: response.data.occupancyRate || 0,
        ...response.data,
      }
    } catch (error) {
      console.error("❌ Error fetching statistics:", error)
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        branches: 0,
        movies: 0,
        theaters: 0,
        revenue: 0,
        occupancyRate: 0,
      }
    }
  },

  // READ - Search showtimes with advanced filters
  async searchShowtimes(searchParams) {
    try {
      console.log("🔄 Searching showtimes:", searchParams)

      const params = {
        search: searchParams.query,
        movie: searchParams.movieId,
        branch: searchParams.branchId,
        theater: searchParams.theaterId,
        dateFrom: searchParams.dateFrom,
        dateTo: searchParams.dateTo,
        isFirstShow: searchParams.isFirstShow,
        isLastShow: searchParams.isLastShow,
        page: searchParams.page || 1,
        limit: searchParams.limit || 50,
        sort: searchParams.sort || "-startTime",
      }

      return await this.getShowtimes(params)
    } catch (error) {
      console.error("❌ Error searching showtimes:", error)
      throw new Error("Failed to search showtimes")
    }
  },

  // Helper function to calculate end time
  calculateEndTime(date, time, duration = 120) {
    const startDateTime = new Date(`${date}T${time}`)
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000) // duration in minutes
    return endDateTime.toISOString()
  },

  // Utility function to validate showtime data
  validateShowtimeData(data) {
    const errors = {}

    if (!data.movieId) errors.movieId = "Movie is required"
    if (!data.branchId) errors.branchId = "Branch is required"
    if (!data.theaterId) errors.theaterId = "Theater is required"
    if (!data.date) errors.date = "Date is required"
    if (!data.time) errors.time = "Time is required"
    if (!data.standardPrice || data.standardPrice <= 0) errors.standardPrice = "Valid standard price is required"

    // Date validation
    if (data.date) {
      const selectedDate = new Date(data.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        errors.date = "Date cannot be in the past"
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  },

  // Real-time updates subscription
  subscribeToShowtimeUpdates(callback) {
    console.log("🔄 Setting up real-time showtime updates")

    const interval = setInterval(async () => {
      try {
        const data = await this.getShowtimes({ limit: 10, sort: "-updatedAt" })
        callback(data)
      } catch (error) {
        console.error("❌ Error in real-time update:", error)
      }
    }, 30000) // Poll every 30 seconds

    return () => {
      console.log("🛑 Stopping real-time showtime updates")
      clearInterval(interval)
    }
  },
}

// Movie service for fetching movies
export const movieService = {
  async getMovies(params = {}) {
    try {
      console.log("🔄 Fetching movies with params:", params);

      // Handle status array if provided
      if (params.status && Array.isArray(params.status)) {
        params.status = params.status.join(',');
      }

      const response = await api.get("/movies", { params });
      console.log("✅ Movies fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching movies:", error);
      throw new Error("Failed to fetch movies");
    }
  },
}

// Branch service for fetching branches
export const branchService = {
  async getBranches(params = {}) {
    try {
      console.log("🔄 Fetching branches with params:", params)
      const response = await api.get("/branches", { params })
      console.log("✅ Branches fetched successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error fetching branches:", error)
    }
  },
}

// Theater service for fetching theaters - FIXED to use correct API endpoint
export const theaterService = {
  async getTheaters(branchId = null) {
    try {
      if (!branchId) {
        console.log("⚠️ No branchId provided for theater fetch")
        return { theaters: [] }
      }

      console.log("🔄 Fetching theaters for branch:", branchId)

      // Use the correct API endpoint format: /api/theaters/branch/{branchId}
      const response = await api.get(`/theaters/branch/${branchId}`)
      console.log("✅ Theaters fetched successfully:", response.data)

      // Handle different response structures
      const theaters = response.data.theaters || response.data.data || response.data || []

      return {
        theaters: Array.isArray(theaters) ? theaters : [],
        success: true,
      }
    } catch (error) {
      console.error("❌ Error fetching theaters for branch:", branchId, error)

      // Check if it's a 404 or no theaters found
      if (error.response?.status === 404) {
        console.log("ℹ️ No theaters found for branch:", branchId)
        return { theaters: [], message: "No theaters found for this branch" }
      }

      // For other errors, throw to be handled by the component
      throw new Error(error.response?.data?.message || `Failed to load theaters for branch ${branchId}`)
    }
  },

  async getTheaters1(branchId = null) {
    try {
      if (!branchId) {
        console.log("⚠️ No branchId provided for theater fetch")
        return { theaters: [] }
      }

      console.log("🔄 Fetching theaters for branch:", branchId)

      // Use the correct API endpoint format: /api/theaters/branch/{branchId}
      const response = await api.get(`/theaters/branch1/${branchId}`)
      console.log("✅ Theaters fetched successfully:", response.data)

      // Handle different response structures
      const theaters = response.data.theaters || response.data.data || response.data || []

      return {
        theaters: Array.isArray(theaters) ? theaters : [],
        success: true,
      }
    } catch (error) {
      console.error("❌ Error fetching theaters for branch:", branchId, error)

      // Check if it's a 404 or no theaters found
      if (error.response?.status === 404) {
        console.log("ℹ️ No theaters found for branch:", branchId)
        return { theaters: [], message: "No theaters found for this branch" }
      }

      // For other errors, throw to be handled by the component
      throw new Error(error.response?.data?.message || `Failed to load theaters for branch ${branchId}`)
    }
  },

  // Alternative method to get all theaters and filter by branch (fallback)
  async getAllTheaters(params = {}) {
    try {
      console.log("🔄 Fetching all theaters with params:", params)
      const response = await api.get("/theaters", { params })
      console.log("✅ All theaters fetched successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error fetching all theaters:", error)
      throw new Error("Failed to fetch theaters")
    }
  },

  // Get theater by ID
  async getTheaterById(theaterId) {
    try {
      console.log("🔄 Fetching theater by ID:", theaterId)
      const response = await api.get(`/theaters/${theaterId}`)
      console.log("✅ Theater fetched successfully:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error fetching theater:", error)
      throw new Error("Failed to fetch theater details")
    }
  },
}