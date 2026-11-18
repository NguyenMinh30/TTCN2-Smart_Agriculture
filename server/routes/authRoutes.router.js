// Import express để tạo router xử lý các API.
const express = require('express');

// Tạo router riêng cho nhóm API auth/user.
// Dấu () nghĩa là gọi hàm Router.
const router = express.Router();

// Import bcrypt để so sánh và mã hóa mật khẩu.
const bcrypt = require('bcryptjs');

// Import jwt để tạo token đăng nhập.
const jwt = require('jsonwebtoken');

// Import multer để xử lý upload file từ client gửi lên.
const multer = require('multer');

// Import XLSX để đọc file Excel.
const XLSX = require('xlsx');

// Import crypto để tạo OTP ngẫu nhiên trong chức năng quên mật khẩu.
const crypto = require('crypto');

// Import nodemailer để gửi email OTP.
const nodemailer = require('nodemailer');

// Import model User để thao tác với bảng users trong MongoDB.
const User = require('../models/user.model');

// Import middleware protect và authorize.
// protect kiểm tra đăng nhập bằng token.
// authorize kiểm tra quyền theo role.
const { protect, authorize } = require('../middleware/authMiddleware');

// Cấu hình multer để nhận file upload.
// multer({ ... }) tạo middleware upload.
const upload = multer({
    // memoryStorage nghĩa là file Excel được lưu tạm trong RAM.
    // Không lưu trực tiếp vào ổ đĩa server.
    storage: multer.memoryStorage(),

    // limits giới hạn dung lượng file upload.
    limits: {
        // fileSize tính bằng byte.
        // 5 * 1024 * 1024 = 5MB.
        fileSize: 5 * 1024 * 1024
    }
});


// API ĐĂNG NHẬP
// Đăng nhập bằng username hoặc email
// Farmer đăng nhập bằng mã nông dân vì username = farmerCode
router.post('/login', async (req, res) => {
    try {
        // Lấy username và password từ body client gửi lên.
        const { username, password } = req.body;

        // Nếu thiếu username hoặc password thì báo lỗi.
        if (!username || !password) {
            return res.status(400).json({
                error: 'Vui lòng nhập tài khoản/email và mật khẩu!'
            });
        }

        // trim() xóa khoảng trắng đầu và cuối chuỗi username.
        const loginInput = username.trim();

        // Tìm user theo username hoặc email.
        // $or nghĩa là chỉ cần một điều kiện đúng.
        const user = await User.findOne({
            $or: [
                { username: loginInput },
                { email: loginInput.toLowerCase() }
            ]
        });

        // Nếu không tìm thấy user thì trả lỗi.
        if (!user) {
            return res.status(400).json({
                error: 'Tài khoản hoặc Email không tồn tại!'
            });
        }

        // So sánh password người dùng nhập với password đã hash trong database.
        const isMatch = await bcrypt.compare(password, user.password);

        // Nếu mật khẩu không khớp thì trả lỗi.
        if (!isMatch) {
            return res.status(400).json({
                error: 'Mật khẩu không chính xác!'
            });
        }

        // Tạo JWT token sau khi đăng nhập thành công.
        const token = jwt.sign(
            {
                // Lưu id user vào token.
                id: user._id,

                // Lưu role vào token để phân quyền.
                role: user.role
            },
            // Khóa bí mật dùng để ký token.
            process.env.JWT_SECRET,

            // Token hết hạn sau 1 ngày.
            { expiresIn: '1d' }
        );

        // Trả token và thông tin user về client.
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
        // Nếu server lỗi thì trả status 500.
        res.status(500).json({
            error: err.message
        });
    }
});

// ĐỔI MẬT KHẨU SAU KHI ĐĂNG NHẬP
// protect bắt buộc người dùng phải đăng nhập mới được đổi mật khẩu.
router.put('/change-password', protect, async (req, res) => {
    try {
        // Lấy mật khẩu cũ và mới từ body.
        const { oldPassword, newPassword } = req.body;

        // Kiểm tra người dùng nhập đủ chưa.
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                error: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới!'
            });
        }

        // Mật khẩu mới phải có ít nhất 6 ký tự.
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự!'
            });
        }

        // Tìm user theo id lấy từ token.
        const user = await User.findById(req.user.id);

        // Nếu không thấy tài khoản thì báo lỗi.
        if (!user) {
            return res.status(404).json({
                error: 'Không tìm thấy tài khoản!'
            });
        }

        // So sánh mật khẩu cũ nhập vào với mật khẩu trong database.
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        // Nếu mật khẩu cũ sai thì báo lỗi.
        if (!isMatch) {
            return res.status(400).json({
                error: 'Mật khẩu cũ không chính xác!'
            });
        }

        // Tạo salt để hash mật khẩu mới.
        const salt = await bcrypt.genSalt(10);

        // Hash mật khẩu mới rồi gán lại vào user.password.
        user.password = await bcrypt.hash(newPassword, salt);

        // Sau khi đổi mật khẩu thì không bắt đổi mật khẩu nữa.
        user.mustChangePassword = false;

        // Lưu thay đổi vào database.
        await user.save();

        // Trả thông báo thành công.
        res.json({
            message: 'Đổi mật khẩu thành công!'
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// QUÊN MẬT KHẨU - GỬI OTP QUA EMAIL
// Dành cho Kỹ thuật viên, Chủ HTX, Nông dân
router.post('/forgot-password', async (req, res) => {
    try {
        // Lấy email từ body.
        const { email } = req.body;

        // Nếu chưa nhập email thì báo lỗi.
        if (!email) {
            return res.status(400).json({
                error: 'Vui lòng nhập email!'
            });
        }

        // Tìm user có email tương ứng.
        // Chỉ cho Technician, Manager, Farmer khôi phục mật khẩu.
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            role: { $in: ['Technician', 'Manager', 'Farmer'] }
        });

        // Nếu không tìm thấy thì báo lỗi.
        if (!user) {
            return res.status(404).json({
                error: 'Email không tồn tại hoặc tài khoản không được phép khôi phục mật khẩu!'
            });
        }

        // Tạo OTP ngẫu nhiên 6 chữ số.
        const otp = crypto.randomInt(100000, 999999).toString();

        // Lưu OTP vào user.
        user.resetPasswordToken = otp;

        // OTP hết hạn sau 10 phút.
        // Date.now() là thời gian hiện tại tính bằng mili giây.
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

        // Lưu OTP và thời hạn vào database.
        await user.save();

        // Cấu hình tài khoản email dùng để gửi OTP.
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Gửi email chứa mã OTP cho user.
        await transporter.sendMail({
            to: user.email,
            from: `"Smart Agriculture" <${process.env.EMAIL_USER}>`,
            subject: 'Mã -OTP khôi phục mật khẩu',
            text: `Chào ${user.fullName || user.username}, mã OTP khôi phục mật khẩu của bạn là: ${otp}. Mã này có hiệu lực trong 10 phút.`
        });

        // Trả thông báo đã gửi OTP.
        res.json({
            message: 'Mã OTP đã được gửi về email!'
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ĐẶT LẠI MẬT KHẨU BẰNG OTP
router.post('/reset-password', async (req, res) => {
    try {
        // Lấy email, otp và mật khẩu mới từ body.
        const { email, otp, newPassword } = req.body;

        // Kiểm tra nhập đủ dữ liệu chưa.
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                error: 'Vui lòng nhập email, OTP và mật khẩu mới!'
            });
        }

        // Mật khẩu mới tối thiểu 6 ký tự.
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự!'
            });
        }

        // Tìm user theo email, OTP, thời hạn OTP và role được phép.
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            resetPasswordToken: otp,

            // $gt nghĩa là greater than, tức là resetPasswordExpires phải lớn hơn thời điểm hiện tại.
            // Nói cách khác: OTP chưa hết hạn.
            resetPasswordExpires: { $gt: Date.now() },

            role: { $in: ['Technician', 'Manager', 'Farmer'] }
        });

        // Nếu không tìm thấy user phù hợp thì OTP sai hoặc hết hạn.
        if (!user) {
            return res.status(400).json({
                error: 'OTP không chính xác hoặc đã hết hạn!'
            });
        }

        // Hash mật khẩu mới.
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Không bắt đổi mật khẩu nữa.
        user.mustChangePassword = false;

        // Xóa OTP sau khi đã đổi mật khẩu thành công.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Lưu user vào database.
        await user.save();

        // Trả thông báo thành công.
        res.json({
            message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại.'
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// ADMIN - TẠO TÀI KHOẢN KỸ THUẬT VIÊN / CHỦ HTX
// Admin không nhập mật khẩu.
// Mật khẩu mặc định = username.
// router.post nghĩa là API dùng phương thức POST để thêm dữ liệu.
// '/admin/users' là đường dẫn API.
// protect: bắt buộc phải đăng nhập.
// authorize('Admin'): chỉ tài khoản có role Admin mới được dùng API này.
router.post('/admin/users', protect, authorize('Admin'), async (req, res) => {
    try {
        // Lấy các thông tin từ body client gửi lên.
        // Dấu {} ở đây là destructuring, giúp lấy nhanh từng trường trong req.body.
        const { username, fullName, email, phone, role } = req.body;

        // Admin chỉ được tạo 2 loại tài khoản này.
        const allowedRoles = ['Technician', 'Manager'];

        // Nếu role gửi lên không nằm trong allowedRoles thì chặn.
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                error: 'Admin chỉ được tạo tài khoản Kỹ thuật viên hoặc Chủ HTX!'
            });
        }

        // Kiểm tra các trường bắt buộc.
        // Dấu || nghĩa là hoặc, chỉ cần thiếu một trường là báo lỗi.
        if (!username || !fullName || !email || !role) {
            return res.status(400).json({
                error: 'Vui lòng nhập đầy đủ username, họ tên, email và chức vụ!'
            });
        }

        // Xóa khoảng trắng đầu/cuối username.
        const cleanUsername = username.trim();

        // Xóa khoảng trắng đầu/cuối email và chuyển về chữ thường.
        const cleanEmail = email.trim().toLowerCase();

        // Kiểm tra username hoặc email đã tồn tại chưa.
        const userExists = await User.findOne({
            $or: [
                { username: cleanUsername },
                { email: cleanEmail }
            ]
        });

        // Nếu đã tồn tại thì không tạo nữa.
        if (userExists) {
            return res.status(400).json({
                error: 'Username hoặc Email đã tồn tại!'
            });
        }

        // Mật khẩu mặc định chính là username đã làm sạch.
        const defaultPassword = cleanUsername;

        // Tạo salt để mã hóa mật khẩu.
        const salt = await bcrypt.genSalt(10);

        // Mã hóa mật khẩu mặc định trước khi lưu database.
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        // Tạo object User mới.
        const newUser = new User({
            username: cleanUsername,
            password: hashedPassword,
            fullName: fullName.trim(),
            email: cleanEmail,

            // Nếu phone có thì lấy phone, nếu không thì để chuỗi rỗng.
            // Dấu || nghĩa là nếu phone bị rỗng/null/undefined thì dùng ''.
            phone: phone || '',

            role,

            // Bắt người dùng đổi mật khẩu khi đăng nhập lần đầu.
            mustChangePassword: true
        });

        // Lưu tài khoản mới vào MongoDB.
        await newUser.save();

        // Trả status 201 nghĩa là tạo mới thành công.
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

                // Trả mật khẩu mặc định về để Admin biết và đưa cho người dùng.
                defaultPassword
            }
        });
    } catch (err) {
        // Nếu MongoDB báo lỗi trùng dữ liệu unique thì err.code thường là 11000.
        if (err.code === 11000) {
            return res.status(400).json({
                error: 'Username hoặc Email đã tồn tại!'
            });
        }

        // Lỗi khác thì trả lỗi server.
        res.status(500).json({
            error: err.message
        });
    }
});


// ADMIN - LẤY DANH SÁCH KỸ THUẬT VIÊN / CHỦ HTX
// API này dùng GET để lấy dữ liệu.
// Chỉ Admin mới được xem danh sách này.
router.get('/admin/users', protect, authorize('Admin'), async (req, res) => {
    try {
        // Tìm user có role là Technician hoặc Manager.
        const users = await User.find({
            role: { $in: ['Technician', 'Manager'] }
        })
            // select dùng để chọn hoặc loại bỏ field.
            // Dấu - nghĩa là không trả về field đó.
            // Không trả password và token reset mật khẩu để bảo mật.
            .select('-password -resetPasswordToken -resetPasswordExpires')

            // sort({ createdAt: -1 }) sắp xếp mới nhất lên đầu.
            .sort({ createdAt: -1 });

        // Trả danh sách users về client.
        res.json(users);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});


// ADMIN - SỬA TÀI KHOẢN KỸ THUẬT VIÊN / CHỦ HTX
// Không sửa mật khẩu ở đây.
// Nếu quên mật khẩu thì dùng chức năng quên mật khẩu qua email.
// :id là tham số động trên URL.
// Ví dụ: /admin/users/123 thì req.params.id = 123.
router.put('/admin/users/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        // Lấy dữ liệu cần sửa từ body.
        const { username, fullName, email, phone, role } = req.body;

        // Admin chỉ được sửa role thành Technician hoặc Manager.
        const allowedRoles = ['Technician', 'Manager'];

        // Nếu có gửi role và role không hợp lệ thì báo lỗi.
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({
                error: 'Admin chỉ được sửa tài khoản Kỹ thuật viên hoặc Chủ HTX!'
            });
        }

        // Tìm user theo id trên URL.
        const user = await User.findById(req.params.id);

        // Nếu không tìm thấy thì báo lỗi 404.
        if (!user) {
            return res.status(404).json({
                error: 'Không tìm thấy tài khoản!'
            });
        }

        // Không cho sửa Admin hoặc Farmer bằng chức năng này.
        if (user.role === 'Admin' || user.role === 'Farmer') {
            return res.status(403).json({
                error: 'Không được sửa tài khoản Admin hoặc Nông dân ở chức năng này!'
            });
        }

        // Nếu có username mới và username đó khác username hiện tại thì mới kiểm tra trùng.
        if (username && username.trim() !== user.username) {
            // Tìm user khác có username này chưa.
            // $ne nghĩa là not equal, loại trừ chính user đang sửa.
            const usernameExists = await User.findOne({
                username: username.trim(),
                _id: { $ne: user._id }
            });

            // Nếu username đã tồn tại ở tài khoản khác thì báo lỗi.
            if (usernameExists) {
                return res.status(400).json({
                    error: 'Username này đã tồn tại!'
                });
            }

            // Gán username mới.
            user.username = username.trim();
        }

        // Nếu có email mới và email khác email hiện tại thì kiểm tra trùng.
        if (email && email.trim().toLowerCase() !== user.email) {
            const emailExists = await User.findOne({
                email: email.trim().toLowerCase(),
                _id: { $ne: user._id }
            });

            // Nếu email đã tồn tại ở tài khoản khác thì báo lỗi.
            if (emailExists) {
                return res.status(400).json({
                    error: 'Email này đã tồn tại!'
                });
            }

            // Gán email mới.
            user.email = email.trim().toLowerCase();
        }

        // Nếu có fullName thì cập nhật họ tên.
        if (fullName) {
            user.fullName = fullName.trim();
        }

        // Nếu phone được gửi lên, kể cả chuỗi rỗng, thì vẫn cập nhật.
        // Vì vậy dùng phone !== undefined thay vì if (phone).
        if (phone !== undefined) {
            user.phone = phone;
        }

        // Nếu có role thì cập nhật role.
        if (role) {
            user.role = role;
        }

        // Lưu thay đổi vào database.
        await user.save();

        // Trả dữ liệu sau khi cập nhật.
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
        // Bắt lỗi trùng unique từ MongoDB.
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


// ADMIN - XÓA TÀI KHOẢN KỸ THUẬT VIÊN / CHỦ HTX
// API DELETE dùng để xóa dữ liệu.
router.delete('/admin/users/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        // Tìm user theo id.
        const user = await User.findById(req.params.id);

        // Nếu không tìm thấy thì báo lỗi.
        if (!user) {
            return res.status(404).json({
                error: 'Không tìm thấy tài khoản!'
            });
        }

        // Không cho xóa Admin hoặc Farmer ở chức năng này.
        if (user.role === 'Admin' || user.role === 'Farmer') {
            return res.status(403).json({
                error: 'Không được xóa tài khoản Admin hoặc Nông dân ở chức năng này!'
            });
        }

        // Xóa user theo id.
        await User.findByIdAndDelete(req.params.id);

        // Trả thông báo xóa thành công.
        res.json({
            message: 'Xóa tài khoản thành công!'
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// CHỦ HTX - UPLOAD EXCEL DANH SÁCH NÔNG DÂN
// Đây là API để Chủ HTX upload file Excel chứa danh sách nông dân.
// Sau khi upload, hệ thống đọc từng dòng Excel và tự tạo tài khoản Farmer.

router.post(
    // router.post nghĩa là tạo API dùng phương thức POST.
    // POST thường dùng khi client gửi dữ liệu lên server.
    // '/manager/farmers/upload' là đường dẫn API.
    // Frontend sẽ gọi API này khi Chủ HTX bấm upload file Excel.
    '/manager/farmers/upload',

    // protect là middleware kiểm tra người dùng đã đăng nhập chưa.
    // Nếu chưa có token hoặc token sai thì không cho upload.
    protect,

    // authorize('Manager') kiểm tra quyền của người dùng.
    // Chỉ tài khoản có role là Manager, tức Chủ HTX, mới được upload.
    authorize('Manager'),

    // upload.single('file') dùng để nhận 1 file từ form-data.
    // 'file' là tên field gửi từ frontend hoặc Postman.
    // Nếu frontend gửi tên khác 'file' thì req.file sẽ không có dữ liệu.
    upload.single('file'),

    // async nghĩa là hàm này có xử lý bất đồng bộ.
    // Vì trong hàm có dùng await để chờ đọc database, hash mật khẩu, tạo user.
    // req là request client gửi lên.
    // res là response server trả về cho client.
    async (req, res) => {
        try {
            // try dùng để bọc đoạn code có thể phát sinh lỗi.
            // Nếu có lỗi, chương trình sẽ nhảy xuống catch.

            // req.file là file Excel được gửi lên.
            // Dấu ! nghĩa là phủ định.
            // !req.file nghĩa là nếu không có file.
            if (!req.file) {
                // return dùng để dừng xử lý tại đây.
                // res.status(400) trả mã lỗi 400, nghĩa là dữ liệu gửi lên không hợp lệ.
                // json({...}) trả dữ liệu dạng JSON về frontend.
                return res.status(400).json({
                    error: 'Vui lòng chọn file Excel!'
                });
            }

            // XLSX.read dùng để đọc file Excel.
            // req.file.buffer là nội dung file Excel đang nằm trong RAM.
            // type: 'buffer' báo cho thư viện XLSX biết dữ liệu đầu vào là buffer.
            const workbook = XLSX.read(req.file.buffer, {
                type: 'buffer'
            });

            // workbook.SheetNames là mảng chứa tên các sheet trong file Excel.
            // [0] nghĩa là lấy sheet đầu tiên.
            // workbook.Sheets[...] lấy dữ liệu của sheet đó.
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // XLSX.utils.sheet_to_json dùng để chuyển sheet Excel thành mảng object.
            // Mỗi dòng trong Excel sẽ trở thành 1 object trong mảng rows.
            // defval: '' nghĩa là ô nào trống thì gán bằng chuỗi rỗng.
            const rows = XLSX.utils.sheet_to_json(worksheet, {
                defval: ''
            });

            // rows.length là số dòng dữ liệu đọc được từ Excel.
            // Nếu rows.length = 0 nghĩa là file không có dữ liệu.
            if (!rows.length) {
                return res.status(400).json({
                    error: 'File Excel không có dữ liệu!'
                });
            }

            // normalizeKey là hàm chuẩn hóa tên cột Excel.
            // Mục đích: giúp hệ thống đọc được tên cột dù viết hoa, viết thường, có dấu hay không dấu.
            // Ví dụ: "Mã Nông Dân" sẽ thành "ma nong dan".
            const normalizeKey = (key) =>
                // String(key) ép tên cột về dạng chuỗi.
                String(key)

                    // trim() xóa khoảng trắng ở đầu và cuối chuỗi.
                    .trim()

                    // toLowerCase() chuyển toàn bộ chữ hoa thành chữ thường.
                    .toLowerCase()

                    // normalize('NFD') tách dấu tiếng Việt ra khỏi chữ cái.
                    // Ví dụ "ã" được tách thành "a" + dấu ngã.
                    .normalize('NFD')

                    // replace(/[\u0300-\u036f]/g, '') xóa các dấu tiếng Việt đã được tách ra.
                    // /.../ là biểu thức chính quy regex.
                    // g nghĩa là xóa tất cả dấu tìm được.
                    .replace(/[\u0300-\u036f]/g, '')

                    // Chữ "đ" không bị mất ở bước trên nên cần đổi riêng "đ" thành "d".
                    .replace(/đ/g, 'd')

                    // \s+ nghĩa là nhiều khoảng trắng liên tiếp.
                    // Dòng này gộp nhiều khoảng trắng thành 1 khoảng trắng.
                    .replace(/\s+/g, ' ');

            // COLS là object chứa các tên cột Excel mà hệ thống chấp nhận.
            // Sau khi chuẩn hóa, chỉ cần ghi dạng không dấu, chữ thường.
            const COLS = {
                // farmerCode là mã nông dân.
                // Hệ thống chấp nhận các tên cột như farmerCode, farmer code, mã nông dân, mã số.
                farmerCode: ['farmercode', 'farmer code', 'ma nong dan', 'ma so'],

                // fullName là họ tên nông dân.
                fullName: ['fullname', 'full name', 'ho ten'],

                // fieldCode là mã thửa ruộng.
                fieldCode: ['fieldcode', 'field code', 'ma thua ruong', 'ma thua'],

                // email là email nông dân.
                email: ['email'],

                // phone là số điện thoại.
                phone: ['phone', 'so dien thoai', 'sdt'],

                // address là địa chỉ.
                address: ['address', 'dia chi']
            };

            // getValue là hàm lấy dữ liệu trong 1 dòng Excel.
            // row là 1 dòng Excel.
            // keys là danh sách tên cột có thể dùng.
            const getValue = (row, keys) => {
                // newRow dùng để lưu lại dòng Excel sau khi đã chuẩn hóa tên cột.
                const newRow = {};

                // Object.keys(row) lấy ra tất cả tên cột của dòng Excel.
                // forEach duyệt qua từng tên cột.
                Object.keys(row).forEach((key) => {
                    // normalizeKey(key) chuẩn hóa tên cột.
                    // row[key] là giá trị của ô tương ứng với cột đó.
                    // Ví dụ key là "Mã Nông Dân", sau chuẩn hóa thành "ma nong dan".
                    newRow[normalizeKey(key)] = row[key];
                });

                // Duyệt qua từng tên cột có thể chấp nhận.
                for (const key of keys) {
                    // Lấy giá trị trong dòng Excel theo tên cột đã chuẩn hóa.
                    const value = newRow[key];

                    // Kiểm tra value có tồn tại và không rỗng không.
                    // value !== undefined nghĩa là giá trị không bị undefined.
                    // value !== null nghĩa là giá trị không bị null.
                    // String(value).trim() !== '' nghĩa là sau khi xóa khoảng trắng thì không được rỗng.
                    if (value !== undefined && value !== null && String(value).trim() !== '') {
                        // Nếu có dữ liệu hợp lệ thì trả về dữ liệu dạng chuỗi đã xóa khoảng trắng đầu cuối.
                        return String(value).trim();
                    }
                }

                // Nếu không tìm thấy cột hoặc dữ liệu rỗng thì trả về chuỗi rỗng.
                return '';
            };

            // createdFarmers là mảng lưu các tài khoản Farmer tạo thành công.
            const createdFarmers = [];

            // skippedRows là mảng lưu các dòng Excel bị bỏ qua.
            // Ví dụ: thiếu dữ liệu hoặc bị trùng trong database.
            const skippedRows = [];

            // Vòng lặp for dùng để duyệt từng dòng trong file Excel.
            // i bắt đầu từ 0 vì mảng trong JavaScript bắt đầu từ vị trí 0.
            for (let i = 0; i < rows.length; i++) {
                // Lấy dòng Excel hiện tại.
                const row = rows[i];

                // rowNumber là số dòng thật trong Excel.
                // i + 2 vì dòng 1 là tiêu đề cột, dữ liệu bắt đầu từ dòng 2.
                const rowNumber = i + 2;

                // Lấy mã nông dân từ dòng Excel.
                const farmerCode = getValue(row, COLS.farmerCode);

                // Lấy họ tên nông dân từ dòng Excel.
                const fullName = getValue(row, COLS.fullName);

                // Lấy mã thửa ruộng từ dòng Excel.
                const fieldCode = getValue(row, COLS.fieldCode);

                // Lấy email từ dòng Excel.
                // toLowerCase() chuyển email về chữ thường để tránh trùng do viết hoa/thường.
                const email = getValue(row, COLS.email).toLowerCase();

                // Lấy số điện thoại từ dòng Excel.
                const phone = getValue(row, COLS.phone);

                // Lấy địa chỉ từ dòng Excel.
                const address = getValue(row, COLS.address);

                // Kiểm tra các dữ liệu bắt buộc.
                // Nếu thiếu 1 trong 4 trường: mã nông dân, họ tên, mã thửa ruộng, email thì không tạo tài khoản.
                if (!farmerCode || !fullName || !fieldCode || !email) {
                    // push dùng để thêm dữ liệu vào mảng skippedRows.
                    skippedRows.push({
                        // Lưu số dòng Excel bị lỗi.
                        row: rowNumber,

                        // Lưu lý do dòng này bị bỏ qua.
                        reason: 'Thiếu mã nông dân, họ tên, mã thửa ruộng hoặc email'
                    });

                    // continue nghĩa là bỏ qua dòng hiện tại và chuyển sang dòng Excel tiếp theo.
                    continue;
                }

                // Kiểm tra xem tài khoản nông dân này đã tồn tại chưa.
                // User.findOne dùng để tìm 1 user trong database.
                // await nghĩa là chờ database trả kết quả.
                const existedUser = await User.findOne({
                    // $or nghĩa là chỉ cần 1 trong các điều kiện bên dưới đúng thì xem như bị trùng.
                    $or: [
                        // Kiểm tra trùng username.
                        { username: farmerCode },

                        // Kiểm tra trùng mã nông dân.
                        { farmerCode },

                        // Kiểm tra trùng mã thửa ruộng.
                        { fieldCode },

                        // Kiểm tra trùng email.
                        { email }
                    ]
                });

                // Nếu existedUser có dữ liệu nghĩa là đã tồn tại trong database.
                if (existedUser) {
                    // Lưu dòng bị bỏ qua vào skippedRows.
                    skippedRows.push({
                        row: rowNumber,
                        reason: 'Mã nông dân, mã thửa ruộng hoặc email đã tồn tại'
                    });

                    // Bỏ qua dòng hiện tại, không tạo tài khoản.
                    continue;
                }

                // Mật khẩu mặc định của nông dân chính là mã nông dân.
                const defaultPassword = farmerCode;

                // bcrypt.genSalt(10) tạo salt để mã hóa mật khẩu.
                // Số 10 là độ phức tạp khi mã hóa.
                const salt = await bcrypt.genSalt(10);

                // bcrypt.hash dùng để mã hóa mật khẩu.
                // Không lưu mật khẩu gốc vào database.
                const hashedPassword = await bcrypt.hash(defaultPassword, salt);

                // User.create dùng để tạo tài khoản Farmer mới trong database.
                const farmer = await User.create({
                    // username của Farmer bằng mã nông dân.
                    username: farmerCode,

                    // password lưu trong database là mật khẩu đã mã hóa.
                    password: hashedPassword,

                    fullName,

                    email,
          
                    phone,

                    address,

                    // role là quyền của tài khoản.
                    // Farmer nghĩa là tài khoản nông dân.
                    role: 'Farmer',

                    // Lưu mã nông dân.
                    farmerCode,

                    // Lưu mã thửa ruộng.
                    fieldCode,

                    // Lưu id của Chủ HTX đã upload nông dân này.
                    // req.user.id lấy từ token sau khi qua middleware protect.
                    createdByManager: req.user.id,

                    // true nghĩa là bắt nông dân đổi mật khẩu sau lần đăng nhập đầu tiên.
                    mustChangePassword: true
                });

                // Sau khi tạo xong, đưa thông tin tài khoản vào mảng createdFarmers.
                // Mảng này sẽ được trả về frontend.
                createdFarmers.push({
                    // _id là id tự động của MongoDB.
                    id: farmer._id,

                    // Tài khoản đăng nhập.
                    username: farmer.username,

                    fullName: farmer.fullName,

                    email: farmer.email,

                    phone: farmer.phone,

                    address: farmer.address,

                    // Quyền tài khoản.
                    role: farmer.role,

                    // Mã nông dân.
                    farmerCode: farmer.farmerCode,

                    // Mã thửa ruộng.
                    fieldCode: farmer.fieldCode,

                    // Trả mật khẩu mặc định về cho Chủ HTX biết.
                    defaultPassword
                });
            }

            // Sau khi duyệt xong toàn bộ file Excel, trả kết quả về frontend.
            res.status(201).json({
                // 201 nghĩa là tạo dữ liệu thành công.
                // createdFarmers.length là số tài khoản tạo thành công.
                message: `Upload thành công! Đã tạo ${createdFarmers.length} tài khoản nông dân.`,

                // Danh sách tài khoản tạo thành công.
                createdFarmers,

                // Danh sách dòng bị bỏ qua.
                skippedRows
            });
        } catch (err) {
            // catch bắt lỗi nếu có lỗi xảy ra trong try.
            // Ví dụ: lỗi đọc file, lỗi database, lỗi server.

            // Trả lỗi 500 nghĩa là lỗi server.
            // err.message là nội dung lỗi cụ thể.
            res.status(500).json({
                error: err.message
            });
        }
    }
);
// CHỦ HTX - XEM DANH SÁCH NÔNG DÂN MÌNH ĐÃ UPLOAD
// API này chỉ cho Manager xem danh sách Farmer do chính Manager đó upload.
router.get('/manager/farmers', protect, authorize('Manager'), async (req, res) => {
    try {
        // Tìm các user có role Farmer và createdByManager bằng id của Manager đang đăng nhập.
        const farmers = await User.find({
            role: 'Farmer',
            createdByManager: req.user.id
        })
            // Không trả password và token reset mật khẩu để bảo mật.
            .select('-password -resetPasswordToken -resetPasswordExpires')

            // Sắp xếp theo farmerCode tăng dần.
            // 1 là tăng dần, -1 là giảm dần.
            .sort({ farmerCode: 1 });

        // Trả danh sách nông dân về client.
        res.json(farmers);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// Xuất router để file app/server chính có thể dùng các API trong file này.
module.exports = router;