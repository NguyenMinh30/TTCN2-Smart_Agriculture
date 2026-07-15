const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    fullName: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },

    phone: {
        type: String,
        trim: true
    },

    address: {
        type: String,
        trim: true
    },

    role: {
        type: String,
        enum: ['Admin', 'Technician', 'Farmer', 'Manager'],
        required: true
    },

    // Mã nông dân, chỉ Farmer có
    farmerCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    // Mã thửa ruộng, chỉ Farmer có
    fieldCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    // Chủ HTX đã upload nông dân này
    createdByManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Khi true thì sau khi đăng nhập nên yêu cầu đổi mật khẩu
    mustChangePassword: {
        type: Boolean,
        default: false
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);