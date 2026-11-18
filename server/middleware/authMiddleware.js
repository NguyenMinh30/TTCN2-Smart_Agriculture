// Import thư viện jsonwebtoken để xử lý JWT.
// JWT dùng để tạo token, kiểm tra token khi người dùng đăng nhập.
const jwt = require('jsonwebtoken');

// Middleware protect dùng để bảo vệ các API cần đăng nhập.
// req: request từ client gửi lên.
// res: response server trả về.
// next: cho phép đi tiếp sang middleware/API tiếp theo nếu hợp lệ.
const protect = (req, res, next) => {
    // Khai báo biến token để lưu token lấy được từ header.
    let token;

    // Kiểm tra xem request có gửi thông tin xác thực (như Bearer Token, API Key, hoặc mật khẩu mã hóa) từ máy khách (client) lên máy chủ không.
    // startsWith('Bearer') nghĩa là token phải có dạng: Bearer <token>.
    // Dấu && nghĩa là cả 2 điều kiện đều đúng thì mới chạy vào trong.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tách chuỗi "Bearer token" thành mảng bằng dấu cách.
            //lấy token từ header Authorization mà client gửi lên.
            // split(' ')[1] lấy phần tử thứ 2, chính là token.
            token = req.headers.authorization.split(' ')[1];

            // Xác thực token bằng jwt.verify.
            // process.env.JWT_SECRET là khóa bí mật lưu trong file .env.
            // Nếu token hợp lệ, decoded sẽ chứa dữ liệu đã mã hóa như id, role.
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lưu payload giải mã vào req.user.
            // Sau đó các API phía sau có thể dùng req.user.id hoặc req.user.role.
            req.user = decoded; // Lưu payload giải mã (id, role) vào req

            // Token hợp lệ thì cho request đi tiếp.
            return next();
        } catch (error) {
            // Nếu token sai hoặc hết hạn thì trả về lỗi 401.
            // 401 nghĩa là chưa xác thực hoặc xác thực không hợp lệ.
            return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn!' });
        }
    }

    // Nếu không có token thì không cho truy cập API.
    if (!token) {
        // Trả về lỗi 401 vì người dùng chưa gửi token.
        return res.status(401).json({ error: 'Không tìm thấy Token, quyền truy cập bị từ chối!' });
    }
};

// Middleware authorize dùng để phân quyền theo role.
// Dấu ...allowedRoles là rest parameter, cho phép truyền nhiều role vào.
// Ví dụ: authorize('Admin') hoặc authorize('Admin', 'Manager').
const authorize = (...allowedRoles) => {
    // Trả về một middleware mới.
    return (req, res, next) => {
        // Nếu chưa có req.user hoặc role của user không nằm trong allowedRoles thì chặn.
        // Dấu ! nghĩa là phủ định.
        // includes dùng để kiểm tra mảng allowedRoles có chứa req.user.role không.
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            // 403 nghĩa là đã đăng nhập nhưng không có quyền.
            return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này!' });
        }

        // Nếu có quyền thì cho đi tiếp.
        next();
    };
};

// Xuất 2 middleware protect và authorize để file route khác sử dụng.
module.exports = { protect, authorize };