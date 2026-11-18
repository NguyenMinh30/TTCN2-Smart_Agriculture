// Đọc biến môi trường trong file .env.
// Ví dụ: MONGO_URI dùng để kết nối MongoDB.
require('dotenv').config();

// Import mongoose để kết nối và thao tác với MongoDB.
const mongoose = require('mongoose');

// Import bcryptjs để mã hóa mật khẩu trước khi lưu database.
const bcrypt = require('bcryptjs');

// Import model User để tạo tài khoản Admin trong collection users.
const User = require('./models/user.model');

// Mảng admins chứa danh sách tài khoản Admin cần tạo sẵn.
// Dấu [] là mảng.
// Mỗi phần tử trong mảng là một đối tượng được bọc bởi dấu {}.
const admins = [
    {
        // username là tài khoản đăng nhập của Admin.
        username: 'admin1',

        // password là mật khẩu ban đầu.
        // Lưu ý: mật khẩu này sẽ được hash trước khi lưu database.
        password: 'admin123',

        // Họ tên Admin.
        fullName: 'Nguyễn Minh',

        // Email Admin.
        email: 'nminh174904@gmail.com',

        // Số điện thoại, hiện đang để trống.
        phone: '',

        // role là quyền của tài khoản.
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

// Hàm seedAdmins dùng để tạo các tài khoản Admin ban đầu.
// async nghĩa là trong hàm có dùng await để chờ tác vụ bất đồng bộ.
const seedAdmins = async () => {
    try {
        // Kiểm tra biến MONGO_URI có tồn tại trong file .env không.
        // Nếu thiếu MONGO_URI thì không thể kết nối database.
        if (!process.env.MONGO_URI) {
            // console.error dùng để in lỗi ra terminal.
            console.error('Thiếu MONGO_URI trong file .env');

            // process.exit(1) kết thúc chương trình với trạng thái lỗi.
            process.exit(1);
        }

        // Kết nối tới MongoDB bằng đường dẫn trong biến môi trường MONGO_URI.
        await mongoose.connect(process.env.MONGO_URI);

        // In thông báo đã kết nối database.
        console.log('Đã kết nối MongoDB');

        // In tên database hiện tại đang dùng.
        console.log('Database đang dùng:', mongoose.connection.name);

        // Duyệt từng adminData trong mảng admins.
        // for...of dùng để lấy từng phần tử của mảng.
        for (const adminData of admins) {
            // Tìm xem Admin đã tồn tại chưa.
            // $or nghĩa là chỉ cần username hoặc email trùng thì coi là đã tồn tại.
            const adminExists = await User.findOne({
                $or: [
                    { username: adminData.username },
                    { email: adminData.email.toLowerCase() }
                ]
            });

            // Nếu adminExists có dữ liệu nghĩa là tài khoản đã tồn tại.
            if (adminExists) {
                // In thông báo bỏ qua tài khoản đã có.
                console.log(`Admin đã tồn tại, bỏ qua: ${adminData.username}`);

                // continue nghĩa là bỏ qua vòng lặp hiện tại và chuyển sang admin tiếp theo.
                continue;
            }

            // Tạo salt để tăng độ an toàn khi mã hóa mật khẩu.
            // Số 10 là độ phức tạp của thuật toán hash.
            const salt = await bcrypt.genSalt(10);

            // Hash mật khẩu adminData.password với salt vừa tạo.
            const hashedPassword = await bcrypt.hash(adminData.password, salt);

            // Tạo Admin mới trong database.
            const admin = await User.create({
                username: adminData.username,

                // Lưu mật khẩu đã hash, không lưu mật khẩu gốc.
                password: hashedPassword,

                fullName: adminData.fullName,

                // Chuyển email về chữ thường để tránh trùng email do viết hoa/thường.
                email: adminData.email.toLowerCase(),

                phone: adminData.phone,

                // Gán quyền Admin.
                role: 'Admin'
            });

            // In ra username của Admin vừa tạo thành công.
            console.log('Tạo Admin thành công:', admin.username);
        }

        // Sau khi duyệt xong toàn bộ mảng admins thì in thông báo hoàn tất.
        console.log('Hoàn tất tạo 3 tài khoản Admin.');

        // In mật khẩu mặc định để người chạy biết.
        console.log('Mật khẩu mặc định của cả 3 Admin: admin123');

        // Đóng kết nối MongoDB sau khi tạo xong.
        await mongoose.connection.close();

        // Kết thúc chương trình với trạng thái thành công.
        process.exit(0);
    } catch (error) {
        // Nếu có lỗi trong try thì chạy vào catch.
        // error.message là nội dung lỗi ngắn gọn.
        console.error('Lỗi tạo Admin:', error.message);

        // Đóng kết nối MongoDB dù có lỗi.
        await mongoose.connection.close();

        // Kết thúc chương trình với trạng thái lỗi.
        process.exit(1);
    }
};

// Gọi hàm seedAdmins để bắt đầu tạo tài khoản Admin.
seedAdmins();