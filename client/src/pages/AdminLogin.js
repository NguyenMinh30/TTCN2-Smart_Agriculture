import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, User } from "lucide-react";

const AdminLogin = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAdminLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Đăng nhập thất bại!");
            }

            if (data.user.role !== "Admin") {
                throw new Error("Tài khoản này không có quyền truy cập trang quản trị!");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/admin");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-green-100 border border-green-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
                        <ShieldCheck size={42} />
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-900">
                        Admin System
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Trang đăng nhập riêng dành cho quản trị viên
                    </p>
                </div>

                {error && (
                    <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Tài khoản Admin
                        </label>

                        <div className="relative">
                            <User
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Nhập tài khoản admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Mật khẩu
                        </label>

                        <div className="relative">
                            <Lock
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-green-200 transition-all"
                    >
                        {loading ? "Đang xác thực..." : "Đăng nhập quản trị"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;