import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_API_URL = "http://localhost:5000/api/auth";

const ChangePassword = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Điều hướng về đúng trang sau khi đổi mật khẩu
    const redirectByRole = (role) => {
        if (role === "Admin") {
            navigate("/admin");
            return;
        }

        if (role === "Manager") {
            navigate("/manager");
            return;
        }

        if (role === "Technician") {
            navigate("/technician");
            return;
        }

        if (role === "Farmer") {
            navigate("/farmer");
            return;
        }

        navigate("/");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !formData.oldPassword ||
            !formData.newPassword ||
            !formData.confirmPassword
        ) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        if (formData.newPassword.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const res = await fetch(`${AUTH_API_URL}/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Đổi mật khẩu thất bại!");
                return;
            }

            const updatedUser = {
                ...user,
                mustChangePassword: false,
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));

            alert(data.message || "Đổi mật khẩu thành công!");

            redirectByRole(updatedUser.role);
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối server!");
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Đổi mật khẩu
                </h1>

                <p className="text-slate-500 mb-8">
                    Đây là lần đăng nhập đầu tiên, vui lòng đổi mật khẩu để tiếp tục.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="font-bold text-slate-800">Mật khẩu cũ</label>
                        <input
                            type="password"
                            name="oldPassword"
                            value={formData.oldPassword}
                            onChange={handleChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            className="mt-2 w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-800">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Nhập mật khẩu mới"
                            className="mt-2 w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-800">
                            Xác nhận mật khẩu mới
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu mới"
                            className="mt-2 w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl"
                    >
                        Đổi mật khẩu
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;