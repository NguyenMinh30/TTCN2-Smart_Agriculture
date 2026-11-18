require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. IMPORT CẤU HÌNH CLOUDINARY
const uploadCloudinary = require('./config/cloudinary'); 
const Report = require('./models/Report');
const cloudinary = require('cloudinary').v2;

console.log("Kiểm tra API Key:", process.env.CLOUDINARY_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//STATIC FOLDER
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/authRoutes.router');
app.use('/api/auth', authRoutes);

//CONNECT MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Đã kết nối MongoDB thành công!");
  })
  .catch((err) => {
    console.log("❌ Lỗi kết nối:", err);
  });

//POST REPORT
//NÔNG DÂN GỬI BÁO CÁO
app.post(
  '/api/reports',
  uploadCloudinary.array('images', 10),
  async (req, res) => {
    try {
      // req.files do Cloudinary trả về
      const images = req.files
      ? req.files.map(file => ({
      imageUrl: file.path,
      publicId: file.filename,
      diseaseLabel: "",
      status: "pending"
      }))
      : [];

      const newReport = new Report({
      farmerId: req.body.farmerId,
      plotId: req.body.plotId,
      plotStatus: req.body.plotStatus,
      cropType: req.body.cropType,
      spreadRate: req.body.spreadRate,
      severity: req.body.severity,
      note: req.body.note,
      images
    });

      const savedReport = await newReport.save();
      console.log("📩 Đã nhận báo cáo mới với ảnh Cloudinary");
      res.status(201).json(savedReport);

    } catch (err) {
      console.error("Lỗi khi lưu báo cáo:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

//GET ALL REPORTS
//CÁN BỘ KỸ THUẬT
app.get('/api/reports', async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const reports = await Report.find({
      cropType: {
        $regex: keyword,
        $options: "i"
      }
    }).sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//UPDATE REPORT
app.put('/api/reports/:id', async (req, res) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ROUTE BỔ SUNG: XÁC NHẬN + GÁN NHÃN THEO TỪNG ẢNH
app.put('/api/reports/:reportId/images/:imageIndex/confirm', async (req, res) => {
  try {
    const { diseaseLabel, technicianNote } = req.body;
    const imageIndex = parseInt(req.params.imageIndex);

    const updateData = {
      [`images.${imageIndex}.diseaseLabel`]: diseaseLabel,
      [`images.${imageIndex}.status`]: "confirmed",
      technicianNote: technicianNote || "",
      isVerified: true
    };

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.reportId,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Không tìm thấy báo cáo" });
    }

    res.json(updatedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ROUTE BỔ SUNG: ĐÁNH DẤU SAI BỆNH THEO TỪNG ẢNH
app.put('/api/reports/:reportId/images/:imageIndex/wrong', async (req, res) => {
  try {
    const imageIndex = parseInt(req.params.imageIndex);

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.reportId,
      { $set: { [`images.${imageIndex}.status`]: "wrong" } },
      { new: true, runValidators: false }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Không tìm thấy báo cáo" });
    }

    // Trả về đúng cấu trúc { message, report } mà Front-end đang chờ nhận
    res.json({
      message: "Đã đánh dấu sai bệnh",
      report: updatedReport
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ROUTE BỔ SUNG: BIỂU ĐỒ 7 NGÀY - TÍNH % BỆNH TRUNG BÌNH
app.get('/api/reports/weekly-trend', async (req, res) => {
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

      // Lọc các báo cáo trong ngày hôm nay
      const dayReports = reports.filter(report => {
        const createdAt = new Date(report.createdAt);
        return createdAt >= start && createdAt <= end;
      });

      let averageSpreadRate = 0;

      if (dayReports.length > 0) {
        // Tính tổng tất cả spreadRate của ngày hôm đó
        const totalRate = dayReports.reduce((sum, report) => {
          const rate = parseFloat(report.spreadRate) || 0;
          return sum + rate;
        }, 0);

        // Tính trung bình cộng (Làm tròn thành số nguyên)
        averageSpreadRate = Math.round(totalRate / dayReports.length);
      }

      trend.push({
        day: daysOfWeek[day.getDay()], 
        count: averageSpreadRate // Số % bệnh trung bình thực tế (0 - 100)
      });
    }

    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//DELETE REPORT (Xóa luôn ảnh trên Cloudinary)
app.delete('/api/reports/:id', async (req, res) => {
  try {
    // 1. Tìm báo cáo trong DB trước khi xóa để lấy danh sách link ảnh
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Không tìm thấy báo cáo" });
    }

    // 2. Kiểm tra nếu báo cáo có ảnh thì tiến hành xóa trên Cloudinary
    if (report.images && report.images.length > 0) {
      for (const img of report.images) {
        if (img.imageUrl) {
          const publicId = getPublicIdFromUrl(img.imageUrl);
          if (publicId) {
            // Lệnh gọi API của Cloudinary để xóa file
            await cloudinary.uploader.destroy(publicId);
            console.log(`🗑️ Đã xóa ảnh trên Cloudinary: ${publicId}`);
          }
        }
      }
    }

    // 3. Sau khi dọn dẹp ảnh xong thì xóa báo cáo khỏi MongoDB
    await Report.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Đã xóa thành công báo cáo và ảnh đính kèm!" });
  } catch (err) {
    console.error("Lỗi khi xóa báo cáo:", err);
    res.status(500).json({ error: err.message });
  }
});

//ROUTE BỔ SUNG: LẤY KHO ẢNH THAM KHẢO (ĐÃ GÁN NHÃN TỪ CÁN BỘ)
app.get('/api/reference-images', async (req, res) => {
  try {
    const { cropType } = req.query;

    // 1. Lọc các báo cáo theo loại cây (nếu có truyền lên)
    const query = {};
    if (cropType) {
      query.cropType = { $regex: new RegExp(`^${cropType}$`, "i") };
    }

    const reports = await Report.find(query).sort({ createdAt: -1 });

    // 2. Dùng Map để lọc ra các bệnh độc nhất
    const uniqueDiseases = new Map();

    reports.forEach(report => {
      if (report.images && Array.isArray(report.images)) {
        report.images.forEach(img => {
          // Chỉ lấy những ảnh đã được cán bộ kỹ thuật xác nhận và có tên bệnh
          if (img.status === "confirmed" && img.diseaseLabel) {
            
            // Nếu bệnh này chưa có trong danh sách hiển thị, thì thêm vào
            if (!uniqueDiseases.has(img.diseaseLabel)) {
              uniqueDiseases.set(img.diseaseLabel, {
                name: img.diseaseLabel,
                desc: report.note || "Ảnh bệnh đã được cán bộ kỹ thuật xác nhận từ thực địa.",
                imgUrl: img.imageUrl 
              });
            }
          }
        });
      }
    });

    // 3. Chuyển đổi Map thành mảng để gửi về Frontend
    const referenceImages = Array.from(uniqueDiseases.values());
    res.json(referenceImages);
  } catch (err) {
    console.error("Lỗi khi tải kho ảnh tham khảo:", err);
    res.status(500).json({ error: err.message });
  }
});

//ROUTE BỔ SUNG: XÓA 1 BỨC ẢNH LẺ TRONG KHO ẢNH (DÙNG PUBLIC_ID)
app.delete('/api/reports/:reportId/image', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { imageUrl } = req.body; // Lấy URL từ body do Axios gửi lên

    if (!imageUrl) {
      return res.status(400).json({ message: "Không tìm thấy URL ảnh cần xóa" });
    }

    // 1. Tìm báo cáo trong MongoDB để lôi ra thông tin ảnh
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo chứa bức ảnh này" });
    }

    // Tìm object ảnh khớp với imageUrl trong mảng images
    const imageTarget = report.images.find(img => img.imageUrl === imageUrl);
    if (!imageTarget) {
      return res.status(404).json({ message: "Ảnh này không tồn tại trong báo cáo" });
    }

    // 2. Tiến hành xóa file vật lý trên mây Cloudinary bằng publicId
    if (imageTarget.publicId) {
      console.log(`[Cloudinary] Bắt đầu xóa ảnh có publicId: ${imageTarget.publicId}`);
      const cloudinaryResponse = await cloudinary.uploader.destroy(imageTarget.publicId);
      console.log(`[Cloudinary] Kết quả xóa:`, cloudinaryResponse.result);
    } else {
      console.warn("⚠️ Ảnh này không có publicId trong DB (Có thể là ảnh cũ hệ thống tạo trước đó).");
    }

    // 3. Tiến hành gỡ bỏ bức ảnh đó ra khỏi mảng dữ liệu MongoDB
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      { $pull: { images: { imageUrl: imageUrl } } },
      { new: true }
    );

    // Trả về kết quả thành công cho Frontend nhận diện
    res.status(200).json({
      message: "Đã xóa ảnh khỏi hệ thống thành công!",
      report: updatedReport
    });

  } catch (err) {
    console.error("Lỗi khi xử lý xóa ảnh đơn lẻ:", err);
    res.status(500).json({ message: "Lỗi Server Nội Bộ", error: err.message });
  }
});

//ROUTE: LẤY TỐI ĐA 10 ẢNH ĐÃ XÁC NHẬN CỦA 1 LOẠI BỆNH CỤ THỂ
app.get('/api/reports/disease-images', async (req, res) => {
  try {
    const { label } = req.query;
    if (!label) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên bệnh (label)" });
    }

    // Tìm tất cả báo cáo có chứa ảnh đã xác nhận thuộc bệnh này
    const reports = await Report.find({ 
      "images.diseaseLabel": label, 
      "images.status": "confirmed" 
    }).sort({ createdAt: -1 });

    let matchedImages = [];

    // Lọc ra các URL ảnh khớp chính xác
    reports.forEach(report => {
      report.images.forEach(img => {
        if (img.diseaseLabel === label && img.status === "confirmed") {
          matchedImages.push(img.imageUrl);
        }
      });
    });

    // Chỉ lấy tối đa 10 ảnh mới nhất
    const top10Images = matchedImages.slice(0, 10);
    res.json(top10Images);

  } catch (err) {
    console.error("Lỗi khi tải bộ sưu tập ảnh bệnh:", err);
    res.status(500).json({ error: err.message });
  }
});

//TEST API
app.get('/', (req, res) => {
  res.json({ message: 'Server Running' });
});

//GLOBAL ERROR HANDLER
//(Bắt mọi lỗi từ multer/cloudinary để không bị trả về HTML rác)
app.use((err, req, res, next) => {
  console.error("Lỗi Server Toàn Cục:", err.message);
  res.status(500).json({ error: err.message || "Lỗi nội bộ Server" });
});

//START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port ${PORT}`);
});