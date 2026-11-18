import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Leaf, User, Lock, ArrowLeft, LogIn } from "lucide-react";

const Login = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const roleQuery = searchParams.get("role") || "nn";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getRoleLabel = (role) => {
        if (role === "admin") return "Quản trị viên";
        if (role === "cbkt") return "Cán bộ kỹ thuật";
        if (role === "manager") return "Chủ HTX";
        return "Nông dân";
    };

    const redirectByRole = (role) => {
        if (role === "Admin") {
            navigate("/admin");
            return;
        }

        if (role === "Technician") {
            navigate("/technician");
            return;
        }

        if (role === "Manager") {
            navigate("/manager");
            return;
        }

        if (role === "Farmer") {
            navigate("/farmer");
            return;
        }

        navigate("/");
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Đăng nhập thất bại!");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            if (data.user.mustChangePassword) {
                navigate("/change-password");
                return;
            }

            redirectByRole(data.user.role);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 flex items-center justify-center px-4 py-10">
            <div className="fixed top-[-120px] right-[-120px] w-96 h-96 bg-green-200/50 rounded-full blur-3xl"></div>
            <div className="fixed bottom-[-120px] left-[-120px] w-96 h-96 bg-emerald-200/60 rounded-full blur-3xl"></div>

            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[32px] shadow-2xl shadow-green-100 border border-green-100 overflow-hidden">
                <div className="hidden lg:flex bg-gradient-to-br from-green-600 to-emerald-700 p-10 text-white flex-col justify-between">
                    <div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-green-50 hover:text-white mb-10"
                        >
                            <ArrowLeft size={20} />
                            Về trang chủ
                        </Link>

                        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-6">
                            <Leaf size={38} />
                        </div>

                        <h1 className="text-4xl font-extrabold leading-tight mb-4">
                            Smart Agriculture
                        </h1>

                        <p className="text-green-50 text-lg leading-relaxed">
                            Hệ thống thu thập và quản lý dữ liệu bệnh cây trồng dành cho Cà
                            chua và Dưa chuột.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/15 rounded-2xl p-4">
                            <h3 className="text-3xl font-extrabold">2</h3>
                            <p className="text-sm text-green-50">Loại cây trồng</p>
                        </div>

                        <div className="bg-white/15 rounded-2xl p-4">
                            <h3 className="text-3xl font-extrabold">24/7</h3>
                            <p className="text-sm text-green-50">Theo dõi dữ liệu</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <Link
                        to="/"
                        className="lg:hidden inline-flex items-center gap-2 text-green-700 font-semibold mb-6"
                    >
                        <ArrowLeft size={20} />
                        Về trang chủ
                    </Link>

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
                            <LogIn size={34} />
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900">
                            Đăng nhập
                        </h2>

                        <p className="text-slate-500 mt-2">
                            Dành cho:{" "}
                            <span className="font-extrabold text-green-700 uppercase">
                                {getRoleLabel(roleQuery)}
                            </span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleLoginSubmit}>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Tài khoản / Email / Mã nông dân
                            </label>

                            <div className="relative">
                                <User
                                    size={20}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 text-slate-900"
                                    placeholder="Nhập username, email hoặc mã nông dân"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 text-slate-900"
                                    placeholder="Nhập mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-bold text-green-700 hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-lg shadow-green-200 disabled:bg-slate-400 transition-all"
                        >
                            {loading ? "Đang xác thực..." : "Xác nhận truy cập"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;