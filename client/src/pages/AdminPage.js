import React, { useEffect, useState } from "react";
import {
  Users,
  BarChart3,
  Bug,
  ShieldCheck,
  Search,
  Save,
  Edit,
  Trash2,
  UserPlus,
  Phone,
  Mail,
} from "lucide-react";

const AUTH_API_URL = "http://localhost:5000/api/auth";
const REPORT_API_URL = "http://localhost:5000/api/reports";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("accounts");

  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    role: "Technician",
  });

  const token = localStorage.getItem("token");

  const roleLabels = {
    Technician: "Cán bộ kỹ thuật",
    Manager: "Chủ HTX",
  };

  // ===============================
  // LẤY DANH SÁCH TÀI KHOẢN
  // ===============================
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Không lấy được danh sách tài khoản!");
        return;
      }

      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server!");
    }
  };

  // ===============================
  // LẤY DANH SÁCH BÁO CÁO
  // ===============================
  const fetchReports = async () => {
    try {
      setReportLoading(true);
      setReportError("");

      const res = await fetch(REPORT_API_URL, {
        headers: token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {},
      });

      const data = await res.json();

      if (!res.ok) {
        setReportError(data.error || "Không lấy được danh sách báo cáo!");
        return;
      }

      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setReportError("Lỗi kết nối server khi lấy báo cáo!");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ===============================
  // TỰ CẬP NHẬT BÁO CÁO 5 GIÂY / LẦN
  // ===============================
  useEffect(() => {
    if (activeTab !== "reports" && activeTab !== "diseases") return;

    fetchReports();

    const intervalId = setInterval(() => {
      fetchReports();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  // ===============================
  // NHẬP FORM
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===============================
  // RESET FORM
  // ===============================
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      role: "Technician",
    });
  };

  // ===============================
  // THÊM / SỬA TÀI KHOẢN
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      alert("Vui lòng nhập họ tên!");
      return;
    }

    if (!formData.username.trim()) {
      alert("Vui lòng nhập tên đăng nhập!");
      return;
    }

    if (!formData.email.trim()) {
      alert("Vui lòng nhập email!");
      return;
    }

    try {
      const url = editingId
        ? `${AUTH_API_URL}/admin/users/${editingId}`
        : `${AUTH_API_URL}/admin/users`;

      const method = editingId ? "PUT" : "POST";

      const bodyData = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Lưu tài khoản thất bại!");
        return;
      }

      if (!editingId && data.user?.defaultPassword) {
        alert(
          `${data.message}\n\nTài khoản: ${data.user.username}\nMật khẩu mặc định: ${data.user.defaultPassword}`
        );
      } else {
        alert(data.message || "Lưu tài khoản thành công!");
      }

      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server!");
    }
  };

  // ===============================
  // SỬA TÀI KHOẢN
  // ===============================
  const handleEdit = (account) => {
    setEditingId(account._id);

    setFormData({
      fullName: account.fullName || "",
      username: account.username || "",
      email: account.email || "",
      phone: account.phone || "",
      role: account.role || "Technician",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ===============================
  // XÓA TÀI KHOẢN
  // ===============================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản này không?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${AUTH_API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Xóa tài khoản thất bại!");
        return;
      }

      alert(data.message || "Xóa tài khoản thành công!");
      fetchAccounts();
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server!");
    }
  };

  // ===============================
  // ĐĂNG XUẤT
  // ===============================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // ===============================
  // LỌC TÀI KHOẢN
  // ===============================
  const filteredAccounts = accounts.filter((account) => {
    const keyword = searchTerm.toLowerCase();

    return (
      account.username?.toLowerCase().includes(keyword) ||
      account.email?.toLowerCase().includes(keyword) ||
      account.fullName?.toLowerCase().includes(keyword) ||
      roleLabels[account.role]?.toLowerCase().includes(keyword)
    );
  });

  // ===============================
  // THỐNG KÊ BÁO CÁO
  // ===============================
  const uniqueFarmerIds = [
    ...new Set(reports.map((report) => report.farmerId).filter(Boolean)),
  ];

  const todayText = new Date().toDateString();

  const reportStats = {
    totalReports: reports.length,
    totalHouseholds: uniqueFarmerIds.length,
    todayReports: reports.filter(
      (report) => new Date(report.createdAt).toDateString() === todayText
    ).length,
    pendingReports: reports.filter((report) => !report.isVerified).length,
    verifiedReports: reports.filter((report) => report.isVerified).length,
    dangerReports: reports.filter((report) => report.plotStatus === "danger")
      .length,
  };

  const latestReports = reports.slice(0, 10);

  const tomatoReports = reports.filter(
    (report) => report.cropType === "Cà chua"
  ).length;

  const cucumberReports = reports.filter(
    (report) => report.cropType === "Dưa chuột"
  ).length;

  const severeReports = reports.filter(
    (report) => report.severity === "Nặng"
  ).length;

  const getPlotStatusLabel = (status) => {
    if (status === "normal") return "Bình thường";
    if (status === "warning") return "Nguy cơ";
    if (status === "danger") return "Nghiêm trọng";
    return status || "—";
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* HEADER */}
      <div className="bg-white border-b border-green-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-green-600" size={34} />

            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Trang quản trị Admin
              </h1>
              <p className="text-slate-500">
                Quản lý tài khoản và theo dõi thống kê hệ thống
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TABS */}
        <div className="bg-white rounded-3xl border border-green-100 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold ${activeTab === "accounts"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700"
                }`}
            >
              <Users size={22} />
              Quản lý tài khoản
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold ${activeTab === "reports"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700"
                }`}
            >
              <BarChart3 size={22} />
              Thống kê hộ dân báo cáo
            </button>

            <button
              onClick={() => setActiveTab("diseases")}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold ${activeTab === "diseases"
                  ? "bg-red-500 text-white"
                  : "bg-red-50 text-red-600"
                }`}
            >
              <Bug size={22} />
              Thống kê dịch bệnh
            </button>
          </div>
        </div>

        {/* TAB QUẢN LÝ TÀI KHOẢN */}
        {activeTab === "accounts" && (
          <>
            {/* FORM THÊM / SỬA */}
            <div className="bg-white rounded-3xl border border-green-100 p-8 mb-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-green-50 p-4 rounded-2xl">
                  <UserPlus className="text-green-600" size={30} />
                </div>

                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">
                    {editingId
                      ? "Sửa tài khoản"
                      : "Thêm tài khoản kỹ thuật viên / chủ HTX"}
                  </h2>
                  <p className="text-slate-500">
                    Mật khẩu mặc định sẽ tự động bằng tên đăng nhập
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* HỌ TÊN */}
                  <div>
                    <label className="font-bold text-slate-800">Họ tên</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ tên"
                      className="mt-2 w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* USERNAME */}
                  <div>
                    <label className="font-bold text-slate-800">
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Nhập username"
                      className="mt-2 w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="font-bold text-slate-800">Email</label>
                    <div className="relative mt-2">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={20}
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập email"
                        className="w-full border border-slate-200 rounded-2xl pl-12 pr-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="font-bold text-slate-800">
                      Số điện thoại
                    </label>
                    <div className="relative mt-2">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={20}
                      />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại"
                        className="w-full border border-slate-200 rounded-2xl pl-12 pr-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* ROLE */}
                  <div>
                    <label className="font-bold text-slate-800">Chức vụ</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-2 w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Technician">Cán bộ kỹ thuật</option>
                      <option value="Manager">Chủ HTX</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-8">
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-2xl"
                  >
                    <Save size={22} />
                    {editingId ? "Cập nhật tài khoản" : "Thêm tài khoản"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-8 py-4 rounded-2xl"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* DANH SÁCH */}
            <div className="bg-white rounded-3xl border border-green-100 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">
                    Danh sách tài khoản
                  </h2>
                  <p className="text-slate-500">
                    Danh sách Cán bộ kỹ thuật và Chủ HTX đã được tạo
                  </p>
                </div>

                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={22}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài khoản..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl pl-12 pr-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-green-50 text-green-700">
                      <th className="p-4 text-left rounded-l-2xl">STT</th>
                      <th className="p-4 text-left">Họ tên</th>
                      <th className="p-4 text-left">Username</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Số điện thoại</th>
                      <th className="p-4 text-left">Chức vụ</th>
                      <th className="p-4 text-center rounded-r-2xl">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-8 text-center text-slate-500"
                        >
                          Chưa có tài khoản nào.
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account, index) => (
                        <tr
                          key={account._id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 font-bold">{index + 1}</td>
                          <td className="p-4">{account.fullName}</td>
                          <td className="p-4 font-bold text-slate-800">
                            {account.username}
                          </td>
                          <td className="p-4">{account.email}</td>
                          <td className="p-4">{account.phone || "—"}</td>
                          <td className="p-4">
                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
                              {roleLabels[account.role] || account.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => handleEdit(account)}
                                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-3 rounded-xl"
                                title="Sửa"
                              >
                                <Edit size={20} />
                              </button>

                              <button
                                onClick={() => handleDelete(account._id)}
                                className="bg-red-100 hover:bg-red-200 text-red-600 p-3 rounded-xl"
                                title="Xóa"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB THỐNG KÊ HỘ DÂN */}
        {activeTab === "reports" && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-green-100 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Thống kê hộ dân báo cáo
                  </h2>
                  <p className="text-slate-500">
                    Dữ liệu tự cập nhật mỗi 5 giây từ báo cáo nông dân gửi lên.
                  </p>
                </div>

                <button
                  onClick={fetchReports}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl"
                >
                  Làm mới
                </button>
              </div>

              {reportError && (
                <div className="bg-red-50 text-red-600 font-bold p-4 rounded-2xl mb-6">
                  {reportError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-green-50 border border-green-100 rounded-3xl p-6">
                  <p className="text-green-700 font-bold">
                    Số hộ dân đã báo cáo
                  </p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {reportStats.totalHouseholds}
                  </h3>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                  <p className="text-blue-700 font-bold">Tổng số báo cáo</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {reportStats.totalReports}
                  </h3>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-3xl p-6">
                  <p className="text-yellow-700 font-bold">Báo cáo hôm nay</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {reportStats.todayReports}
                  </h3>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
                  <p className="text-orange-700 font-bold">Chưa xử lý</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {reportStats.pendingReports}
                  </h3>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
                  <p className="text-emerald-700 font-bold">Đã xử lý</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {reportStats.verifiedReports}
                  </h3>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
                  <p className="text-red-700 font-bold">Luống nghiêm trọng</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {reportStats.dangerReports}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-green-100 p-8 shadow-sm">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6">
                Báo cáo mới nhất
              </h2>

              {reportLoading && reports.length === 0 ? (
                <p className="text-slate-500">Đang tải dữ liệu...</p>
              ) : latestReports.length === 0 ? (
                <p className="text-slate-500">
                  Chưa có hộ dân nào gửi báo cáo.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-green-50 text-green-700">
                        <th className="p-4 text-left rounded-l-2xl">STT</th>
                        <th className="p-4 text-left">Mã hộ dân</th>
                        <th className="p-4 text-left">Thửa / Luống</th>
                        <th className="p-4 text-left">Cây trồng</th>
                        <th className="p-4 text-left">Tỉ lệ bệnh</th>
                        <th className="p-4 text-left">Mức độ</th>
                        <th className="p-4 text-left">Trạng thái</th>
                        <th className="p-4 text-left rounded-r-2xl">
                          Thời gian
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestReports.map((report, index) => (
                        <tr
                          key={report._id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 font-bold">{index + 1}</td>
                          <td className="p-4 font-bold text-slate-800">
                            {report.farmerId}
                          </td>
                          <td className="p-4">{report.plotId}</td>
                          <td className="p-4">{report.cropType}</td>
                          <td className="p-4">{report.spreadRate}%</td>
                          <td className="p-4">{report.severity}</td>
                          <td className="p-4">
                            <span
                              className={`px-4 py-2 rounded-full font-bold ${report.plotStatus === "danger"
                                  ? "bg-red-100 text-red-600"
                                  : report.plotStatus === "warning"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                            >
                              {getPlotStatusLabel(report.plotStatus)}
                            </span>
                          </td>
                          <td className="p-4">
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleString(
                                "vi-VN"
                              )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB THỐNG KÊ DỊCH BỆNH */}
        {activeTab === "diseases" && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Thống kê dịch bệnh
                  </h2>
                  <p className="text-slate-500">
                    Thống kê nhanh theo loại cây và mức độ bệnh.
                  </p>
                </div>

                <button
                  onClick={fetchReports}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-2xl"
                >
                  Làm mới
                </button>
              </div>

              {reportError && (
                <div className="bg-red-50 text-red-600 font-bold p-4 rounded-2xl mb-6">
                  {reportError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
                  <p className="text-red-700 font-bold">Báo cáo mức nặng</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {severeReports}
                  </h3>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-3xl p-6">
                  <p className="text-green-700 font-bold">Báo cáo Cà chua</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {tomatoReports}
                  </h3>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                  <p className="text-blue-700 font-bold">Báo cáo Dưa chuột</p>
                  <h3 className="text-4xl font-extrabold text-slate-900 mt-2">
                    {cucumberReports}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6">
                Danh sách báo cáo bệnh
              </h2>

              {reportLoading && reports.length === 0 ? (
                <p className="text-slate-500">Đang tải dữ liệu...</p>
              ) : reports.length === 0 ? (
                <p className="text-slate-500">Chưa có dữ liệu dịch bệnh.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-red-50 text-red-600">
                        <th className="p-4 text-left rounded-l-2xl">STT</th>
                        <th className="p-4 text-left">Mã hộ dân</th>
                        <th className="p-4 text-left">Cây trồng</th>
                        <th className="p-4 text-left">Tỉ lệ bệnh</th>
                        <th className="p-4 text-left">Mức độ</th>
                        <th className="p-4 text-left">Số ảnh</th>
                        <th className="p-4 text-left rounded-r-2xl">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {reports.map((report, index) => (
                        <tr
                          key={report._id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 font-bold">{index + 1}</td>
                          <td className="p-4 font-bold">
                            {report.farmerId}
                          </td>
                          <td className="p-4">{report.cropType}</td>
                          <td className="p-4">{report.spreadRate}%</td>
                          <td className="p-4">
                            <span
                              className={`px-4 py-2 rounded-full font-bold ${report.severity === "Nặng"
                                  ? "bg-red-100 text-red-600"
                                  : report.severity === "TB"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                            >
                              {report.severity}
                            </span>
                          </td>
                          <td className="p-4">
                            {Array.isArray(report.images)
                              ? report.images.length
                              : 0}
                          </td>
                          <td className="p-4">{report.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;