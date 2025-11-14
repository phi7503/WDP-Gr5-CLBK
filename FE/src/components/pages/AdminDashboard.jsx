import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query"; // Tạm comment để xem UI
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Ticket,
  ShoppingCart,
  Filter,
  ChevronDown,
  FileDown,
  FileText,
} from "lucide-react";
import api from "../../lib/axios";

export default function AdminDashboard() {
  const [period, setPeriod] = useState("week");
  const [selectedDate, setSelectedDate] = useState("");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [selectedMovie, setSelectedMovie] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [showFilters, setShowFilters] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    period: "week",
    selectedDate: "",
    customRange: { from: "", to: "" },
    selectedMovie: "all",
    selectedBranch: "all",
  });

  // Mock movies and branches
  const movies = [
    { id: "all", name: "Tất cả phim" },
    { id: "movie1", name: "Avengers: Endgame" },
    { id: "movie2", name: "Inception" },
    { id: "movie3", name: "The Dark Knight" },
  ];

  const branches = [
    { id: "all", name: "Tất cả chi nhánh" },
    { id: "branch1", name: "CGV Vincom" },
    { id: "branch2", name: "CGV Aeon Mall" },
    { id: "branch3", name: "CGV Landmark" },
  ];

  const handleApplyFilters = () => {
    setAppliedFilters({
      period,
      selectedDate,
      customRange,
      selectedMovie,
      selectedBranch,
    });
  };

  const handleResetFilters = () => {
    setPeriod("week");
    setSelectedDate("");
    setCustomRange({ from: "", to: "" });
    setSelectedMovie("all");
    setSelectedBranch("all");
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard-stats", appliedFilters],
    queryFn: async () => {
      const params = {
        period: appliedFilters.period,
        ...(appliedFilters.selectedDate && {
          date: appliedFilters.selectedDate,
        }),
        ...(appliedFilters.customRange.from && {
          from: appliedFilters.customRange.from,
        }),
        ...(appliedFilters.customRange.to && {
          to: appliedFilters.customRange.to,
        }),
        ...(appliedFilters.selectedMovie !== "all" && {
          movieId: appliedFilters.selectedMovie,
        }),
        ...(appliedFilters.selectedBranch !== "all" && {
          branchId: appliedFilters.selectedBranch,
        }),
      };

      // dùng axios đúng cách
      const res = await api.get("/admin-dashboard/stats", {
        params,
        withCredentials: true, // thay cho credentials: "include"
      });

      return res.data; // axios trả res.data là JSON
    },
  });

  console.log(data);
  // Format currency to VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date to DD/MM
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  // Get chart data based on selected metric
  const getChartData = () => {
    if (!data?.dailyStats) return [];
    return data.dailyStats.map((stat) => ({
      date: formatDate(stat.date),
      value: stat[selectedMetric],
    }));
  };
  useEffect(() => {
    handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Get metric label and color
  const getMetricConfig = () => {
    const configs = {
      revenue: { label: "Doanh thu", color: "#ef4444", format: formatVND },
      tickets: {
        label: "Số vé",
        color: "#f59e0b",
        format: (val) => val.toLocaleString(),
      },
      bookings: {
        label: "Số đơn",
        color: "#10b981",
        format: (val) => val.toLocaleString(),
      },
    };
    return configs[selectedMetric];
  };

  const metricConfig = getMetricConfig();

  const exportToCSV = () => {
    if (!data?.dailyStats) return;

    const headers = ["Ngày", "Doanh thu (VND)", "Số vé", "Số đơn"];
    const rows = data.dailyStats.map((stat) => [
      new Date(stat.date).toLocaleDateString("vi-VN"),
      stat.revenue,
      stat.tickets,
      stat.bookings,
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `admin-dashboard-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!data?.dailyStats) return;

    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(
      "<html><head><title>Admin Dashboard Report</title>"
    );
    printWindow.document.write("<style>");
    printWindow.document.write(
      "body { font-family: Arial, sans-serif; padding: 20px; }"
    );
    printWindow.document.write("h1 { color: #dc2626; }");
    printWindow.document.write(
      "table { width: 100%; border-collapse: collapse; margin-top: 20px; }"
    );
    printWindow.document.write(
      "th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }"
    );
    printWindow.document.write(
      "th { background-color: #dc2626; color: white; }"
    );
    printWindow.document.write(
      ".summary { margin: 20px 0; padding: 15px; background-color: #f3f4f6; }"
    );
    printWindow.document.write(".summary-item { margin: 10px 0; }");
    printWindow.document.write("</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write("<h1>Báo cáo Admin Dashboard</h1>");
    printWindow.document.write(
      `<p>Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}</p>`
    );

    printWindow.document.write('<div class="summary">');
    printWindow.document.write("<h2>Tổng quan</h2>");
    printWindow.document.write(
      `<div class="summary-item"><strong>Tổng doanh thu:</strong> ${formatVND(
        data.totalRevenue
      )}</div>`
    );
    printWindow.document.write(
      `<div class="summary-item"><strong>Tổng số vé:</strong> ${data.totalTickets.toLocaleString()}</div>`
    );
    printWindow.document.write(
      `<div class="summary-item"><strong>Tổng số đơn:</strong> ${data.totalBookings.toLocaleString()}</div>`
    );
    printWindow.document.write("</div>");

    printWindow.document.write("<h2>Chi tiết theo ngày</h2>");
    printWindow.document.write("<table>");
    printWindow.document.write(
      "<thead><tr><th>Ngày</th><th>Doanh thu</th><th>Số vé</th><th>Số đơn</th></tr></thead>"
    );
    printWindow.document.write("<tbody>");

    data.dailyStats.forEach((stat) => {
      printWindow.document.write("<tr>");
      printWindow.document.write(
        `<td>${new Date(stat.date).toLocaleDateString("vi-VN")}</td>`
      );
      printWindow.document.write(`<td>${formatVND(stat.revenue)}</td>`);
      printWindow.document.write(`<td>${stat.tickets.toLocaleString()}</td>`);
      printWindow.document.write(`<td>${stat.bookings.toLocaleString()}</td>`);
      printWindow.document.write("</tr>");
    });

    printWindow.document.write("</tbody></table>");
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Thống kê doanh thu và vé bán</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5 text-red-600" />
              Bộ lọc
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <div
            className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            {/* Time Period Filter */}
            <div className="border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Thời gian
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Period Selector */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Khoảng thời gian
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPeriod("week")}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        period === "week"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      Tuần
                    </button>
                    <button
                      onClick={() => setPeriod("month")}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        period === "month"
                          ? "bg-red-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      Tháng
                    </button>
                  </div>
                </div>

                {/* Custom Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">
                    Khoảng tùy chỉnh
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customRange.from}
                      onChange={(e) =>
                        setCustomRange({ ...customRange, from: e.target.value })
                      }
                      placeholder="Từ ngày"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                    <input
                      type="date"
                      value={customRange.to}
                      onChange={(e) =>
                        setCustomRange({ ...customRange, to: e.target.value })
                      }
                      placeholder="Đến ngày"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Movie and Branch Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Movie Filter */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Phim
                </h3>
                <select
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {movies.map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Filter */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Chi nhánh
                </h3>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div
            className={`flex gap-3 mt-4 ${
              showFilters ? "flex" : "hidden lg:flex"
            }`}
          >
            <button
              onClick={handleApplyFilters}
              className="flex-1 md:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Áp dụng bộ lọc
            </button>
            <button
              onClick={handleResetFilters}
              className="flex-1 md:flex-none px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Đặt lại
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-800 animate-pulse"
                >
                  <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-800 rounded"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">
              Lỗi tải dữ liệu
            </h3>
            <p className="text-gray-400">
              {error?.message || "Không thể tải dữ liệu dashboard"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          !isError &&
          (!data?.dailyStats || data.dailyStats.length === 0) && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
              <div className="text-gray-600 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Không có dữ liệu
              </h3>
              <p className="text-gray-500">
                Không tìm thấy dữ liệu cho khoảng thời gian đã chọn
              </p>
            </div>
          )}

        {/* Dashboard Content */}
        {!isLoading &&
          !isError &&
          data &&
          data.dailyStats &&
          data.dailyStats.length > 0 && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-red-900/50 to-gray-900 rounded-lg p-6 border border-red-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-600 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">Tổng</span>
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">Doanh thu</h3>
                  <p className="text-2xl font-bold text-white">
                    {formatVND(data.totalRevenue)}
                  </p>
                </div>

                {/* Total Tickets */}
                <div className="bg-gradient-to-br from-orange-900/50 to-gray-900 rounded-lg p-6 border border-orange-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-600 rounded-lg">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">Tổng</span>
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">Số vé bán</h3>
                  <p className="text-2xl font-bold text-white">
                    {data.totalTickets.toLocaleString()}
                  </p>
                </div>

                {/* Total Bookings */}
                <div className="bg-gradient-to-br from-green-900/50 to-gray-900 rounded-lg p-6 border border-green-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">Tổng</span>
                  </div>
                  <h3 className="text-sm text-gray-400 mb-1">Số đơn đặt</h3>
                  <p className="text-2xl font-bold text-white">
                    {data.totalBookings.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-xl font-semibold">Biểu đồ thống kê</h2>

                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Export Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Xuất CSV
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        Xuất PDF
                      </button>
                    </div>

                    {/* Metric Toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMetric("revenue")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedMetric === "revenue"
                            ? "bg-red-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        Doanh thu
                      </button>
                      <button
                        onClick={() => setSelectedMetric("tickets")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedMetric === "tickets"
                            ? "bg-orange-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        Số vé
                      </button>
                      <button
                        onClick={() => setSelectedMetric("bookings")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedMetric === "bookings"
                            ? "bg-green-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        Số đơn
                      </button>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(value) => {
                        if (selectedMetric === "revenue") {
                          return `${(value / 1000000).toFixed(0)}M`;
                        }
                        return value.toLocaleString();
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value) => [
                        metricConfig.format(value),
                        metricConfig.label,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ color: "#9ca3af" }}
                      formatter={() => metricConfig.label}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={metricConfig.color}
                      strokeWidth={3}
                      dot={{ fill: metricConfig.color, r: 4 }}
                      activeDot={{ r: 6 }}
                      name={metricConfig.label}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Query Info */}
                {data.query && (
                  <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
                    <p>
                      Hiển thị dữ liệu từ {formatDate(data.query.startDate)} đến{" "}
                      {formatDate(data.query.endDate)} (
                      {data.query.period === "week" ? "Tuần" : "Tháng"})
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
}
