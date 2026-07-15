const express = require("express");

const router = express.Router();

const reportController =
    require("../controllers/reportController");

/*
=========================
LẤY DANH SÁCH BÁO CÁO
=========================
*/
router.get(
    "/",
    reportController.getReports
);

/*
=========================
XÁC NHẬN + GÁN NHÃN THEO ẢNH
=========================
*/
router.put(
    "/:reportId/images/:imageIndex/confirm",
    reportController.confirmImage
);

/*
=========================
ĐÁNH DẤU SAI BỆNH THEO ẢNH
=========================
*/
router.put(
    "/:reportId/images/:imageIndex/wrong",
    reportController.markWrongDisease
);

/*
=========================
ĐÁNH DẤU ĐÃ XỬ LÝ BÁO CÁO
=========================
*/
router.put(
    "/:id/resolve",
    reportController.resolveReport
);

/*
=========================
THỐNG KÊ CHỦ HTX
=========================
*/
router.get(
    "/dashboard/stats",
    reportController.getDashboardStats
);

/*
=========================
SỐ HỘ DÂN BÁO CÁO
=========================
*/
router.get(
    "/owner-stats",
    reportController.getOwnerStats
);

/*
=========================
BIỂU ĐỒ 7 NGÀY
=========================
*/
router.get(
    "/weekly-trend",
    reportController.getWeeklyTrend
);

module.exports = router;

/*
=========================
XÓA ẢNH KHỎI KHO ẢNH
=========================
*/
router.delete(
    "/:id/image",
    reportController.deleteImage
);

module.exports = router;