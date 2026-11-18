import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  Tag,
  ShieldCheck,
  History,
  AlertCircle,
  FileText,
  User,
  Check,
  X,
  Image as ImageIcon,
  ClipboardCheck,
  Save,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api/reports";

const TechnicianPage = () => {
  const [activeTab, setActiveTab] = useState("pending");

  const [pendingReports, setPendingReports] = useState([]);
  const [reviewReports, setReviewReports] = useState([]);
  const [verifiedReports, setVerifiedReports] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCrop, setFilterCrop] = useState("Tất cả");

  const [selectedImage, setSelectedImage] = useState(null);

  const [reviewForms, setReviewForms] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);

  const isImageProcessed = (img) => {
    return img.status === "confirmed" || img.status === "wrong";
  };

  const isReportImagesDone = (report) => {
    return (
      report.images &&
      report.images.length > 0 &&
      report.images.every((img) => isImageProcessed(img))
    );
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(API_URL);
      const allReports = Array.isArray(res.data) ? res.data : [];

      const pending = allReports.filter((r) => !isReportImagesDone(r));

      const review = allReports.filter(
        (r) => isReportImagesDone(r) && !r.isVerified
      );

      const verified = allReports.filter(
        (r) => isReportImagesDone(r) && r.isVerified
      );

      setPendingReports(pending);
      setReviewReports(review);
      setVerifiedReports(verified);

      const formMap = {};
      review.forEach((report) => {
        formMap[report._id] = {
          plotStatus: report.plotStatus || "warning",
          severity: report.severity || "Nhẹ",
          spreadRate: report.spreadRate || 10,
          technicianNote: report.technicianNote || "",
        };
      });

      setReviewForms((prev) => ({
        ...formMap,
        ...prev,
      }));
    } catch (err) {
      console.log("Lỗi tải dữ liệu:", err);
      alert("Không tải được danh sách báo cáo!");
    }
  };

  const moveReportToCorrectList = (updatedReport) => {
    const removeFromAll = (list) =>
      list.filter((report) => report._id !== updatedReport._id);

    setPendingReports((prev) => removeFromAll(prev));
    setReviewReports((prev) => removeFromAll(prev));
    setVerifiedReports((prev) => removeFromAll(prev));

    if (!isReportImagesDone(updatedReport)) {
      setPendingReports((prev) => [updatedReport, ...prev]);
      setActiveTab("pending");
      return;
    }

    if (updatedReport.isVerified) {
      setVerifiedReports((prev) => [updatedReport, ...prev]);
      setActiveTab("verified");
      return;
    }

    setReviewReports((prev) => [updatedReport, ...prev]);
    setActiveTab("review");

    setReviewForms((prev) => ({
      ...prev,
      [updatedReport._id]: {
        plotStatus: updatedReport.plotStatus || "warning",
        severity: updatedReport.severity || "Nhẹ",
        spreadRate: updatedReport.spreadRate || 10,
        technicianNote: updatedReport.technicianNote || "",
      },
    }));
  };

  const handleVerifyImage = async (report, imgIdx) => {
    const currentImg = report.images[imgIdx];

    const label = window.prompt(
      `Nhập kết quả chẩn đoán cho Ảnh ${imgIdx + 1} (${report.plotId}):`,
      currentImg.diseaseLabel || "Bệnh sương mai"
    );

    if (!label) return;

    try {
      const payload = {
        diseaseLabel: label,
      };

      const res = await axios.put(
        `${API_URL}/${report._id}/images/${imgIdx}/confirm`,
        payload
      );

      const updatedReport = res.data;

      moveReportToCorrectList(updatedReport);

      if (isReportImagesDone(updatedReport) && !updatedReport.isVerified) {
        alert(
          "✅ Đã gán nhãn xong. Báo cáo đã chuyển sang tab Đánh giá lại & trả kết quả."
        );
      } else {
        alert(`✅ Đã gán nhãn ảnh ${imgIdx + 1} thành công!`);
      }
    } catch (error) {
      console.error("Lỗi cập nhật gán nhãn ảnh:", error);
      alert("❌ Có lỗi xảy ra khi cập nhật dữ liệu lên Server!");
    }
  };

  const handleRejectImage = async (report, imgIdx) => {
    const confirmReject = window.confirm(
      `Bạn có chắc chắn Ảnh ${imgIdx + 1} tại "${report.plotId}" bị sai bệnh hoặc không hợp lệ?`
    );

    if (!confirmReject) return;

    try {
      const res = await axios.put(
        `${API_URL}/${report._id}/images/${imgIdx}/wrong`
      );

      const updatedReport = res.data.report;

      moveReportToCorrectList(updatedReport);

      if (isReportImagesDone(updatedReport) && !updatedReport.isVerified) {
        alert(
          "✅ Đã xử lý xong ảnh. Báo cáo đã chuyển sang tab Đánh giá lại & trả kết quả."
        );
      } else {
        alert(`❌ Đã xác nhận ảnh ${imgIdx + 1} sai bệnh!`);
      }
    } catch (error) {
      console.error("Lỗi từ chối ảnh:", error);
      alert("❌ Không thể kết nối với Server để cập nhật trạng thái!");
    }
  };

  const handleReviewChange = (reportId, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: value,
      },
    }));
  };

  const handleFinalSubmit = async (report) => {
    const form = reviewForms[report._id] || {};

    if (!form.technicianNote || !form.technicianNote.trim()) {
      const confirmNoNote = window.confirm(
        "Bạn chưa nhập ghi chú kỹ thuật viên. Vẫn lưu và trả kết quả?"
      );

      if (!confirmNoNote) return;
    }

    const confirmSave = window.confirm(
      "Xác nhận lưu đánh giá cuối cùng và trả kết quả về cho nông dân?"
    );

    if (!confirmSave) return;

    try {
      const payload = {
        plotStatus: form.plotStatus || report.plotStatus,
        severity: form.severity || report.severity,
        spreadRate: Number(form.spreadRate) || Number(report.spreadRate) || 10,
        technicianNote: form.technicianNote || "",
        isVerified: true,
      };

      const res = await axios.put(`${API_URL}/${report._id}`, payload);

      moveReportToCorrectList(res.data);

      alert("✅ Đã lưu đánh giá cuối cùng và trả kết quả về cho nông dân!");
    } catch (error) {
      console.error("Lỗi lưu đánh giá cuối cùng:", error);
      alert("❌ Không thể lưu đánh giá cuối cùng!");
    }
  };

  const getFilteredData = (dataList) => {
    return dataList.filter((item) => {
      const keyword = searchTerm.toLowerCase();

      const matchSearch =
        item.plotId?.toLowerCase().includes(keyword) ||
        item.farmerId?.toLowerCase().includes(keyword) ||
        item.cropType?.toLowerCase().includes(keyword) ||
        item.images?.some((img) =>
          img.diseaseLabel?.toLowerCase().includes(keyword)
        );

      const matchFilter =
        filterCrop === "Tất cả" || item.cropType === filterCrop;

      return matchSearch && matchFilter;
    });
  };

  const displayPending = getFilteredData(pendingReports);
  const displayReview = getFilteredData(reviewReports);
  const displayVerified = getFilteredData(verifiedReports);

  const getStatusBadge = (status) => {
    switch (status) {
      case "normal":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-md bg-green-100 text-green-700">
            Bình thường
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-md bg-yellow-100 text-yellow-700">
            Nguy cơ
          </span>
        );
      case "danger":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-100 text-red-700">
            Nghiêm trọng
          </span>
        );
      default:
        return null;
    }
  };

  const ReportCard = ({ item, isVerified }) => (
    <div
      className={`bg-white rounded-[24px] p-6 border ${isVerified
          ? "border-slate-200 bg-slate-50 opacity-90"
          : "border-blue-100 shadow-lg shadow-blue-50 hover:border-blue-300"
        } transition-all flex flex-col gap-4`}
    >
      <div className="flex justify-between items-start border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3
              className={`font-extrabold text-xl ${isVerified ? "text-slate-700" : "text-slate-900"
                }`}
            >
              {item.plotId}
            </h3>
            {getStatusBadge(item.plotStatus)}
          </div>

          <p className="text-sm text-slate-500 flex items-center gap-1 font-medium">
            <User size={14} /> Mã ND:{" "}
            <strong className="text-slate-700">
              {item.farmerId || "Chưa cập nhật"}
            </strong>
          </p>
        </div>

        <div className="text-right">
          <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-bold mb-1">
            {item.cropType}
          </span>

          <p className="text-xs text-slate-500 flex justify-end gap-2 mt-1">
            <span>
              Tỉ lệ: <strong className="text-slate-700">{item.spreadRate}%</strong>
            </span>
            <span>|</span>
            <span
              className={
                item.severity === "Nặng"
                  ? "text-red-500 font-bold"
                  : item.severity === "TB"
                    ? "text-amber-500 font-bold"
                    : "text-green-600 font-bold"
              }
            >
              Mức độ: {item.severity}
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
        {item.images && item.images.length > 0 ? (
          item.images.map((imgObj, idx) => {
            const imgUrl = imgObj.imageUrl || "";
            const imgStatus = imgObj.status || "pending";
            const imgLabel = imgObj.diseaseLabel || "";

            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-32"
              >
                <div className="relative group">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Ảnh ${idx + 1}`}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-28 h-28 rounded-xl object-cover border border-slate-200 cursor-pointer transition-transform hover:scale-105 ${imgStatus === "wrong" ? "brightness-50 grayscale" : ""
                        }`}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <AlertCircle size={20} />
                    </div>
                  )}

                  {imgStatus === "confirmed" && (
                    <span className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full text-xs">
                      <Check size={12} />
                    </span>
                  )}

                  {imgStatus === "wrong" && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">
                      <X size={12} />
                    </span>
                  )}
                </div>

                {imgStatus !== "confirmed" && imgStatus !== "wrong" ? (
                  <div className="flex gap-1.5 w-full mt-1">
                    <button
                      onClick={() => handleRejectImage(item, idx)}
                      title="Báo sai bệnh ảnh này"
                      className="flex-1 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white p-1.5 rounded-lg transition-colors flex justify-center items-center"
                    >
                      <XCircle size={16} />
                    </button>

                    <button
                      onClick={() => handleVerifyImage(item, idx)}
                      title="Gán nhãn ảnh này"
                      className="flex-1 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white p-1.5 rounded-lg transition-colors flex justify-center items-center"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`text-[11px] font-bold text-center mt-1 px-1 w-full truncate ${imgStatus === "confirmed"
                        ? "text-green-600 bg-green-50"
                        : "text-red-500 bg-red-50"
                      } rounded py-0.5`}
                    title={imgLabel}
                  >
                    {imgStatus === "confirmed" ? imgLabel : "Sai bệnh"}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-slate-50 text-slate-400 flex flex-col items-center justify-center border border-dashed border-slate-300 shrink-0">
            <AlertCircle size={24} className="mb-1" />
            <span className="text-[10px]">Không có ảnh</span>
          </div>
        )}
      </div>

      {item.technicianNote && (
        <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 border border-blue-100 flex gap-2">
          <MessageSquare size={16} className="shrink-0 mt-0.5" />
          <p>{item.technicianNote}</p>
        </div>
      )}

      {item.note && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-100 flex gap-2">
          <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="italic">"{item.note}"</p>
        </div>
      )}
    </div>
  );

  const ReviewCard = ({ item }) => {
    const form = reviewForms[item._id] || {
      plotStatus: item.plotStatus || "warning",
      severity: item.severity || "Nhẹ",
      spreadRate: item.spreadRate || 10,
      technicianNote: item.technicianNote || "",
    };

    return (
      <div className="bg-white rounded-[24px] p-6 border border-purple-100 shadow-lg shadow-purple-50 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="text-purple-600" size={22} />
              {item.plotId}
            </h3>

            <p className="text-sm text-slate-500 flex items-center gap-1 font-medium mt-1">
              <User size={14} /> Mã ND:{" "}
              <strong className="text-slate-700">{item.farmerId}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold">
              Chờ đánh giá lại
            </span>
            <p className="text-xs text-slate-500 mt-2">{item.cropType}</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
          {item.images?.map((imgObj, idx) => {
            const imgUrl = imgObj.imageUrl || "";
            const imgStatus = imgObj.status || "pending";
            const imgLabel = imgObj.diseaseLabel || "";

            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-32"
              >
                <div className="relative">
                  <img
                    src={imgUrl}
                    alt={`Ảnh ${idx + 1}`}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-28 h-28 rounded-xl object-cover border border-slate-200 cursor-pointer hover:scale-105 transition-transform ${imgStatus === "wrong" ? "brightness-50 grayscale" : ""
                      }`}
                  />

                  {imgStatus === "confirmed" && (
                    <span className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full text-xs">
                      <Check size={12} />
                    </span>
                  )}

                  {imgStatus === "wrong" && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">
                      <X size={12} />
                    </span>
                  )}
                </div>

                <div
                  className={`text-[11px] font-bold text-center mt-1 px-1 w-full truncate ${imgStatus === "confirmed"
                      ? "text-green-600 bg-green-50"
                      : "text-red-500 bg-red-50"
                    } rounded py-0.5`}
                  title={imgLabel}
                >
                  {imgStatus === "confirmed" ? imgLabel : "Sai bệnh"}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    imgStatus === "confirmed"
                      ? handleVerifyImage(item, idx)
                      : handleRejectImage(item, idx)
                  }
                  className="text-[10px] text-slate-400 underline hover:text-blue-600"
                >
                  Sửa kết quả
                </button>
              </div>
            );
          })}
        </div>

        {item.note && (
          <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-100 flex gap-2">
            <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="italic">Ghi chú nông dân: "{item.note}"</p>
          </div>
        )}

        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
          <h4 className="text-lg font-extrabold text-slate-900 mb-4">
            Đánh giá lại trước khi trả kết quả
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Trạng thái ruộng
              </label>

              <select
                value={form.plotStatus}
                onChange={(e) =>
                  handleReviewChange(item._id, "plotStatus", e.target.value)
                }
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-bold"
              >
                <option value="normal">Bình thường</option>
                <option value="warning">Nguy cơ</option>
                <option value="danger">Nghiêm trọng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Mức độ ảnh hưởng
              </label>

              <select
                value={form.severity}
                onChange={(e) =>
                  handleReviewChange(item._id, "severity", e.target.value)
                }
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-bold"
              >
                <option value="Nhẹ">Nhẹ</option>
                <option value="TB">TB</option>
                <option value="Nặng">Nặng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Tỉ lệ cây bệnh (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={form.spreadRate}
                onChange={(e) =>
                  handleReviewChange(item._id, "spreadRate", e.target.value)
                }
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-bold"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Ghi chú trả về cho nông dân
            </label>

            <textarea
              value={form.technicianNote}
              onChange={(e) =>
                handleReviewChange(item._id, "technicianNote", e.target.value)
              }
              placeholder="Ví dụ: Bệnh đã được xác nhận. Cần theo dõi thêm, cắt bỏ lá bệnh và phun thuốc theo hướng dẫn..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 min-h-[110px]"
            />
          </div>

          <button
            type="button"
            onClick={() => handleFinalSubmit(item)}
            className="mt-5 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg shadow-purple-200"
          >
            <Save size={20} />
            Lưu & trả kết quả cho nông dân
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 text-slate-800 pb-12 relative">
      <header className="bg-white/90 backdrop-blur border-b border-green-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-11 h-11 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center transition-all"
            >
              <ArrowLeft size={23} />
            </Link>

            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={24} className="text-blue-600" />
                Xác minh & Gán nhãn theo ảnh
              </h1>

              <p className="text-sm text-slate-500">
                Gán nhãn ảnh, đánh giá lại mức độ rồi trả kết quả cho nông dân
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Link
              to="/technician/gallery"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 px-4 py-2 rounded-full text-sm font-extrabold transition-all shadow-sm shadow-emerald-200"
            >
              <ImageIcon size={18} />
              <span className="hidden sm:inline-block">Kho ảnh</span>
            </Link>

            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full text-sm font-extrabold">
              {pendingReports.length} Đang xử lý
            </span>

            <span className="bg-purple-50 text-purple-700 border border-purple-100 px-4 py-2 rounded-full text-sm font-extrabold hidden md:inline-block">
              {reviewReports.length} Chờ trả kết quả
            </span>

            <span className="bg-green-50 text-green-700 border border-green-100 px-4 py-2 rounded-full text-sm font-extrabold hidden md:inline-block">
              {verifiedReports.length} Đã hoàn thành
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 mt-8">
        <section className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên bệnh, mã ND, mã thửa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            <div className="relative min-w-[200px]">
              <Filter
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />

              <select
                value={filterCrop}
                onChange={(e) => setFilterCrop(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 px-6 py-4 pl-12 pr-10 rounded-2xl font-extrabold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 cursor-pointer transition-all"
              >
                <option value="Tất cả">Tất cả loại cây</option>
                <option value="Cà chua">Cà chua</option>
                <option value="Dưa chuột">Dưa chuột</option>
              </select>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>
        </section>

        <div className="flex border-b border-slate-200 mb-6 gap-8 overflow-x-auto">
          <button
            className={`pb-4 px-2 font-extrabold flex items-center gap-2 border-b-2 transition-all text-lg whitespace-nowrap ${activeTab === "pending"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            onClick={() => setActiveTab("pending")}
          >
            <Tag size={20} />
            Chờ / Đang xử lý ({displayPending.length})
          </button>

          <button
            className={`pb-4 px-2 font-extrabold flex items-center gap-2 border-b-2 transition-all text-lg whitespace-nowrap ${activeTab === "review"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            onClick={() => setActiveTab("review")}
          >
            <ClipboardCheck size={20} />
            Đánh giá lại & trả kết quả ({displayReview.length})
          </button>

          <button
            className={`pb-4 px-2 font-extrabold flex items-center gap-2 border-b-2 transition-all text-lg whitespace-nowrap ${activeTab === "verified"
                ? "border-green-600 text-green-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            onClick={() => setActiveTab("verified")}
          >
            <History size={20} />
            Đã hoàn thành ({displayVerified.length})
          </button>
        </div>

        <section className="space-y-6">
          {activeTab === "pending" && (
            <>
              {displayPending.map((item) => (
                <ReportCard key={item._id} item={item} isVerified={false} />
              ))}

              {displayPending.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300 text-slate-500 font-bold">
                  Không tìm thấy báo cáo nào phù hợp.
                </div>
              )}
            </>
          )}

          {activeTab === "review" && (
            <>
              {displayReview.map((item) => (
                <ReviewCard key={item._id} item={item} />
              ))}

              {displayReview.length === 0 && (
                <div className="text-center py-20 bg-purple-50 rounded-[24px] border border-dashed border-purple-200 text-slate-500 font-bold">
                  Chưa có báo cáo nào cần đánh giá lại.
                </div>
              )}
            </>
          )}

          {activeTab === "verified" && (
            <>
              {displayVerified.map((item) => (
                <ReportCard key={item._id} item={item} isVerified={true} />
              ))}

              {displayVerified.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[24px] border border-dashed border-slate-300 text-slate-500 font-bold">
                  Không tìm thấy báo cáo nào phù hợp.
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Phóng to"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border-2 border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianPage;