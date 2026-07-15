const Report = require("../models/Report");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/*
=================================
LẤY DANH SÁCH BÁO CÁO
=================================
*/
exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
=================================
XÁC NHẬN + GÁN NHÃN THEO ẢNH
=================================
*/
exports.confirmImage = async (req, res) => {
    try {
        const { diseaseLabel, technicianNote } = req.body;
        const imageIndex = parseInt(req.params.imageIndex);

        // Kiểm tra xem báo cáo có tồn tại không trước khi update
        const checkReport = await Report.findById(req.params.reportId);
        if (!checkReport) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo" });
        }

        if (!checkReport.images || !checkReport.images[imageIndex]) {
            return res.status(404).json({ message: "Không tìm thấy ảnh tại vị trí này" });
        }

        // Cập nhật chuẩn xác phần tử trong mảng bằng toán tử $set của MongoDB
        const updateData = {
            [`images.${imageIndex}.diseaseLabel`]: diseaseLabel,
            [`images.${imageIndex}.status`]: "confirmed",
            technicianNote: technicianNote || "",
            isVerified: true
        };

        const updatedReport = await Report.findByIdAndUpdate(
            req.params.reportId,
            { $set: updateData },
            { new: true, runValidators: false } // runValidators: false để bỏ qua ép kiểu dữ liệu mẫu cũ bị lỗi
        );

        res.json(updatedReport);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
=================================
ĐÁNH DẤU SAI BỆNH THEO ẢNH
=================================
*/
exports.markWrongDisease = async (req, res) => {
    try {
        const imageIndex = parseInt(req.params.imageIndex);

        // Kiểm tra sự tồn tại của báo cáo và ảnh
        const checkReport = await Report.findById(req.params.reportId);
        if (!checkReport) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo" });
        }

        if (!checkReport.images || !checkReport.images[imageIndex]) {
            return res.status(404).json({ message: "Không tìm thấy ảnh tại vị trí này" });
        }

        const updatedReport = await Report.findByIdAndUpdate(
            req.params.reportId,
            { $set: { [`images.${imageIndex}.status`]: "wrong" } },
            { new: true, runValidators: false }
        );

        res.json({
            message: "Đã đánh dấu sai bệnh",
            report: updatedReport
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
=================================
ĐÁNH DẤU ĐÃ XỬ LÝ
=================================
*/
exports.resolveReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true, runValidators: false }
        );

        if (!report) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo" });
        }

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
=================================
THỐNG KÊ CHO CHỦ HTX
=================================
*/
exports.getDashboardStats = async (req, res) => {
    try {
        const reports = await Report.find();

        let confirmedImages = 0;
        let wrongImages = 0;

        reports.forEach(report => {
            if (report.images && Array.isArray(report.images)) {
                report.images.forEach(image => {
                    if (image.status === "confirmed") confirmedImages++;
                    if (image.status === "wrong") wrongImages++;
                });
            }
        });

        const severeReports = reports.filter(report => report.severity === "Nặng").length;

        res.json({
            totalReports: reports.length,
            severeReports,
            confirmedImages,
            wrongImages
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
=================================
SỐ HỘ DÂN BÁO CÁO
=================================
*/
exports.getOwnerStats = async (req, res) => {
    try {
        const reports = await Report.find();
        let householdCount = 0;

        reports.forEach(report => {
            const hasConfirmedImage = report.images && report.images.some(
                image => image.status === "confirmed"
            );

            if (hasConfirmedImage) {
                householdCount++;
            }
        });

        res.json({ householdCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
============================================================
BIỂU ĐỒ 7 NGÀY: THỐNG KÊ % MỨC ĐỘ BỆNH TRUNG BÌNH CỦA HTX
============================================================
*/
exports.getWeeklyTrend = async (req, res) => {
    try {
        const reports = await Report.find();
        const trend = [];
        const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

        for (let i = 6; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);

            const start = new Date(day);
            start.setHours(0, 0, 0, 0);

            const end = new Date(day);
            end.setHours(23, 59, 59, 999);

            // Lọc ra các báo cáo nằm trong ngày hôm nay
            const dayReports = reports.filter(report => {
                const createdAt = new Date(report.createdAt);
                return createdAt >= start && createdAt <= end;
            });

            let averageSpreadRate = 0;

            if (dayReports.length > 0) {
                // Tính tổng tất cả spreadRate của ngày hôm đó (ép kiểu số để tránh lỗi chuỗi)
                const totalRate = dayReports.reduce((sum, report) => {
                    const rate = parseFloat(report.spreadRate) || 0;
                    return sum + rate;
                }, 0);

                // Tính trung bình cộng (Làm tròn thành số nguyên, ví dụ: 45)
                averageSpreadRate = Math.round(totalRate / dayReports.length);
            }

            trend.push({
                day: daysOfWeek[day.getDay()],
                count: averageSpreadRate // Giờ 'count' đóng vai trò là số % bệnh trung bình (0 - 100)
            });
        }

        res.json(trend);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/*
=================================
XÓA ẢNH (BẢN ĐÃ FIX LỖI PUBLIC_ID VÀ BỔ SUNG CHECK LOG)
=================================
*/
exports.deleteImage = async (req, res) => {
    try {

        const { imageUrl } = req.body;
        const reportId = req.params.id; // Lấy ID từ URL route /:id/image

        if (!imageUrl) {
            return res.status(400).json({ message: "Không tìm thấy URL ảnh cần xóa" });
        }

        // --- 1. TÁCH PUBLIC_ID CHUẨN XÁC HƠN ---
        const extractPublicId = (url) => {
            try {
                const parts = url.split('/');
                const uploadIndex = parts.findIndex(part => part === 'upload');
                if (uploadIndex === -1) return null;

                let idParts = parts.slice(uploadIndex + 1);

                // Loại bỏ version (ví dụ: v163456789)
                if (idParts[0].startsWith('v') && !isNaN(idParts[0].substring(1))) {
                    idParts.shift();
                }

                const pathWithExtension = idParts.join('/');

                // Cắt bỏ phần đuôi (.jpg, .png) từ dấu chấm CÙNG CÙNG, đề phòng tên file có dấu chấm
                const lastDotIndex = pathWithExtension.lastIndexOf('.');
                return lastDotIndex !== -1 ? pathWithExtension.substring(0, lastDotIndex) : pathWithExtension;
            } catch (err) {
                console.error("Lỗi regex tách public_id:", err);
                return null;
            }
        };

        const publicId = extractPublicId(imageUrl);
        if (!publicId) {
            return res.status(400).json({ message: "Không thể phân tích public_id từ URL" });
        }

        // Cấu hình Cloudinary (Giữ nguyên như của bạn)
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // --- 2. XÓA TRÊN CLOUDINARY & KIỂM TRA KẾT QUẢ ---
        const cloudinaryResponse = await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary] Yêu cầu xóa ${publicId} -> Kết quả:`, cloudinaryResponse.result);

        if (cloudinaryResponse.result !== 'ok') {
            console.warn(`⚠️ Cảnh báo: Không thể xóa trên Cloudinary. Lý do: ${cloudinaryResponse.result}`);
            // Nếu bạn muốn dừng luôn quá trình nếu Cloudinary lỗi thì bỏ comment dòng dưới:
            // return res.status(400).json({ message: "Lỗi xóa ảnh Cloudinary", reason: cloudinaryResponse.result });
        }

        // --- 3. XÓA TRONG MONGODB ---
        // Tối ưu: Dùng luôn req.params.id để tìm đúng Báo cáo đó và gỡ ảnh ra
        const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            { $pull: { images: { imageUrl: imageUrl } } },
            { new: true }
        );

        if (!updatedReport) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo chứa ảnh này" });
        }

        res.status(200).json({
            message: "Đã xóa ảnh thành công!",
            report: updatedReport,
            cloudinaryStatus: cloudinaryResponse.result
        });

    } catch (error) {
        console.error("Lỗi khi xóa ảnh:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};