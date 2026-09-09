# NHẬT KÝ PHIÊN BẢN & ĐIỂM SAO LƯU HỆ THỐNG (VERSIONS & BACKUPS)

Tài liệu này ghi chú toàn bộ các mốc phiên bản ổn định (checkpoints/tags/branches) của hệ thống VNLabel / HACODE Label. Mỗi khi có tính năng hoặc thay đổi mới, phiên bản cũ sẽ được đóng băng và lưu trữ tại đây để có thể khôi phục bất kỳ lúc nào theo yêu cầu.

---

## 📦 Danh Sách Các Phiên Bản

### [v1.0.1-fixes] - 09/09/2026 (Bản sửa lỗi hiển thị Mẫu tem, Thư viện và Doanh thu chuẩn xác)
* **Trạng thái:** ✅ Ổn định tuyệt đối, đã kiểm thử trực tiếp trên https://label.hacode.vn.
* **Git Tag:** 1.0.1-fixes
* **Git Branch Backup:** ackup-v1.0.1-fixes
* **Commit Hash:** c0e47e2
* **Các lỗi đã xử lý:**
  1. **Thư viện mẫu tem (/system-templates)**: Sửa cấu trúc phản hồi bọc { items, total, totalCount } và chuẩn hóa danh sách danh mục { key, name, icon, count }, giúp hiển thị đầy đủ 24 thẻ mẫu tem và các nút phân loại có icon, tên tiếng Việt.
  2. **Quản lý mẫu tem hệ thống (/admin/templates)**: Bổ sung endpoint GET /api/admin/templates/search, xóa bỏ lỗi Không tải được danh sách mẫu tem.
  3. **Doanh thu tháng (/admin)**: Sửa công thức tính doanh thu tháng chuẩn xác **699,000 đ** (tính theo thuê bao trả phí Pro của Cty ACB, bỏ qua Admin và các gói dùng thử miễn phí).
  4. **Hiển thị gói Admin (dmin@hacode.vn)**: Đã sửa đúng gói **Business** (không còn hiển thị Free) và hiển thị đúng tên tổ chức Hacode System Admin.
  5. **Số lượng mẫu tem ở phụ đề**: Hiển thị đầy đủ số lượng 36 mẫu tem.

---

### [v1.0.0-stable] - 09/09/2026 (Phiên bản Vercel + Supabase hoàn chỉnh đầu tiên)
* **Trạng thái:** ✅ Lưu trữ ban đầu.
* **Git Tag:** 1.0.0-stable
* **Git Branch Backup:** ackup-v1.0.0-stable
* **Commit Hash:** 707deec
