import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  ArrowLeft,
  Leaf,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { Link } from "react-router-dom";

const AUTH_API_URL = "http://localhost:5000/api/auth";

// Tùy biến URL gọi API quản lý reports của bạn ở đây
const REPORTS_API_URL = "http://localhost:5000/api/reports";

const ManagerPage = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [skippedRows, setSkippedRows] = useState([]);

  // Lưu trữ dữ liệu tỷ lệ % dịch bệnh 7 ngày gần nhất từ DB
  const [trendData, setTrendData] = useState([]);

  const token = localStorage.getItem("token");

  const stats = [
    {
      title: "Hộ dân báo cáo",
      value: farmers.length || "0",
      icon: <Users size={28} />,
      trend: "Tài khoản đã tạo",
      color: "bg-blue-500",
      soft: "bg-blue-50 text-blue-600 border-blue-100",
    },
  ];

  // ===============================
  // LẤY DANH SÁCH NÔNG DÂN ĐÃ UPLOAD
  // ===============================
  const fetchFarmers = async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/manager/farmers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Không lấy được danh sách nông dân!");
        return;
      }

      setFarmers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server!");
    }
  };

  // ===================================
  // LẤY DIỄN BIẾN % BỆNH TRUNG BÌNH 7 NGÀY
  // ===================================
  const fetchWeeklyTrend = async () => {
    try {
      const res = await fetch(`${REPORTS_API_URL}/weekly-trend`);

      if (res.ok) {
        const data = await res.json();
        setTrendData(data);
      }
    } catch (error) {
      console.error("Lỗi khi kết nối API biểu đồ:", error);
    }
  };

  useEffect(() => {
    fetchFarmers();
    fetchWeeklyTrend();
  }, []);

  // ===============================
  // UPLOAD FILE EXCEL
  // ===============================
  const handleUploadExcel = async (e) => {
    e.preventDefault();

    if (!excelFile) {
      alert("Vui lòng chọn file Excel!");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      setUploading(true);

      const res = await fetch(`${AUTH_API_URL}/manager/farmers/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upload Excel thất bại!");
        return;
      }

      alert(data.message || "Upload thành công!");

      setSkippedRows(data.skippedRows || []);
      setExcelFile(null);

      const fileInput = document.getElementById("excelFileInput");

      if (fileInput) {
        fileInput.value = "";
      }

      fetchFarmers();
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 text-slate-800 pb-12">
      <header className="bg-white/90 backdrop-blur border-b border-green-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-11 h-11 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center transition-all"
            >
              <ArrowLeft size={23} />
            </Link>

            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 size={24} className="text-amber-600" />
                Bảng điều khiển Chủ HTX
              </h1>

              <p className="text-sm text-slate-500">
                Theo dõi tình hình dịch bệnh và quản lý danh sách nông dân
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-100 px-4 py-2 rounded-full font-extrabold">
            <Leaf size={18} />
            Quản lý HTX
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 mt-8">
        <section className="bg-white rounded-[30px] border border-green-100 shadow-xl shadow-green-100/60 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold text-sm mb-5">
                <Leaf size={18} />
                Cà chua và Dưa chuột
              </div>

              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
                Tổng quan tình hình bệnh cây
              </h2>

              <p className="text-slate-500 text-lg leading-relaxed">
                Theo dõi số hộ dân báo cáo và quản lý danh sách nông dân trong
                hợp tác xã.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[26px] p-6 text-white">
              <p className="text-green-100 mb-2">Tình trạng chung</p>

              <h3 className="text-4xl font-extrabold mb-4">Ổn định</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/15 rounded-2xl p-4">
                  <p className="text-2xl font-extrabold">2</p>
                  <p className="text-sm text-green-50">Cây theo dõi</p>
                </div>

                <div className="bg-white/15 rounded-2xl p-4">
                  <p className="text-2xl font-extrabold">{farmers.length}</p>
                  <p className="text-sm text-green-50">Nông dân</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THỐNG KÊ HỘ DÂN */}
        <section className="grid grid-cols-1 gap-6 mb-8">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-[26px] border border-green-100 shadow-lg shadow-green-100/60 hover:-translate-y-1 transition-all"
            >
              <div className="flex justify-between items-start mb-5">
                <div
                  className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center`}
                >
                  {item.icon}
                </div>

                <span
                  className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border ${item.soft}`}
                >
                  {item.title}
                </span>
              </div>

              <div className="text-4xl font-extrabold text-slate-900 mb-2">
                {item.value}
              </div>

              <div className="text-sm text-green-700 font-bold">
                {item.trend}
              </div>
            </div>
          ))}
        </section>

        {/* UPLOAD EXCEL */}
        <section className="bg-white rounded-[30px] border border-green-100 shadow-xl shadow-green-100/60 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={30} />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Upload danh sách nông dân
              </h2>

              <p className="text-slate-500 mt-2">
                Chủ HTX tải file Excel lên hệ thống. Hệ thống sẽ tự tạo tài
                khoản nông dân và lưu ngay vào database.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleUploadExcel}
            className="flex flex-col md:flex-row gap-4"
          >
            <input
              id="excelFileInput"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="flex-1 border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              type="submit"
              disabled={uploading}
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold px-8 py-4 rounded-2xl"
            >
              <Upload size={22} />
              {uploading ? "Đang upload..." : "Upload Excel"}
            </button>
          </form>

          <div className="mt-5 bg-green-50 border border-green-100 rounded-2xl p-4 text-green-700">
            <p className="font-bold mb-2">File Excel cần có các cột:</p>

            <p className="text-sm">
              farmerCode | fullName | fieldCode | email | phone | address
            </p>

            <p className="text-sm mt-2">
              Ví dụ: ND001 | Nguyễn Văn A | THUA001 | nd001@gmail.com |
              0988888888 | Xã A
            </p>

            <p className="text-sm mt-2 font-bold">
              Mật khẩu mặc định của nông dân = mã nông dân.
            </p>
          </div>

          {skippedRows.length > 0 && (
            <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-800">
              <h3 className="font-bold mb-2">Các dòng bị bỏ qua:</h3>

              <ul className="list-disc pl-5">
                {skippedRows.map((item, index) => (
                  <li key={index}>
                    Dòng {item.row}: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* DANH SÁCH NÔNG DÂN */}
        <section className="bg-white rounded-[30px] border border-green-100 shadow-xl shadow-green-100/60 p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Danh sách nông dân đã tạo tài khoản
            </h2>

            <p className="text-slate-500 mt-2">
              Các nông dân này đã được lưu vào database và có thể đăng nhập
              bằng mã nông dân.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-green-50 text-green-700">
                  <th className="p-4 text-left rounded-l-2xl">STT</th>
                  <th className="p-4 text-left">Mã nông dân</th>
                  <th className="p-4 text-left">Họ tên</th>
                  <th className="p-4 text-left">Mã thửa ruộng</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">SĐT</th>
                  <th className="p-4 text-left rounded-r-2xl">Địa chỉ</th>
                </tr>
              </thead>

              <tbody>
                {farmers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-slate-500"
                    >
                      Chưa có nông dân nào được tạo.
                    </td>
                  </tr>
                ) : (
                  farmers.map((farmer, index) => (
                    <tr
                      key={farmer._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4 font-bold">{index + 1}</td>

                      <td className="p-4 font-bold text-green-700">
                        {farmer.farmerCode}
                      </td>

                      <td className="p-4">{farmer.fullName}</td>
                      <td className="p-4">{farmer.fieldCode}</td>
                      <td className="p-4">{farmer.email}</td>
                      <td className="p-4">{farmer.phone || "—"}</td>
                      <td className="p-4">{farmer.address || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* BIỂU ĐỒ DỊCH BỆNH */}
        <section className="grid grid-cols-1 gap-8">
          <div className="bg-white p-8 rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 h-96 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Mức độ dịch bệnh trung bình
                </h3>

                <p className="text-slate-500 text-sm mt-1">
                  Thống kê tỷ lệ % nhiễm bệnh 7 ngày gần nhất
                </p>
              </div>

              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <BarChart3 size={26} />
              </div>
            </div>

            <div className="flex items-end justify-between h-48 w-full gap-3 pt-6">
              {trendData.length === 0 ? (
                <div className="w-full text-center pb-12 text-slate-400 text-sm">
                  Không có dữ liệu thống kê tuần này
                </div>
              ) : (
                trendData.map((item, index) => {
                  const heightPercent = Number(item.count) || 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 h-full flex flex-col justify-end items-center group"
                    >
                      <div
                        style={{
                          height: `${Math.max(heightPercent, 6)}%`,
                        }}
                        className="w-full bg-amber-400 group-hover:bg-amber-500 rounded-t-2xl transition-all duration-300 cursor-pointer relative"
                      >
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-1 rounded whitespace-nowrap z-10 font-bold shadow-md">
                          {item.count}%
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-400 mt-2 block h-4">
                        {item.day}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerPage;