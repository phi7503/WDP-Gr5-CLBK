import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Ticket,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../lib/axios";
import EmployeeDashoboardPage from"./EmployeeDashoboardPage"
export default function EmployeeDashboardPage() {
  const [dateRange, setDateRange] = useState("week");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Gọi API giống admin dashboard
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employee-dashboard-stats", { dateRange }],
    queryFn: async () => {
      const now = new Date();
      const params = {};

      if (dateRange === "today") {
        const d = now.toISOString().slice(0, 10);
        params.from = d;
        params.to = d;
      } else if (dateRange === "week" || dateRange === "month") {
        params.period = dateRange; // BE đang hỗ trợ "week" và "month"
      } else if (dateRange === "year") {
        const yearStart = new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .slice(0, 10);
        const today = now.toISOString().slice(0, 10);
        params.from = yearStart;
        params.to = today;
      }

      const res = await api.get("/employee-dashboard/stats", {
        params,
        withCredentials: true,
      });

      return res.data; // { salesData, query }
    },
  });

  const salesData = data?.salesData || [];

  // Tính tổng
  const totalTicketsSold = salesData.reduce(
    (sum, record) => sum + record.ticketsSold,
    0
  );
  const totalTicketRevenue = salesData.reduce(
    (sum, record) => sum + record.ticketRevenue,
    0
  );
  const totalCombosSold = salesData.reduce(
    (sum, record) => sum + record.combosSold,
    0
  );
  const totalComboRevenue = salesData.reduce(
    (sum, record) => sum + record.comboRevenue,
    0
  );
  const totalRevenue = salesData.reduce(
    (sum, record) => sum + record.totalRevenue,
    0
  );

  // Pagination
  const totalPages = Math.ceil(salesData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = salesData.slice(startIndex, startIndex + itemsPerPage);

  // Chart data
  const chartData = salesData.reduce((acc, record) => {
    const existing = acc.find((item) => item.date === record.date);
    if (existing) {
      existing.revenue += record.totalRevenue;
    } else {
      acc.push({ date: record.date, revenue: record.totalRevenue });
    }
    return acc;
  }, []);

  const maxRevenue =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.revenue))
      : 0;

  // Loading / Error / Empty
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
        Lỗi tải dashboard nhân viên: {error?.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard Nhân Viên
            </h1>
            <p className="text-gray-400">
              Theo dõi doanh số bán hàng của bạn
            </p>
            {data?.query && (
              <p className="text-xs text-gray-500 mt-1">
                Hiển thị từ {data.query.startDate} đến {data.query.endDate}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Range Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 pr-8 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm này</option>
              </select>
            </div>

            {/* Export Buttons */}
            <ExportButtons salesData={salesData} />
          </div>
        </div>

        {/* Nếu không có dữ liệu */}
        {salesData.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-10 text-center text-gray-400">
            <EmployeeDashoboardPage/>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SalesStats
                icon={Ticket}
                title="Vé đã bán"
                value={totalTicketsSold.toString()}
                subtitle={`${totalTicketRevenue.toLocaleString("vi-VN")} đ`}
              />
              <SalesStats
                icon={ShoppingBag}
                title="Combo đã bán"
                value={totalCombosSold.toString()}
                subtitle={`${totalComboRevenue.toLocaleString("vi-VN")} đ`}
              />
              <SalesStats
                icon={TrendingUp}
                title="Tổng doanh thu"
                value={`${totalRevenue.toLocaleString("vi-VN")} đ`}
                subtitle="Tất cả sản phẩm"
              />
              <SalesStats
                icon={Download}
                title="Giao dịch"
                value={salesData.length.toString()}
                subtitle="Tổng số đơn hàng"
              />
            </div>

            {/* Sales Chart */}
            <div className="mb-8">
              <SalesChart chartData={chartData} maxRevenue={maxRevenue} />
            </div>

            {/* Sales Table */}
            <SalesTable salesData={paginatedData} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Trước
                </button>
                <span className="text-gray-400">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SalesStats({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-red-800 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-red-900/30 rounded-xl">
          <Icon className="w-6 h-6 text-red-400" />
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function SalesChart({ chartData, maxRevenue }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold text-white mb-6">
        Doanh Thu Theo Ngày
      </h2>
      <div className="h-64 flex items-end justify-between gap-4">
        {chartData.map((data, index) => {
          const height =
            maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full bg-gray-800 rounded-t-lg overflow-hidden relative group">
                <div
                  className="bg-gradient-to-t from-red-600 to-red-400 transition-all duration-500 hover:from-red-500 hover:to-red-300"
                  style={{ height: `${height}%`, minHeight: "20px" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-white">
                      {data.revenue.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(data.date).getDate()}/
                {new Date(data.date).getMonth() + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SalesTable({ salesData }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Chi Tiết Giao Dịch</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Phim
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Vé bán
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Doanh thu vé
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Combo bán
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Doanh thu combo
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tổng doanh thu
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {salesData.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{record.date}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">
                    {record.movieTitle}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-300">
                    {record.ticketsSold}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-300">
                    {record.ticketRevenue.toLocaleString("vi-VN")} đ
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-300">
                    {record.combosSold}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-300">
                    {record.comboRevenue.toLocaleString("vi-VN")} đ
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-semibold text-red-400">
                    {record.totalRevenue.toLocaleString("vi-VN")} đ
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportButtons({ salesData }) {
  const exportToCSV = () => {
    const headers = [
      "Ngày",
      "Phim",
      "Vé bán",
      "Doanh thu vé",
      "Combo bán",
      "Doanh thu combo",
      "Tổng doanh thu",
    ];
    const rows = salesData.map((record) => [
      record.date,
      record.movieTitle,
      record.ticketsSold,
      record.ticketRevenue,
      record.combosSold,
      record.comboRevenue,
      record.totalRevenue,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `doanh-so-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
      >
        <FileSpreadsheet className="w-5 h-5" />
        <span className="hidden sm:inline">CSV</span>
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
      >
        <FileText className="w-5 h-5" />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );
}
