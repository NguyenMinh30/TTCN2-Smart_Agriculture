import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Shield, UserPlus, Hash } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AddAccountPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userCode: '', // <-- Đã thêm trường lưu Mã định danh
    username: '',
    email: '',
    password: '',
    role: 'Farmer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Thêm tài khoản thành công!');
        navigate('/admin');
      } else {
        setError(data.error || 'Có lỗi xảy ra khi tạo tài khoản');
      }
    } catch (err) {
      setError('Lỗi kết nối đến Server!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm hỗ trợ đổi label và placeholder theo cấp bậc vai trò
  const getCodeConfig = (role) => {
    switch (role) {
      case 'Farmer': return { label: 'Mã Nông dân', placeholder: 'VD: ND001' };
      case 'Technician': return { label: 'Mã Cán bộ kỹ thuật', placeholder: 'VD: CB001' };
      case 'Manager': return { label: 'Mã Hợp tác xã (Quản lý)', placeholder: 'VD: HTX001' };
      case 'Admin': return { label: 'Mã Admin (Hệ thống)', placeholder: 'VD: AD001' };
      default: return { label: 'Mã định danh', placeholder: 'Nhập mã...' };
    }
  };

  const codeConfig = getCodeConfig(formData.role);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center">
        <Link to="/admin" className="text-blue-400 p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="ml-4 text-xl font-bold">Thêm tài khoản mới</h1>
      </div>

      <div className="container mx-auto px-4 mt-10 max-w-md">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-500/20 p-4 rounded-full">
              <UserPlus size={40} className="text-blue-400" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Vai trò */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vai trò hệ thống</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 text-gray-400" size={20} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-white appearance-none cursor-pointer"
                >
                  <option value="Farmer">Nông dân</option>
                  <option value="Technician">Cán bộ Kỹ thuật</option>
                  <option value="Manager">Quản lý (Hợp tác xã)</option>
                  <option value="Admin">Quản trị viên (Hệ thống)</option>
                </select>
              </div>
            </div>

            {/* Mã định danh (Thay đổi theo Vai trò) */}
            <div>
              <label className="block text-sm text-green-400 mb-1 font-medium">
                {codeConfig.label}
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-green-400" size={20} />
                <input
                  type="text"
                  name="userCode"
                  required
                  placeholder={codeConfig.placeholder}
                  value={formData.userCode}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-green-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-white"
                />
              </div>
            </div>

            {/* Tên người dùng */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tên người dùng / Tài khoản</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="Nhập tên tài khoản..."
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Nhập địa chỉ email..."
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-white"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-white"
                />
              </div>
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 py-3 mt-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95"
            >
              {loading ? 'Đang tạo...' : 'Xác nhận tạo tài khoản'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAccountPage;