const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({

  // Mã nông dân
  farmerId: {
    type: String,
    required: true
  },

  // Mã thửa ruộng
  plotId: {
    type: String,
    required: true
  },

  // Trạng thái ruộng
  plotStatus: {
    type: String,
    enum: [
      'normal',
      'warning',
      'danger'
    ],
    default: 'warning'
  },

  // Loại cây
  cropType: {
    type: String,
    required: true,
    enum: [
      'Cà chua',
      'Dưa chuột'
    ]
  },

  // Tỷ lệ nhiễm bệnh
  spreadRate: {
    type: Number,
    required: true
  },

  // Mức độ ảnh hưởng
  severity: {
    type: String,
    required: true,
    enum: [
      'Nhẹ',
      'TB',
      'Nặng'
    ]
  },

  // Ghi chú của nông dân
  note: {
    type: String,
    default: ''
  },

  /*
  =====================================
  DANH SÁCH ẢNH
  MỖI ẢNH CÓ NHÃN RIÊNG
  =====================================
  */

  images: [
    {
      imageUrl: {
        type: String,
        required: true
      },

      // TRƯỜNG MỚI THÊM ĐỂ LƯU MÃ XÓA ẢNH TRÊN CLOUDINARY
      publicId: {
        type: String,
        // Không để required: true ở đây để tránh làm lỗi các báo cáo cũ đã lưu trước đó không có trường này
      },

      diseaseLabel: {
        type: String,
        default: ''
      },

      status: {
        type: String,
        enum: [
          'pending',
          'confirmed',
          'wrong'
        ],
        default: 'pending'
      }
    }
  ],

  /*
  =====================================
  THÔNG TIN CHUNG CỦA BÁO CÁO
  =====================================
  */

  technicianNote: {
    type: String,
    default: ''
  },

  isVerified: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    'Report',
    ReportSchema
  );