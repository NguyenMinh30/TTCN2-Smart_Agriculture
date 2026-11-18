import React from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Sprout,
  Sun,
  Cloud,
} from "lucide-react";

const Home = () => {
  const userRoles = [
    {
      id: "nn",
      title: "Nông dân",
      desc: "Khai báo tình trạng bệnh trên cây Cà chua và Dưa chuột.",
      icon: <Leaf size={34} />,
      path: "/login?role=nn",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-500",
      text: "text-emerald-700",
    },
    {
      id: "kt",
      title: "Cán bộ kỹ thuật",
      desc: "Kiểm tra, xác minh và gán nhãn dữ liệu bệnh cây.",
      icon: <ShieldCheck size={34} />,
      path: "/login?role=cbkt",
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-500",
      text: "text-blue-700",
    },
    {
      id: "htx",
      title: "Chủ HTX",
      desc: "Theo dõi mức độ dịch bệnh và tư vấn xử lý cho hộ dân.",
      icon: <BarChart3 size={34} />,
      path: "/login?role=manager",
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-500",
      text: "text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 text-slate-800 overflow-hidden">
      <div className="fixed top-[-120px] right-[-120px] w-96 h-96 bg-green-200/50 rounded-full blur-3xl"></div>
      <div className="fixed bottom-[-130px] left-[-120px] w-96 h-96 bg-emerald-200/60 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* NAVBAR */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
              <Sprout size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-green-700">
                Smart Agriculture
              </h2>
              <p className="text-sm text-slate-500">
                Quản lý bệnh cây trồng
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
              <Sun size={18} className="text-amber-500" />
              <span>Nông nghiệp thông minh</span>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-green-100">
              <Cloud size={18} className="text-blue-500" />
              <span>Dữ liệu thời gian thực</span>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <header className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm mb-6">
              <Leaf size={18} />
              Hệ thống hỗ trợ Cà chua và Dưa chuột
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6">
              Quản lý dữ liệu
              <span className="block text-green-600">
                bệnh cây trồng
              </span>
              dễ dàng hơn
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
              Hệ thống giúp nông dân khai báo bệnh cây, cán bộ kỹ thuật xác minh
              dữ liệu và chủ HTX theo dõi tình hình dịch bệnh trên cây trồng.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login?role=nn"
                className="bg-green-600 hover:bg-green-700 text-white px-7 py-4 rounded-2xl font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all"
              >
                Bắt đầu khai báo
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="bg-white rounded-[32px] shadow-2xl shadow-green-100 border border-green-100 p-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-[28px] p-8 text-white mb-6">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="text-green-100 text-sm mb-1">
                    Tổng quan hệ thống
                  </p>
                  <h3 className="text-3xl font-extrabold">
                    Smart Farm Data
                  </h3>
                </div>

                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Leaf size={32} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/15 rounded-2xl p-4">
                  <h4 className="text-3xl font-extrabold">2</h4>
                  <p className="text-green-100 text-sm">Loại cây trồng</p>
                </div>

                <div className="bg-white/15 rounded-2xl p-4">
                  <h4 className="text-3xl font-extrabold">3</h4>
                  <p className="text-green-100 text-sm">Vai trò sử dụng</p>
                </div>

                <div className="bg-white/15 rounded-2xl p-4">
                  <h4 className="text-3xl font-extrabold">24/7</h4>
                  <p className="text-green-100 text-sm">Theo dõi dữ liệu</p>
                </div>


              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Cây trồng</p>
                <h4 className="font-bold text-green-700 mt-1">Cà chua</h4>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-sm text-slate-500">Cây trồng</p>
                <h4 className="font-bold text-emerald-700 mt-1">Dưa chuột</h4>
              </div>
            </div>
          </div>
        </header>

        {/* ROLE CARDS */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Chọn vai trò truy cập
            </h2>
            <p className="text-slate-500">
              Mỗi vai trò sẽ có chức năng riêng trong hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {userRoles.map((role) => (
              <div
                key={role.id}
                className={`${role.bg} ${role.border} border rounded-[28px] p-7 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}
              >
                <div
                  className={`${role.iconBg} w-16 h-16 rounded-2xl text-white flex items-center justify-center mb-7 shadow-lg`}
                >
                  {role.icon}
                </div>

                <h3 className={`text-2xl font-extrabold mb-3 ${role.text}`}>
                  {role.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed min-h-[66px] mb-7">
                  {role.desc}
                </p>

                <Link
                  to={role.path}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  Truy cập
                  <ArrowRight size={18} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-20 pt-8 border-t border-green-200 text-center">
          <p className="text-sm text-slate-500">
            © 2026 Dự án Smart Agriculture - Hệ thống quản lý nông nghiệp số.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;