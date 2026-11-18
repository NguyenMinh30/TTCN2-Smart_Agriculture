// Import mongoose để tạo Schema và Model làm việc với MongoDB
const mongoose = require('mongoose');

/*
    UserSchema:
    - Đây là cấu trúc dữ liệu chung cho tất cả tài khoản trong hệ thống.
    - Một bảng User dùng chung cho:
      + Admin
      + Technician: Kỹ thuật viên
      + Farmer: Nông dân
      + Manager: Chủ HTX
*/
const UserSchema = new mongoose.Schema({
    // Tên đăng nhập
    username: {
        type: String,
        required: true, // Bắt buộc phải có
        unique: true,   // Không được trùng username
        trim: true      // Tự động xóa khoảng trắng đầu/cuối
    },

    // Mật khẩu đã được mã hóa bằng bcrypt
    password: {
        type: String,
        required: true
    },

    // Họ tên người dùng
    fullName: {
        type: String,
        trim: true
    },

    // Email người dùng
    email: {
        type: String,
        unique: true,   // Không được trùng email
        sparse: true,   // Cho phép một số user không có email mà không bị lỗi unique
        trim: true,
        lowercase: true // Tự động chuyển email về chữ thường
    },

    // Số điện thoại
    phone: {
        type: String,
        trim: true
    },

    // Địa chỉ
    address: {
        type: String,
        trim: true
    },

    /*
        role là quyền/tư cách của tài khoản.
        Chỉ được nhận một trong bốn giá trị dưới đây.
    */
    role: {
        type: String,
        enum: ['Admin', 'Technician', 'Farmer', 'Manager'],
        required: true
    },

    /*
        farmerCode:
        - Mã nông dân.
        - Chỉ tài khoản Farmer mới cần trường này.
        - Dùng làm username khi nông dân đăng nhập.
    */
    farmerCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    /*
        fieldCode:
        - Mã thửa ruộng của nông dân.
        - Chỉ Farmer mới có.
        - Được dùng để quản lý nông dân theo thửa ruộng.
    */
    fieldCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    /*
        createdByManager:
        - Lưu ID của Chủ HTX đã upload/tạo nông dân này.
        - Nhờ trường này, Chủ HTX chỉ xem được nông dân do chính mình upload.
    */
    createdByManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    /*
        mustChangePassword:
        - true: người dùng nên đổi mật khẩu sau khi đăng nhập lần đầu.
        - Ví dụ Admin tạo tài khoản mới thì mật khẩu mặc định là username.
        - Sau khi user đổi mật khẩu, trường này chuyển thành false.
    */
    mustChangePassword: {
        type: Boolean,
        default: false
    },

    // Token OTP dùng cho chức năng quên mật khẩu
    resetPasswordToken: String,

    // Thời gian hết hạn của OTP
    resetPasswordExpires: Date

    // timestamps tự động tạo createdAt và updatedAt
}, { timestamps: true });

// Tạo model User để thao tác với collection users trong MongoDB
module.exports = mongoose.model('User', UserSchema);