# NHẬT KÝ PHIÊN BẢN & ĐIỂM SAO LƯU HỆ THỐNG (VERSIONS & BACKUPS)

Tài liệu này ghi chú toàn bộ các mốc phiên bản ổn định (checkpoints/tags/branches) của hệ thống VNLabel / HACODE Label. Mỗi khi có tính năng hoặc thay đổi mới, phiên bản cũ sẽ được đóng băng và lưu trữ tại đây để có thể khôi phục bất kỳ lúc nào theo yêu cầu.

---

## 📌 Quy Trình Lưu Trữ Phiên Bản (Versioning Protocol)
1. **Trước khi thực hiện thay đổi lớn hoặc tính năng mới:**
   - Tạo điểm gắn thẻ Git (git tag -a vX.Y.Z -m ...).
   - Đẩy thẻ lên GitHub: git push origin vX.Y.Z.
   - Tạo nhánh sao lưu tương ứng: ackup-vX.Y.Z.
   - Ghi nhật ký vào tài liệu VERSIONS.md.
2. **Khi cần quay lại phiên bản cũ (Rollback):**
   - Chỉ cần chỉ định tên phiên bản (ví dụ: 1.0.0-stable), hệ thống sẽ tự động khôi phục mã nguồn và cấu hình tương ứng chỉ trong 1 lệnh.

---

## 📦 Danh Sách Các Phiên Bản

### [v1.0.0-stable] - 09/09/2026 (Phiên bản Vercel + Supabase hoàn chỉnh đầu tiên)
* **Trạng thái:** ✅ Ổn định tuyệt đối, đã kiểm thử 100% trên môi trường thật https://label.hacode.vn.
* **Git Tag:** 1.0.0-stable
* **Git Branch Backup:** ackup-v1.0.0-stable
* **Commit Hash:** 707deec
* **Cấu hình & Nền tảng:**
  - Frontend: Angular SPA triển khai trên Vercel.
  - Backend: Node.js / Express Serverless API tích hợp trực tiếp trên Vercel (/api/*).
  - Database: Supabase PostgreSQL (oaroamqjvzcmlrfsfit), không còn phụ thuộc Render / Railway.
  - Tên miền: https://label.hacode.vn.
* **Tính năng & Dữ liệu:**
  - **Tài khoản:** Đầy đủ 10 tài khoản (dmin@hacode.vn - Business trọn đời, 	est@gmail.com - Pro, kythuat@hacode.vn, v.v.).
  - **Mẫu tem nhãn:** 36 mẫu tem (24 mẫu tem thư viện hệ thống + 12 mẫu tem người dùng tự tạo / tùy chỉnh).
  - **Sản phẩm & Mã vạch:** Đầy đủ các danh mục sản phẩm, mã vạch thời trang, phụ kiện từ dữ liệu gốc.
  - **Đầy đủ 14 phân hệ API:** Auth, Profile, Subscriptions, Invoices, Barcodes, Categories, Label Templates, Admin Templates, Admin Users, Admin Stats, Reports, ApiKeys, Organization & Members, Fonts.
* **Lệnh khôi phục nhanh về bản này:**
  `ash
  git checkout backup-v1.0.0-stable
  git push -f origin main
  `
