import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    Image as ImageIcon,
    MessageSquare,
    Leaf,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const REPORT_API_URL = "http://localhost:5000/api/reports";

const FarmerNotificationPage = () => {
    const [searchParams] = useSearchParams();

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const defaultFarmerId =
        searchParams.get("farmerId") ||
        localStorage.getItem("lastFarmerId") ||
        user.farmerCode ||
        "";

    const [farmerId, setFarmerId] = useState(defaultFarmerId);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);

            const res = await fetch(REPORT_API_URL);
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Không lấy được thông báo kết quả!");
                return;
            }

            const code = farmerId.trim().toUpperCase();

            const filteredReports = Array.isArray(data)
                ? data.filter((report) => {
                    const sameFarmer =
                        report.farmerId?.trim().toUpperCase() === code;

                    const hasResult =
                        report.isVerified ||
                        report.images?.some(
                            (image) =>
                                image.status === "confirmed" ||
                                image.status === "wrong" ||
                                image.diseaseLabel
                        );

                    return sameFarmer && hasResult;
                })
                : [];

            setReports(filteredReports);
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!farmerId.trim()) return;

        fetchReports();

        const intervalId = setInterval(() => {
            fetchReports();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [farmerId]);

    const getImageStatus = (status) => {
        if (status === "confirmed") {
            return {
                label: "Đã xác nhận",
                className: "bg-green-100 text-green-700",
                icon: <CheckCircle size={16} />,
            };
        }

        if (status === "wrong") {
            return {
                label: "Sai bệnh",
                className: "bg-red-100 text-red-600",
                icon: <XCircle size={16} />,
            };
        }

        return {
            label: "Đang chờ",
            className: "bg-yellow-100 text-yellow-700",
            icon: <Clock size={16} />,
        };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 pb-12">
            <header className="bg-white/90 backdrop-blur border-b border-green-100 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/farmer"
                            className="w-11 h-11 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl flex items-center justify-center"
                        >
                            <ArrowLeft size={23} />
                        </Link>

                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
                                Thông báo kết quả
                            </h1>
                            <p className="text-sm text-slate-500">
                                Kết quả sau khi kỹ thuật viên gán nhãn bệnh
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold">
                        <Bell size={18} />
                        Thông báo
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 mt-8 space-y-6">
                <section className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center">
                                <Leaf size={26} />
                            </div>

                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900">
                                    Kết quả báo cáo của bạn
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    Nhập mã nông dân để xem kết quả mới nhất.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={farmerId}
                                placeholder="VD: NN01"
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    setFarmerId(value);
                                    localStorage.setItem("lastFarmerId", value);
                                }}
                                className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 uppercase font-bold"
                            />

                            <button
                                onClick={fetchReports}
                                className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-4 rounded-2xl"
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>
                </section>

                {loading && reports.length === 0 ? (
                    <section className="bg-white rounded-[28px] border border-green-100 p-8 text-slate-500">
                        Đang tải thông báo...
                    </section>
                ) : reports.length === 0 ? (
                    <section className="bg-white rounded-[28px] border border-green-100 p-10 text-center">
                        <Bell className="mx-auto text-slate-300 mb-4" size={58} />

                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                            Chưa có thông báo kết quả
                        </h2>

                        <p className="text-slate-500">
                            Khi kỹ thuật viên gán nhãn hoặc xác nhận ảnh, kết quả sẽ hiển thị tại đây.
                        </p>
                    </section>
                ) : (
                    reports.map((report) => (
                        <section
                            key={report._id}
                            className="bg-white rounded-[28px] border border-green-100 shadow-xl shadow-green-100/60 p-7"
                        >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">
                                        Báo cáo {report.cropType}
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-slate-600 font-medium">
                                        <p>
                                            <strong>Mã nông dân:</strong> {report.farmerId}
                                        </p>

                                        <p>
                                            <strong>Thửa / Luống:</strong> {report.plotId}
                                        </p>

                                        <p>
                                            <strong>Tỉ lệ bệnh:</strong> {report.spreadRate}%
                                        </p>

                                        <p>
                                            <strong>Mức độ:</strong> {report.severity}
                                        </p>

                                        <p>
                                            <strong>Ngày gửi:</strong>{" "}
                                            {report.createdAt
                                                ? new Date(report.createdAt).toLocaleString("vi-VN")
                                                : "—"}
                                        </p>

                                        <p>
                                            <strong>Cập nhật:</strong>{" "}
                                            {report.updatedAt
                                                ? new Date(report.updatedAt).toLocaleString("vi-VN")
                                                : "—"}
                                        </p>
                                    </div>
                                </div>

                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-extrabold">
                                    Đã có kết quả
                                </span>
                            </div>

                            {report.technicianNote && (
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                                    <div className="flex items-center gap-2 text-blue-700 font-extrabold mb-2">
                                        <MessageSquare size={20} />
                                        Ghi chú kỹ thuật viên
                                    </div>

                                    <p className="text-slate-700 font-medium">
                                        {report.technicianNote}
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <ImageIcon className="text-green-600" size={22} />
                                    <h3 className="text-xl font-extrabold text-slate-900">
                                        Kết quả từng ảnh
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {report.images?.map((image, index) => {
                                        const statusInfo = getImageStatus(image.status);

                                        return (
                                            <div
                                                key={index}
                                                className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50"
                                            >
                                                <div className="aspect-video bg-slate-100">
                                                    <img
                                                        src={image.imageUrl}
                                                        alt={`Ảnh báo cáo ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="p-4 space-y-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-extrabold text-slate-900">
                                                            Ảnh {index + 1}
                                                        </p>

                                                        <span
                                                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${statusInfo.className}`}
                                                        >
                                                            {statusInfo.icon}
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500">
                                                            Nhãn bệnh
                                                        </p>

                                                        <p className="font-extrabold text-slate-800">
                                                            {image.diseaseLabel || "Chưa có nhãn"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    ))
                )}
            </main>
        </div>
    );
};

export default FarmerNotificationPage;