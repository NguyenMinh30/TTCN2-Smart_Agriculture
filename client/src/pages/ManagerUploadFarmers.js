import React, { useEffect, useState } from "react";

const AUTH_API_URL = "http://localhost:5000/api/auth";

const ManagerUploadFarmers = () => {
    const [file, setFile] = useState(null);
    const [farmers, setFarmers] = useState([]);
    const [skippedRows, setSkippedRows] = useState([]);
    const token = localStorage.getItem("token");

    const fetchFarmers = async () => {
        try {
            const res = await fetch(`${AUTH_API_URL}/manager/farmers`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Không lấy được danh sách nông dân!");
                return;
            }

            setFarmers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối server!");
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            alert("Vui lòng chọn file Excel!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${AUTH_API_URL}/manager/farmers/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Upload thất bại!");
                return;
            }

            alert(data.message || "Upload thành công!");

            setSkippedRows(data.skippedRows || []);
            setFile(null);
            fetchFarmers();
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối server!");
        }
    };

    return (
        <div className="min-h-screen bg-green-50 p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-8">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
                    Upload danh sách hộ nông dân
                </h1>

                <p className="text-slate-500 mb-6">
                    File Excel cần có cột: farmerCode, fullName, fieldCode, phone, address.
                    Mật khẩu mặc định của nông dân là mã nông dân.
                </p>

                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 mb-8">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="border border-slate-200 rounded-2xl p-3 flex-1 bg-slate-50"
                    />

                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl"
                    >
                        Upload Excel
                    </button>
                </form>

                {skippedRows.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 mb-8">
                        <h3 className="font-bold mb-2">Các dòng bị bỏ qua:</h3>

                        <ul className="list-disc pl-5">
                            {skippedRows.map((item, index) => (
                                <li key={index}>
                                    Dòng {item.row}: {item.reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <h2 className="text-xl font-extrabold mb-4">
                    Danh sách nông dân đã upload
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-green-100 text-green-700">
                                <th className="p-3 text-left">STT</th>
                                <th className="p-3 text-left">Mã nông dân</th>
                                <th className="p-3 text-left">Họ tên</th>
                                <th className="p-3 text-left">Mã thửa ruộng</th>
                                <th className="p-3 text-left">Số điện thoại</th>
                                <th className="p-3 text-left">Địa chỉ</th>
                            </tr>
                        </thead>

                        <tbody>
                            {farmers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-5 text-center text-slate-500">
                                        Chưa có nông dân nào.
                                    </td>
                                </tr>
                            ) : (
                                farmers.map((farmer, index) => (
                                    <tr key={farmer._id} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3 font-bold">{farmer.farmerCode}</td>
                                        <td className="p-3">{farmer.fullName}</td>
                                        <td className="p-3">{farmer.fieldCode}</td>
                                        <td className="p-3">{farmer.phone}</td>
                                        <td className="p-3">{farmer.address}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerUploadFarmers;