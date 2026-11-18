import React, { useState, useEffect } from "react";
import {
  Camera,
  Send,
  ArrowLeft,
  Leaf,
  AlertTriangle,
  MapPin,
  ImagePlus,
  User,
  X,
  CheckCircle,
  Loader2,
  Bell,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const farmerBeds = ["Luống 1", "Luống 2"];

const FarmerPage = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState({
    farmerId: "",
    bedId: "Luống 1",
    plotStatus: "warning",
    cropType: "Cà chua",
    spreadRate: 10,
    severity: "Nhẹ",
    note: "",
  });

  const [autoPlotId, setAutoPlotId] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [diseaseGallery, setDiseaseGallery] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [referenceImages, setReferenceImages] = useState([]);
  const [isLoadingRef, setIsLoadingRef] = useState(false);

  const handleOpenDiseaseGallery = async (diseaseName) => {
    setGalleryTitle(diseaseName);
    setIsGalleryOpen(true);
    setIsLoadingGallery(true);
    setDiseaseGallery([]);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/reports/disease-images?label=${encodeURIComponent(
          diseaseName
        )}`
      );
      setDiseaseGallery(res.data);
    } catch (error) {
      console.error("Lỗi tải thư viện ảnh bệnh:", error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    const code = report.farmerId.trim().toUpperCase();

    if (code.startsWith("ND0") && code.length === 4) {
      const num = parseInt(code.slice(3), 10);

      if (num >= 1 && num <= 9) {
        setAutoPlotId(`Thửa ${num}`);
      } else {
        setAutoPlotId("");
      }
    } else {
      setAutoPlotId("");
    }
  }, [report.farmerId]);

  useEffect(() => {
    const fetchReferenceImages = async () => {
      setIsLoadingRef(true);

      try {
        const response = await fetch(
          `http://localhost:5000/api/reference-images?cropType=${report.cropType}`
        );

        if (response.ok) {
          const data = await response.json();
          setReferenceImages(data);
        } else {
          console.error("Lỗi khi tải ảnh tham khảo");
        }
      } catch (error) {
        console.error("Không thể kết nối đến server:", error);
      } finally {
        setIsLoadingRef(false);
      }
    };

    fetchReferenceImages();
  }, [report.cropType]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      const imageUrls = files.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...imageUrls]);
    }

    e.target.value = null;
  };

  const removeImage = (indexToRemove) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );

    setPreviewImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!autoPlotId) {
      alert(
        "❌ Vui lòng nhập đúng Mã nông dân (từ ND01 đến ND09) để xác định Thửa!"
      );
      return;
    }

    if (selectedFiles.length < 8 || selectedFiles.length > 10) {
      alert(
        `Vui lòng chọn từ 8 đến 10 ảnh! Hiện tại bạn đang chọn ${selectedFiles.length} ảnh.`
      );
      return;
    }

    const formData = new FormData();

    formData.append("farmerId", report.farmerId);
    formData.append("plotId", `${autoPlotId} - ${report.bedId}`);
    formData.append("plotStatus", report.plotStatus);
    formData.append("cropType", report.cropType);
    formData.append("spreadRate", report.spreadRate);
    formData.append("severity", report.severity);
    formData.append("note", report.note);

    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        localStorage.setItem(
          "lastFarmerId",
          report.farmerId.trim().toUpperCase()
        );

        alert("✅ Báo cáo kèm ảnh đã được lưu thành công!");

        setPreviewImages([]);
        setSelectedFiles([]);

        setReport({
          farmerId: "",
          bedId: "Luống 1",
          plotStatus: "warning",
          cropType: "Cà chua",
          spreadRate: 10,
          severity: "Nhẹ",
          note: "",
        });
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || "Có lỗi xảy ra từ phía Server!";
        alert(`❌ Lỗi: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Lỗi gửi báo cáo:", error);
      alert(
        "❌ Không thể kết nối với Server! Hãy kiểm tra xem server đã bật chưa."
      );
    }
  };

  const getBedStyles = (bedName) => {
    const isSelected = report.bedId === bedName;

    if (!isSelected) {
      return "border-2 border-slate-200 bg-slate-50 text-slate-400 rounded-2xl p-4 cursor-pointer hover:bg-slate-100 transition-all";
    }

    switch (report.plotStatus) {
      case "normal":
        return "border-2 border-green-500 bg-green-50 text-green-800 ring-4 ring-green-100 rounded-2xl p-4 cursor-pointer transition-all scale-[1.02] shadow-md relative";
      case "warning":
        return "border-2 border-yellow-500 bg-yellow-50 text-yellow-800 ring-4 ring-yellow-100 rounded-2xl p-4 cursor-pointer transition-all scale-[1.02] shadow-md relative";
      case "danger":
        return "border-2 border-red-500 bg-red-50 text-red-800 ring-4 ring-red-100 rounded-2xl p-4 cursor-pointer transition-all scale-[1.02] shadow-md relative";
      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "normal") return "Bình thường";
    if (status === "warning") return "Nguy cơ";
    return "Nghiêm trọng";
  };

  const handleNotificationClick = () => {
    const currentFarmerId =
      report.farmerId.trim().toUpperCase() ||
      localStorage.getItem("lastFarmerId") ||
      "";

    if (!currentFarmerId) {
      alert("Vui lòng nhập mã nông dân trước khi xem thông báo!");
      return;
    }

    localStorage.setItem("lastFarmerId", currentFarmerId);
    navigate(`/farmer-notifications?farmerId=${currentFarmerId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 text-slate-800 pb-12 relative">
      <header className="bg-white/90 backdrop-blur border-b border-green-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-11 h-11 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl flex items-center justify-center transition-all"
            >
              <ArrowLeft size={23} />
            </Link>

            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Khai báo bệnh cây trồng
              </h1>
              <p className="text-sm text-slate-500">
                Gửi thông tin bệnh trên Cà chua và Dưa chuột
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNotificationClick}
              className="relative p-2.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Xem thông báo"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-green-50 rounded-full"></span>
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold">
              <Leaf size={18} /> Nông dân
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center">
                <Leaf size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Thông tin cơ bản
                </h2>
                <p className="text-slate-500 text-sm">
                  Nhập mã nông dân, chọn luống và đánh giá màu sắc
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mã nông dân
                  </label>

                  <div className="relative">
                    <User
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      required
                      placeholder="VD: ND01, ND05..."
                      value={report.farmerId}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 uppercase"
                      onChange={(e) =>
                        setReport({
                          ...report,
                          farmerId: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Thửa quản lý
                  </label>

                  <div className="relative">
                    <MapPin
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      disabled
                      value={autoPlotId || "Chưa xác định"}
                      className={`w-full border rounded-2xl pl-12 pr-4 py-4 cursor-not-allowed font-extrabold ${autoPlotId
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                        }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  1. Bạn đang báo cáo cho luống nào?
                </label>

                <div className="grid grid-cols-2 gap-4">
                  {farmerBeds.map((bedName) => (
                    <div
                      key={bedName}
                      onClick={() => setReport({ ...report, bedId: bedName })}
                      className={getBedStyles(bedName)}
                    >
                      {report.bedId === bedName && (
                        <div
                          className={`absolute top-3 right-3 ${report.plotStatus === "normal"
                              ? "text-green-600"
                              : report.plotStatus === "warning"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                        >
                          <CheckCircle
                            size={20}
                            className="fill-current bg-white rounded-full"
                          />
                        </div>
                      )}

                      <h3 className="font-extrabold text-lg">{bedName}</h3>

                      {report.bedId === bedName ? (
                        <p className="text-sm font-medium mt-1 opacity-90 flex items-center gap-1">
                          Trạng thái:{" "}
                          <span className="font-bold">
                            {getStatusLabel(report.plotStatus)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm font-medium mt-1 opacity-60 flex items-center gap-1">
                          Nhấn để chọn
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  2. Chọn màu sắc hiện trạng của{" "}
                  {autoPlotId ? `${autoPlotId} - ${report.bedId}` : report.bedId}
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setReport({ ...report, plotStatus: "normal" })
                    }
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${report.plotStatus === "normal"
                        ? "border-green-500 bg-green-100 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-100"
                      }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500 shadow-sm"></div>
                    <span className="text-xs font-bold text-slate-700">
                      Bình thường
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setReport({ ...report, plotStatus: "warning" })
                    }
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${report.plotStatus === "warning"
                        ? "border-yellow-500 bg-yellow-100 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-100"
                      }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-sm"></div>
                    <span className="text-xs font-bold text-slate-700">
                      Nguy cơ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setReport({ ...report, plotStatus: "danger" })
                    }
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${report.plotStatus === "danger"
                        ? "border-red-500 bg-red-100 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-100"
                      }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500 shadow-sm"></div>
                    <span className="text-xs font-bold text-slate-700">
                      Nghiêm trọng
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Loại cây trồng
                </label>

                <select
                  value={report.cropType}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 cursor-pointer font-bold"
                  onChange={(e) =>
                    setReport({ ...report, cropType: e.target.value })
                  }
                >
                  <option value="Cà chua">🍅 Cà chua</option>
                  <option value="Dưa chuột">🥒 Dưa chuột</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
                  <Camera size={26} />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Hình ảnh thực tế
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Yêu cầu bắt buộc tải từ{" "}
                    <strong className="text-red-500">8 - 10 ảnh</strong>
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${selectedFiles.length >= 8 && selectedFiles.length <= 10
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                  }`}
              >
                Đã chọn: {selectedFiles.length} ảnh
              </span>
            </div>

            <div className="space-y-4">
              <label
                htmlFor="upload"
                className="flex flex-col items-center cursor-pointer p-8 w-full border-2 border-dashed border-blue-200 rounded-[24px] bg-blue-50 hover:border-blue-500 transition-all justify-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-white text-blue-600 flex items-center justify-center shadow-md mb-4">
                  <ImagePlus size={36} />
                </div>

                <span className="text-sm font-bold text-blue-700">
                  Bấm vào đây để chọn nhiều ảnh
                </span>

                <span className="text-xs text-slate-500 mt-1">
                  (Giữ Ctrl hoặc kéo thả để chọn 8-10 ảnh)
                </span>
              </label>

              <input
                type="file"
                id="upload"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />

              {previewImages.length > 0 && (
                <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {previewImages.map((src, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group"
                    >
                      <img
                        src={src}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center">
                <AlertTriangle size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Đánh giá mức độ
                </h2>
                <p className="text-slate-500 text-sm">
                  Ước lượng tình trạng ảnh hưởng
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-bold text-slate-700">
                  Tỉ lệ cây bệnh
                </label>

                <span className="text-green-700 font-extrabold">
                  {report.spreadRate}%
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={report.spreadRate}
                className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                onChange={(e) =>
                  setReport({ ...report, spreadRate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Mức độ ảnh hưởng
              </label>

              <div className="grid grid-cols-3 gap-3">
                {["Nhẹ", "TB", "Nặng"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`py-3 rounded-2xl text-sm font-extrabold transition-all ${report.severity === lvl
                        ? "bg-green-600 text-white shadow-lg shadow-green-200"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-green-50"
                      }`}
                    onClick={() => setReport({ ...report, severity: lvl })}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Ghi chú thêm
              </label>

              <textarea
                value={report.note}
                placeholder="Nhập mô tả triệu chứng nếu có..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 min-h-[110px]"
                onChange={(e) =>
                  setReport({ ...report, note: e.target.value })
                }
              />
            </div>
          </section>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="mr-2" size={20} /> Gửi báo cáo
          </button>
        </form>

        <aside className="space-y-6">
          <div className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7">
            <h3 className="text-xl font-extrabold text-slate-900 mb-3">
              Hướng dẫn khai báo
            </h3>

            <div className="space-y-4 text-sm text-slate-600 font-medium">
              <p>
                1. Nhập Mã ND, hệ thống sẽ tự động xác định{" "}
                <strong>Thửa</strong>.
              </p>
              <p>
                2. Chọn <strong>Luống</strong> muốn báo cáo (Luống 1 hoặc Luống
                2).
              </p>
              <p>3. Chọn màu sắc đánh giá hiện trạng của luống đó.</p>
              <p>
                4. Chụp và tải lên đúng{" "}
                <span className="text-red-500 font-bold">8 đến 10 ảnh</span>{" "}
                rõ nét khu vực bệnh.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-extrabold text-slate-900">
                Ảnh tham khảo
              </h3>

              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {report.cropType}
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingRef ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Loader2 className="animate-spin mb-2" size={28} />
                  <p className="text-sm">Đang tải ảnh từ cơ sở dữ liệu...</p>
                </div>
              ) : referenceImages.length > 0 ? (
                referenceImages.map((disease, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-green-200 transition-colors"
                  >
                    <img
                      src={disease.imgUrl}
                      alt={disease.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleOpenDiseaseGallery(disease.name)}
                    />

                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {disease.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {disease.desc}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <p className="text-sm font-medium text-slate-500">
                    Chưa có ảnh nào được duyệt cho loại cây này.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Kho ảnh bệnh:{" "}
                  <span className="text-emerald-600">{galleryTitle}</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Các hình ảnh thực tế đã được cán bộ kỹ thuật xác nhận
                </p>
              </div>

              <button
                className="text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full transition-colors shadow-sm"
                onClick={() => setIsGalleryOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 80px)" }}
            >
              {isLoadingGallery ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">
                    Đang tải dữ liệu ảnh...
                  </p>
                </div>
              ) : diseaseGallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {diseaseGallery.map((imgUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-2xl overflow-hidden group relative cursor-pointer shadow-sm border border-slate-100"
                      onClick={() => setZoomedImage(imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={`Ảnh ${galleryTitle} ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">
                    Chưa có ảnh chi tiết nào cho bệnh này.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl w-full flex items-center justify-center">
            <button
              className="absolute -top-12 right-0 md:-right-12 text-white hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImage(null);
              }}
            >
              <X size={28} />
            </button>

            <img
              src={zoomedImage}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerPage;