import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Bước 1: nhập mail nhận OTP, Bước 2: Nhập OTP đổi mật khẩu mới
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý gửi yêu cầu OTP tới email
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(data.message);
            setStep(2); // Chuyển sang bước nhập OTP
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý nộp mã OTP và mật khẩu mới
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            return setError('Mật khẩu nhập lại không khớp!');
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess(data.message);
            setTimeout(() => navigate('/login'), 2500); // Đổi thành công đưa về trang Login
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">Khôi phục mật khẩu</h2>
                {error && <div className="p-3 mb-3 text-sm text-red-700 bg-red-100 rounded-lg text-center">{error}</div>}
                {success && <div className="p-3 mb-3 text-sm text-green-700 bg-green-100 rounded-lg text-center">{success}</div>}

                {step === 1 ? (
                    // FORM NHẬP EMAIL ĐỂ NHẬN OTP
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nhập email tài khoản của bạn</label>
                            <input type="email" className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-black" placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:bg-slate-400">
                            {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực OTP'}
                        </button>
                    </form>
                ) : (
                    // FORM NHẬP MÃ OTP VÀ MẬT KHẨU MỚI
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nhập mã OTP gồm 6 số (Xem trong Email)</label>
                            <input type="text" className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center tracking-widest text-black font-bold text-lg" placeholder="••••••" value={otp} onChange={e => setOtp(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Mật khẩu mới</label>
                            <input type="password" className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-black" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
                            <input type="password" className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-black" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:bg-slate-400">
                            {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                        </button>
                    </form>
                )}
                <div className="mt-4 text-center"><Link to="/login" className="text-sm text-slate-500 hover:underline">Quay lại đăng nhập</Link></div>
            </div>
        </div>
    );
};

export default ForgotPassword;