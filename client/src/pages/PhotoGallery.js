import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Search, Filter, Maximize2, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PhotoGallery = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports');
      setReports(res.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu kho ảnh:", error);
    } finally {
      setLoading(false);
    }
  };

// HÀM XỬ LÝ XÓA ẢNH
  const handleDeleteImage = async (reportId, imageUrl, e) => {
    // 1. Ngăn sự kiện click lan ra ngoài (tránh mở modal phóng to ảnh khi bấm nút xóa)
    if (e) e.stopPropagation(); 

    // 2. Xác nhận trước khi xóa
    if (!window.confirm('⚠️ Bạn có chắc chắn muốn xóa ảnh này khỏi kho không? Hành động này không thể hoàn tác!')) {
      return;
    }

    try {
      // 3. Gọi API gửi request xóa ảnh tới Backend
      // LƯU Ý: Phải dùng thuộc tính 'data' để gửi body trong axios.delete
      const response = await axios.delete(`http://localhost:5000/api/reports/${reportId}/image`, {
        data: { imageUrl: imageUrl } 
      });

      if (response.status === 200) {
        alert('✅ Đã xóa ảnh thành công!');

        // 4. Cập nhật lại mảng reports state để ảnh biến mất ngay lập tức trên UI (không cần F5)
        setReports(prevReports => prevReports.map(report => {
          if (report._id === reportId) {
            return {
              ...report,
              images: report.images.filter(img => img.imageUrl !== imageUrl)
            };
          }
          return report;
        }));

        // 5. Nếu đang mở ảnh to mà bấm xóa thì tự động đóng modal lại
        if (zoomedImage && zoomedImage.url === imageUrl) {
          setZoomedImage(null);
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      // Hiển thị lỗi từ backend trả về (nếu có)
      const errorMessage = error.response?.data?.message || '❌ Không thể xóa ảnh. Vui lòng kiểm tra lại server!';
      alert(errorMessage);
    }
  };

  // HÀM XỬ LÝ VÀ PHÂN LOẠI DỮ LIỆU
  const processImages = () => {
    const gallery = {};

    reports.forEach((report) => {
      const crop = report.cropType || 'Chưa xác định';
      
      if (selectedCrop !== 'Tất cả' && crop !== selectedCrop) return;

      report.images?.forEach((img) => {
        if (img.status === 'confirmed' && img.diseaseLabel && img.imageUrl) {
          const disease = img.diseaseLabel;
          
          if (searchTerm && !disease.toLowerCase().includes(searchTerm.toLowerCase())) return;

          if (!gallery[crop]) gallery[crop] = {};
          if (!gallery[crop][disease]) gallery[crop][disease] = [];

          gallery[crop][disease].push({
            url: img.imageUrl,
            reportId: report._id, // Lấy ID của report để gửi lên server khi xóa
            plotId: report.plotId,
            farmerId: report.farmerId,
            date: report.createdAt || new Date().toISOString()
          });
        }
      });
    });

    return gallery;
  };

  const galleryData = processImages();
  const availableCrops = ['Tất cả', ...new Set(reports.map(r => r.cropType).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/technician" className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <ImageIcon size={24} className="text-emerald-600" />
                Kho ảnh đã gán nhãn
              </h1>
              <p className="text-sm text-slate-500">Tài liệu hình ảnh phục vụ huấn luyện AI và tra cứu</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 mt-8">
        <section className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên bệnh..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {availableCrops.map(crop => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCrop === crop 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Filter size={16} className={selectedCrop === crop ? "opacity-100" : "opacity-50"} />
                {crop}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Đang tải dữ liệu kho ảnh...</div>
        ) : Object.keys(galleryData).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 flex flex-col items-center">
            <ImageIcon size={48} className="text-slate-300 mb-4" />
            <h3 className="font-bold text-lg">Chưa có ảnh nào phù hợp</h3>
            <p className="text-sm">Hãy kiểm tra lại bộ lọc hoặc gán nhãn thêm ảnh từ danh sách chờ.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(galleryData).map(([crop, diseases]) => (
              <div key={crop} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-3">
                  <span className="w-3 h-8 bg-emerald-500 rounded-full inline-block"></span>
                  Cây {crop}
                </h2>

                <div className="space-y-8">
                  {Object.entries(diseases).map(([disease, images]) => (
                    <div key={disease}>
                      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm">{disease}</span>
                        <span className="text-sm font-medium text-slate-400">({images.length} ảnh)</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {images.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-200 hover:border-emerald-400 transition-all shadow-sm"
                            onClick={() => setZoomedImage(img)}
                          >
                            <img 
                              src={img.url} 
                              alt={`${disease} - ${idx}`} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            
                            {/* NÚT XÓA ẢNH GÓC TRÊN TRÁI */}
                            <button 
                              onClick={(e) => handleDeleteImage(img.reportId, img.url, e)}
                              className="absolute top-2 left-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                              title="Xóa ảnh này"
                            >
                              <Trash2 size={16} />
                            </button>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                              <p className="text-white text-xs font-bold truncate">Thửa: {img.plotId}</p>
                              <Maximize2 size={16} className="text-white absolute top-3 right-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL PHÓNG TO ẢNH */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={24} />
          </button>
          <div className="relative max-w-5xl w-full flex flex-col md:flex-row gap-6 items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 w-full flex justify-center relative">
              <img 
                src={zoomedImage.url} 
                alt="Phóng to" 
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
              />
            </div>
            <div className="w-full md:w-80 bg-slate-800 text-slate-200 p-6 rounded-2xl border border-slate-700 shadow-2xl shrink-0">
              <h4 className="text-emerald-400 font-extrabold text-lg mb-4 pb-4 border-b border-slate-700">Thông tin ảnh</h4>
              <div className="space-y-3 text-sm mb-6">
                <p className="flex justify-between"><span className="text-slate-400">Trạng thái:</span> <span className="text-emerald-400 font-bold">Đã xác nhận</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Mã nông dân:</span> <span className="font-medium text-white">{zoomedImage.farmerId || '---'}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Mã Thửa:</span> <span className="font-medium text-white">{zoomedImage.plotId || '---'}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Ngày tạo:</span> <span className="font-medium text-white">{new Date(zoomedImage.date).toLocaleDateString('vi-VN')}</span></p>
              </div>

              {/* NÚT XÓA TRONG MODAL */}
              <button 
                onClick={() => handleDeleteImage(zoomedImage.reportId, zoomedImage.url)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl transition-all font-bold"
              >
                <Trash2 size={18} />
                Xóa ảnh này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;