require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');

const admins = [
    {
        username: 'admin1',
        password: 'admin123',
        fullName: 'Nguyễn Minh',
        email: 'nminh174904@gmail.com',
        phone: '',
        role: 'Admin'
    },
    {
        username: 'admin2',
        password: 'admin123',
        fullName: 'Nguyễn Phú Quang',
        email: 'quangklvn2k4@gmail.com',
        phone: '',
        role: 'Admin'
    },
    {
        username: 'admin3',
        password: 'admin123',
        fullName: 'Lê Thành Đạt',
        email: 'datle5119@gmail.com',
        phone: '',
        role: 'Admin'
    }
];

const seedAdmins = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('Thiếu MONGO_URI trong file .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log('Đã kết nối MongoDB');
        console.log('Database đang dùng:', mongoose.connection.name);

        for (const adminData of admins) {
            const adminExists = await User.findOne({
                $or: [
                    { username: adminData.username },
                    { email: adminData.email.toLowerCase() }
                ]
            });

            if (adminExists) {
                console.log(`Admin đã tồn tại, bỏ qua: ${adminData.username}`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);

            const admin = await User.create({
                username: adminData.username,
                password: hashedPassword,
                fullName: adminData.fullName,
                email: adminData.email.toLowerCase(),
                phone: adminData.phone,
                role: 'Admin'
            });

            console.log('Tạo Admin thành công:', admin.username);
        }

        console.log('Hoàn tất tạo 3 tài khoản Admin.');
        console.log('Mật khẩu mặc định của cả 3 Admin: admin123');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Lỗi tạo Admin:', error.message);

        await mongoose.connection.close();
        process.exit(1);
    }
};

seedAdmins();