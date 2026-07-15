// Import thư viện jsonwebtoken để kiểm tra token đăng nhập
const jwt = require('jsonwebtoken');

/*
    Middleware protect:
    - Dùng để bảo vệ API.
    - Chỉ người dùng đã đăng nhập và có token hợp lệ mới được đi tiếp.
    - Token thường được gửi từ Frontend qua header:
      Authorization: Bearer <token>
*/
const protect = (req, res, next) => {
    let token;

    // Kiểm tra trong header có Authorization không
    // Và Authorization có bắt đầu bằng chữ "Bearer" không
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tách token ra khỏi chuỗi "Bearer token"
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token bằng JWT_SECRET trong file .env
            // Nếu token đúng, decoded sẽ chứa thông tin user như id và role
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lưu thông tin user đã giải mã vào req.user
            // Ví dụ: req.user = { id: "...", role: "Admin" }
            // Các API phía sau có thể dùng req.user để biết ai đang đăng nhập
            req.user = decoded;

            // Cho request đi tiếp sang controller/API tiếp theo
            return next();
        } catch (error) {
            // Nếu token sai hoặc hết hạn thì trả lỗi 401
            return res.status(401).json({
                error: 'Token không hợp lệ hoặc đã hết hạn!'
            });
        }
    }

    // Nếu không có token thì không cho truy cập API
    if (!token) {
        return res.status(401).json({
            error: 'Không tìm thấy Token, quyền truy cập bị từ chối!'
        });
    }
};

/*
    Middleware authorize:
    - Dùng để phân quyền theo vai trò.
    - Ví dụ:
      authorize('Admin') chỉ cho Admin truy cập.
      authorize('Manager') chỉ cho Chủ HTX truy cập.
*/
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Nếu chưa có req.user hoặc role của user không nằm trong danh sách cho phép
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Bạn không có quyền truy cập chức năng này!'
            });
        }

        // Nếu đúng quyền thì cho đi tiếp
        next();
    };
};

// Xuất 2 middleware để dùng trong các route khác
module.exports = { protect, authorize };