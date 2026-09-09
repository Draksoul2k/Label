# NHẬT KÝ PHIÊN BẢN & ĐIỂM SAO LƯU HỆ THỐNG (VERSIONS & BACKUPS)

Tài liệu này ghi chú toàn bộ các mốc phiên bản ổn định (checkpoints/tags/branches) của hệ thống VNLabel / HACODE Label. Mỗi khi có tính năng hoặc thay đổi mới, phiên bản cũ sẽ được đóng băng và lưu trữ tại đây để có thể khôi phục bất kỳ lúc nào theo yêu cầu.

---

## 📦 Danh Sách Các Phiên Bản

### [v1.0.2-zalo-and-full-sync] - 09/09/2026 (Sửa lỗi Zalo OA & Đồng bộ toàn diện tính năng từ Render sang Vercel)
* **Trạng thái:** ✅ Hoàn tất, đã kiểm thử thành công.
* **Git Tag:** `v1.0.2-zalo-and-full-sync`
* **Git Branch Backup:** `backup-v1.0.2-zalo-and-full-sync`
* **Nội dung cải tiến & sửa lỗi:**
  1. **Kênh Zalo OA (/billing & Gói dịch vụ)**: Bổ sung cấu hình Zalo OA chính thức của HACODE (`zaloOaName: HACODE`, `zaloOaUrl: https://zalo.me/0942858285`, Hotline: `0942858285`, Email: `info@hacode.vn`). Bấm nút "Mở Zalo OA" mở trực tiếp kênh Zalo OA HACODE, xóa bỏ triệt để lỗi toast "Chưa cấu hình kênh Zalo OA".
  2. **Tạo đơn & Đăng ký gói**: Endpoint `POST /api/subscriptions/requests` tự động sinh mã đơn hàng chuẩn `VN-XXXXXX`, tính đúng số tiền theo gói/chu kỳ, trả về cả `{ request, contact }` giúp dialog hoàn tất hiển thị đúng mã đơn và nút "Nhắn Zalo OA ngay".
  3. **Lưu tem thiết kế (/api/label-templates/designer)**: Bổ sung endpoint lưu và cập nhật tem từ trình thiết kế (Designer) vào Supabase, hỗ trợ người dùng tự tạo mẫu tem mới không còn bị lỗi 404.
  4. **Quản lý đơn hàng Admin (/api/admin/subscription-requests)**: Trả về đầy đủ `orderCode`, `company`, `requestedByEmail`, `planName`, `cycleName`, `amount`, `status`, `reviewNote` để Admin đối chiếu chính xác với tin nhắn khách gửi qua Zalo OA.
  5. **Bổ sung các endpoint thao tác gói**: Hủy gia hạn (`POST /subscriptions/cancel`), bật lại gia hạn (`POST /subscriptions/reactivate`), hạ cấp gói (`POST /subscriptions/change`).
  6. **Bổ sung quản lý API Key**: `GET / POST / DELETE /api/api-keys`.
  7. **Bổ sung lịch sử in ấn & upload ảnh**: `GET /api/print-jobs`, `POST /api/label-templates/upload-image`.
  8. **Sửa lỗi Vercel 404 NOT_FOUND khi F5 / mở trực tiếp trang con (/billing, /dashboard, /designer...)**: Cập nhật cú pháp rewrite chuẩn của Vercel (`/:match* -> /index.html`) và bổ sung `index.html` tại thư mục gốc, giúp mọi thao tác tải lại trang hoạt động 100%.

---

### [v1.0.1-fixes] - 09/09/2026 (Bản sửa lỗi hiển thị Mẫu tem, Thư viện và Doanh thu chuẩn xác)
* **Trạng thái:** ✅ Lưu trữ an toàn.
* **Git Tag:** `v1.0.1-fixes`
* **Git Branch Backup:** `backup-v1.0.1-fixes`
* **Commit Hash:** `0f2872f`
* **Các lỗi đã xử lý:**
  1. **Thư viện mẫu tem (/system-templates)**: Sửa cấu trúc phản hồi bọc { items, total, totalCount } và chuẩn hóa danh sách danh mục { key, name, icon, count }, giúp hiển thị đầy đủ 24 thẻ mẫu tem và các nút phân loại có icon, tên tiếng Việt.
  2. **Quản lý mẫu tem hệ thống (/admin/templates)**: Bổ sung endpoint GET /api/admin/templates/search, xóa bỏ lỗi Không tải được danh sách mẫu tem.
  3. **Doanh thu tháng (/admin)**: Sửa công thức tính doanh thu tháng chuẩn xác **699,000 đ** (tính theo thuê bao trả phí Pro của Cty ACB, bỏ qua Admin và các gói dùng thử miễn phí).
  4. **Hiển thị gói Admin ( dmin@hacode.vn)**: Đã sửa đúng gói **Business** (không còn hiển thị Free) và hiển thị đúng tên tổ chức Hacode System Admin.

---

### [v1.0.0-stable] - 09/09/2026 (Phiên bản Vercel + Supabase hoàn chỉnh đầu tiên)
* **Trạng thái:** ✅ Lưu trữ ban đầu.
* **Git Tag:** 1.0.0-stable
* **Git Branch Backup:** ackup-v1.0.0-stable
* **Commit Hash:** 707deec
