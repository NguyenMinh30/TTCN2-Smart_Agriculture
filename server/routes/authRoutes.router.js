const express = require('express');
const router = express.Router();

// bcrypt dùng để mã hóa và so sánh mật khẩu
const bcrypt = require('bcryptjs');

// jwt dùng để tạo token đăng nhập
const jwt = require('jsonwebtoken');

// multer dùng để nhận file upload từ Frontend
const multer = require('multer');

// XLSX dùng để đọc dữ liệu trong file Excel
const XLSX = require('xlsx');

// crypto và nodemailer dùng cho chức năng quên mật khẩu
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Import model User để thao tác với collection users trong MongoDB
const User = require('../models/user.model');

// Import middleware kiểm tra đăng nhập và phân quyền
const { protect, authorize } = require('../middleware/authMiddleware');

/*
    Cấu hình multer:
    - memoryStorage nghĩa là file Excel không lưu vào thư mục server.
    - File được giữ tạm trong RAM dưới dạng buffer.
    - Sau đó XLSX đọc trực tiếp từ req.file.buffer.
    - Giới hạn file tối đa 5MB.
*/
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// =========================================================================
// API ĐĂNG NHẬP
// Đăng nhập bằng username hoặc email.
// Farmer đăng nhập bằng mã nông dân vì username = farmerCode.
// =========================================================================
router.post('/login', async (req, res) => {
    try {
        // Lấy username và password từ body Frontend gửi lên
        const { username, password } = req.body;

        // Nếu thiếu tài khoản hoặc mật khẩu thì báo lỗi
        if (!username || !password) {
            return res.status(400).json({
                error: 'Vui lòng nhập tài khoản/email và mật khẩu!'
            });
        }

        // Xóa khoảng trắng đầu/cuối
        const loginInput = username.trim();

        /*
            Tìm user theo:
            - username
            - hoặc email

            Với nông dân:
            username chính là farmerCode.
        */
        const user = await User.findOne({
            $or: [
                { username: loginInput },
                { email: loginInput.toLowerCase() }
            ]
        });

        // Nếu không tìm thấy user
        if (!user) {
            return res.status(400).json({
                error: 'Tài khoản hoặc Email không tồn tại!'
            });
        }

        // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
        const isMatch = await bcrypt.compare(password, user.password);

        // Nếu mật khẩu sai
        if (!isMatch) {
            return res.status(400).json({
                error: 'Mật khẩu không chính xác!'
            });
        }

        /*
            Tạo token đăng nhập.
            Token chứa:
            - id của user
            - role của user

            Token hết hạn sau 1 ngày.
        */
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Trả token và thông tin user về Frontend
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                farmerCode: user.farmerCode,
                fieldCode: user.fieldCode,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// =========================================================================
// ADMIN - TẠO TÀI KHOẢN KỸ THUẬT VIÊN / CHỦ HTX
// Chỉ Admin mới được gọi API này.
// Admin không nhập mật khẩu.
// Mật khẩu mặc định = username.
// =========================================================================
router.post('/admin/users', protect, authorize('Admin'), async (req, res) => {
    try {
        /*
            Lấy dữ liệu Frontend gửi lên.
            role chỉ được là:
            - Technician
            - Manager
        */
        const { username, fullName, email, phone, role } = req.body;

        // Admin chỉ được tạo Kỹ thuật viên hoặc Chủ HTX
        const allowedRoles = ['Technician', 'Manager'];

        // Nếu role gửi lên không hợp lệ thì báo lỗi
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                error: 'Admin chỉ được tạo tài khoản Kỹ thuật viên hoặc Chủ HTX!'
            });
        }

        // Kiểm tra dữ liệu bắt buộc
        if (!username || !fullName || !email || !role) {
            return res.status(400).json({
                error: 'Vui lòng nhập đầy đủ username, họ tên, email và chức vụ!'
            });
        }

        // Làm sạch dữ liệu
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        /*
            Kiểm tra username hoặc email đã tồn tại chưa.
            Nếu trùng thì không cho tạo.
        */
        const userExists = await User.findOne({
            $or: [
                { username: cleanUsername },
                { email: cleanEmail }
            ]
        });

        if (userExists) {
            return res.status(400).json({
                error: 'Username hoặc Email đã tồn tại!'
            });
        }

        /*
            Mật khẩu mặc định bằng username.
            Ví dụ username là kythuat01 thì password mặc định là kythuat01.
        */
        const defaultPassword = cleanUsername;

        // Mã hóa mật khẩu trước khi lưu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        // Tạo user mới
        const newUser = new User({
            username: cleanUsername,
            password: hashedPassword,
            fullName: fullName.trim(),
            email: cleanEmail,
            phone: phone || '',
            role,
            mustChangePassword: true
        });

        // Lưu user vào MongoDB
        await newUser.save();

        /*
            Trả kết quả về Frontend.
            defaultPassword trả về để Admin biết mật khẩu mặc định.
            Lưu ý: trong thực tế không nên hiển thị mật khẩu lâu dài.
        */
        res.status(201).json({
            message: 'Tạo tài khoản thành công!',
            user: {
                id: newUser._id,
                username: newUser.username,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                mustChangePassword: newUser.mustChangePassword,
                defaultPassword
            }
        });
    } catch (err) {
        // Lỗi trùng dữ liệu unique trong MongoDB
        if (err.code === 11000) {
            return res.status(400).json({
                error: 'Username hoặc Email đã tồn tại!'
            });
        }

        res.status(500).json({
            error: err.message
        });
    }
});

// =========================================================================
// ADMIN - LẤY DANH SÁCH KỸ THUẬT VIÊN / CHỦ HTX
// Chỉ Admin được xem danh sách này.
// =========================================================================
router.get('/admin/users', protect, authorize('Admin'), async (req, res) => {
    try {
        /*
            Tìm tất cả user có role là Technician hoặc Manager.
            Không lấy Admin và Farmer ở chức năng này.
        */
        const users = await User.find({
            role: { $in: ['Technician', 'Manager'] }
        })
            // Không trả mật khẩu và thông tin OTP về Frontend
            .select('-password -resetPasswordToken -resetPasswordExpires')

            // Sắp xếp tài khoản mới tạo lên trước
            .sort({ createdAt: -1 });

        // Trả danh sách user về Frontend
        res.json(users);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// =========================================================================
// ADMIN - SỬA TÀI KHOẢN KỸ THUẬT VIÊN / CHỦ HTX
// Chỉ Admin được sửa.
// Không sửa mật khẩu ở đây.
// Nếu quên mật khẩu thì dùng chức năng quên mật khẩu qua email.
// =========================================================================
router.put('/admin/users/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        // Lấy dữ liệu mới từ body
        const { username, fullName, email, phone, role } = req.body;

        // Admin chỉ được sửa user thuộc 2 quyền này
        const allowedRoles = ['Technician', 'Manager'];

        // Nếu có gửi role mới thì role đó phải hợp lệ
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({
                error: 'Admin chỉ được sửa tài khoản Kỹ thuật viên hoặc Chủ HTX!'
            });
        }

        // Tìm user theo id trên URL
        const user = await User.findById(req.params.id);

        // Nếu không có user
        if (!user) {
            return res.status(404).json({
                error: 'Không tìm thấy tài khoản!'
            });
        }

        /*
            Không cho sửa Admin hoặc Farmer trong chức năng này.
            Vì chức năng này chỉ quản lý Technician và Manager.
        */
        if (user.role === 'Admin' || user.role === 'Farmer') {
            return res.status(403).json({
                error: 'Không được sửa tài khoản Admin hoặc Nông dân ở chức năng này!'
            });
        }

        /*
            Nếu username mới khác username cũ:
            - Kiểm tra username mới có bị trùng với user khác không.
            - _id: { $ne: user._id } nghĩa là bỏ qua chính user hiện tại.
        */
        if (username && username.trim() !== user.username) {
            const usernameExists = await User.findOne({
                username: username.trim(),
                _id: { $ne: user._id }
            });

            if (usernameExists) {
                return res.status(400).json({
                    error: 'Username này đã tồn tại!'
                });
            }

            user.username = username.trim();
        }

        /*
            Nếu email mới khác email cũ:
            - Kiểm tra email mới có bị trùng với user khác không.
        */
        if (email && email.trim().toLowerCase() !== user.email) {
            const emailExists = await User.findOne({
                email: email.trim().toLowerCase(),
                _id: { $ne: user._id }
            });

            if (emailExists) {
                return res.status(400).json({
                    error: 'Email này đã tồn tại!'
                });
            }

            user.email = email.trim().toLowerCase();
        }

        // Cập nhật họ tên nếu có gửi lên
        if (fullName) {
            user.fullName = fullName.trim();
        }

        // Cập nhật số điện thoại, cho phép phone rỗng
        if (phone !== undefined) {
            user.phone = phone;
        }

        // Cập nhật role nếu có
        if (role) {
            user.role = role;
        }

        // Lưu thay đổi vào MongoDB
        await user.save();

        // Trả user sau khi cập nhật
        res.json({
            message: 'Cập nhật tài khoản thành công!',
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                error: 'Username hoặc Email đã tồn tại!'
            });
        }

        res.status(500).json({
            error: err.message
        });
    }
});

// =========================================================================
// ADMIN - XÓA TÀI KHOẢN KỸ THUẬT VIÊN / CHỦ HTX
// Chỉ Admin được xóa.
// Không cho xóa Admin hoặc Farmer bằng API này.
// =========================================================================
router.delete('/admin/users/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        // Tìm user cần xóa theo id
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                error: 'Không tìm thấy tài khoản!'
            });
        }

        /*
            Chặn xóa Admin và Farmer.
            API này chỉ dành cho Technician và Manager.
        */
        if (user.role === 'Admin' || user.role === 'Farmer') {
            return res.status(403).json({
                error: 'Không được xóa tài khoản Admin hoặc Nông dân ở chức năng này!'
            });
        }

        // Xóa user khỏi MongoDB
        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: 'Xóa tài khoản thành công!'
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// =========================================================================
// CHỦ HTX - UPLOAD EXCEL DANH SÁCH HỘ NÔNG DÂN
// Chỉ tài khoản Manager mới được upload.
// Upload xong hệ thống tự tạo tài khoản Farmer trong database.
//
// Các cột Excel được hỗ trợ:
// Mã Nông Dân | Họ Tên | Mã Thửa Ruộng | Email | SDT | Địa chỉ
// Mã số | Họ tên | Mã thửa | Email | Sdt | Địa chỉ
// farmerCode | fullName | fieldCode | email | phone | address
//
// Tài khoản nông dân tạo ra:
// username = farmerCode
// password mặc định = farmerCode
// =========================================================================
router.post(
    '/manager/farmers/upload',

    // Bắt buộc phải đăng nhập
    protect,

    // Chỉ Chủ HTX mới được gọi API này
    authorize('Manager'),

    // Nhận 1 file từ Frontend, tên field phải là "file"
    upload.single('file'),

    async (req, res) => {
        try {
            // Nếu không có file Excel gửi lên thì báo lỗi
            if (!req.file) {
                return res.status(400).json({
                    error: 'Vui lòng chọn file Excel!'
                });
            }

            /*
                Đọc file Excel từ buffer.
                Vì multer đang dùng memoryStorage nên file nằm trong req.file.buffer.
            */
            const workbook = XLSX.read(req.file.buffer, {
                type: 'buffer'
            });

            // Lấy tên sheet đầu tiên trong file Excel
            const sheetName = workbook.SheetNames[0];

            // Lấy dữ liệu của sheet đầu tiên
            const worksheet = workbook.Sheets[sheetName];

            /*
                Chuyển sheet Excel thành mảng object.
                Mỗi dòng trong Excel thành 1 object.
                defval: '' giúp ô trống vẫn có giá trị rỗng,
                tránh bị undefined.
            */
            const rows = XLSX.utils.sheet_to_json(worksheet, {
                defval: ''
            });

            // Nếu Excel không có dòng dữ liệu nào
            if (!rows.length) {
                return res.status(400).json({
                    error: 'File Excel không có dữ liệu!'
                });
            }

            /*
                Hàm normalizeKey:
                - Chuẩn hóa tên cột Excel.
                - Chuyển chữ hoa thành chữ thường.
                - Bỏ dấu tiếng Việt.
                - Đổi đ thành d.
                - Xóa khoảng trắng thừa.

                Mục đích:
                Giúp hệ thống đọc được nhiều kiểu tên cột khác nhau.
                Ví dụ:
                "Mã Nông Dân" -> "ma nong dan"
                "Ma Nong Dan" -> "ma nong dan"
            */
            const normalizeKey = (key) => {
                return String(key)
                    .trim()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/\s+/g, ' ');
            };

            /*
                Hàm getValue:
                - Nhận vào 1 dòng Excel và danh sách các tên cột có thể dùng.
                - Chuẩn hóa tất cả tên cột của dòng đó.
                - Tìm cột nào khớp với danh sách possibleKeys thì lấy giá trị.

                Ví dụ cần lấy mã nông dân:
                possibleKeys gồm:
                farmerCode, Mã nông dân, Ma nong dan, Mã số...
            */
            const getValue = (row, possibleKeys) => {
                const normalizedRow = {};

                // Chuẩn hóa toàn bộ tên cột của dòng Excel
                Object.keys(row).forEach((key) => {
                    normalizedRow[normalizeKey(key)] = row[key];
                });

                // Duyệt danh sách tên cột có thể chấp nhận
                for (const key of possibleKeys) {
                    const normalizedKey = normalizeKey(key);

                    // Nếu tìm thấy cột và giá trị không rỗng thì trả về
                    if (
                        normalizedRow[normalizedKey] !== undefined &&
                        normalizedRow[normalizedKey] !== null &&
                        String(normalizedRow[normalizedKey]).trim() !== ''
                    ) {
                        return String(normalizedRow[normalizedKey]).trim();
                    }
                }

                // Nếu không tìm thấy thì trả về chuỗi rỗng
                return '';
            };

            // Mảng lưu danh sách nông dân tạo thành công
            const createdFarmers = [];

            // Mảng lưu các dòng bị bỏ qua do lỗi dữ liệu hoặc trùng
            const skippedRows = [];

            /*
                Duyệt từng dòng Excel.
                i là vị trí trong mảng, bắt đầu từ 0.
                Khi báo lỗi row: i + 2 vì:
                - Dòng 1 trong Excel là tiêu đề cột
                - Dữ liệu thật bắt đầu từ dòng 2
            */
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Lấy mã nông dân từ nhiều kiểu tên cột khác nhau
                const farmerCode = getValue(row, [
                    'farmerCode',
                    'farmer code',
                    'Mã nông dân',
                    'Mã Nông Dân',
                    'Ma nong dan',
                    'Ma Nong Dan',
                    'Mã số',
                    'Mã Số',
                    'Ma so',
                    'Ma So'
                ]);

                // Lấy họ tên nông dân
                const fullName = getValue(row, [
                    'fullName',
                    'full name',
                    'Họ tên',
                    'Họ Tên',
                    'Ho ten',
                    'Ho Ten'
                ]);

                // Lấy mã thửa ruộng
                const fieldCode = getValue(row, [
                    'fieldCode',
                    'field code',
                    'Mã thửa ruộng',
                    'Mã Thửa Ruộng',
                    'Ma thua ruong',
                    'Ma Thua Ruong',
                    'Mã thửa',
                    'Mã Thửa',
                    'Ma thua',
                    'Ma Thua'
                ]);

                // Lấy email và chuyển về chữ thường
                const email = getValue(row, [
                    'email',
                    'Email'
                ]).toLowerCase();

                // Lấy số điện thoại nếu có
                const phone = getValue(row, [
                    'phone',
                    'Phone',
                    'Số điện thoại',
                    'Số Điện Thoại',
                    'So dien thoai',
                    'So Dien Thoai',
                    'SDT',
                    'SĐT',
                    'Sdt'
                ]);

                // Lấy địa chỉ nếu có
                const address = getValue(row, [
                    'address',
                    'Address',
                    'Địa chỉ',
                    'Địa Chỉ',
                    'Dia chi',
                    'Dia Chi'
                ]);

                /*
                    Kiểm tra dữ liệu bắt buộc:
                    - mã nông dân
                    - họ tên
                    - mã thửa ruộng
                    - email

                    Nếu thiếu 1 trong các trường này thì bỏ qua dòng đó.
                */
                if (!farmerCode || !fullName || !fieldCode || !email) {
                    skippedRows.push({
                        row: i + 2,
                        reason: `Thiếu dữ liệu. Đọc được: mã=${farmerCode || 'trống'}, tên=${fullName || 'trống'}, thửa=${fieldCode || 'trống'}, email=${email || 'trống'}`
                    });
                    continue;
                }

                /*
                    Kiểm tra trùng dữ liệu trong database:
                    - username trùng farmerCode
                    - farmerCode đã tồn tại
                    - fieldCode đã tồn tại
                    - email đã tồn tại

                    Nếu trùng thì không tạo tài khoản mới.
                */
                const existedUser = await User.findOne({
                    $or: [
                        { username: farmerCode },
                        { farmerCode },
                        { fieldCode },
                        { email }
                    ]
                });

                if (existedUser) {
                    skippedRows.push({
                        row: i + 2,
                        reason: 'Mã nông dân, mã thửa ruộng hoặc email đã tồn tại'
                    });
                    continue;
                }

                /*
                    Mật khẩu mặc định của nông dân chính là mã nông dân.
                    Ví dụ farmerCode = ND001
                    thì username = ND001, password = ND001
                */
                const defaultPassword = farmerCode;

                // Mã hóa mật khẩu trước khi lưu vào MongoDB
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(defaultPassword, salt);

                /*
                    Tạo tài khoản nông dân mới.
                    createdByManager = req.user.id:
                    - req.user.id là id của Chủ HTX đang đăng nhập.
                    - Nhờ vậy hệ thống biết nông dân này do Chủ HTX nào upload.
                */
                const farmer = new User({
                    username: farmerCode,
                    password: hashedPassword,
                    fullName,
                    email,
                    phone,
                    address,
                    role: 'Farmer',
                    farmerCode,
                    fieldCode,
                    createdByManager: req.user.id,
                    mustChangePassword: true
                });

                // Lưu tài khoản Farmer vào MongoDB
                await farmer.save();

                // Thêm nông dân đã tạo vào danh sách trả về Frontend
                createdFarmers.push({
                    id: farmer._id,
                    username: farmer.username,
                    fullName: farmer.fullName,
                    email: farmer.email,
                    phone: farmer.phone,
                    address: farmer.address,
                    role: farmer.role,
                    farmerCode: farmer.farmerCode,
                    fieldCode: farmer.fieldCode,
                    defaultPassword
                });
            }

            /*
                Sau khi đọc xong toàn bộ file Excel:
                - Trả số lượng tạo thành công
                - Trả danh sách nông dân tạo thành công
                - Trả danh sách dòng bị bỏ qua
            */
            res.status(201).json({
                message: `Upload thành công! Đã tạo ${createdFarmers.length} tài khoản nông dân.`,
                createdFarmers,
                skippedRows
            });
        } catch (err) {
            // Bắt lỗi trùng unique của MongoDB
            if (err.code === 11000) {
                return res.status(400).json({
                    error: 'Mã nông dân, mã thửa ruộng hoặc email đã tồn tại!'
                });
            }

            // Các lỗi server khác
            res.status(500).json({
                error: err.message
            });
        }
    }
);

// =========================================================================
// CHỦ HTX - XEM DANH SÁCH NÔNG DÂN MÌNH ĐÃ UPLOAD
// Chỉ Manager được xem.
// Mỗi Manager chỉ xem được Farmer do mình upload.
// =========================================================================
router.get('/manager/farmers', protect, authorize('Manager'), async (req, res) => {
    try {
        /*
            Tìm danh sách Farmer có:
            - role = Farmer
            - createdByManager = id của Manager đang đăng nhập

            Như vậy Chủ HTX A không xem được nông dân của Chủ HTX B.
        */
        const farmers = await User.find({
            role: 'Farmer',
            createdByManager: req.user.id
        })
            // Không trả mật khẩu và OTP về Frontend
            .select('-password -resetPasswordToken -resetPasswordExpires')

            // Sắp xếp theo mã nông dân tăng dần
            .sort({ farmerCode: 1 });

        // Trả danh sách nông dân về Frontend
        res.json(farmers);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// Xuất router để server.js dùng app.use('/api/auth', authRoutes)
module.exports = router;