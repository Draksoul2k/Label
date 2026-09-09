# NHẬT KÝ PHIÊN BẢN & ĐIỂM SAO LƯU HỆ THỐNG (VERSIONS & BACKUPS)

Tài liệu này ghi chú toàn bộ các mốc phiên bản ổn định (checkpoints/tags/branches) của hệ thống VNLabel / HACODE Label. Mỗi khi có tính năng hoặc thay đổi mới, phiên bản cũ sẽ được đóng băng và lưu trữ tại đây để có thể khôi phục bất kỳ lúc nào theo yêu cầu.

---

## 📦 Danh Sách Các Phiên Bản

### [v1.0.6-fix-subscription-resolution-and-foreign-key] - 09/09/2026 (Khắc phục triệt để lỗi đăng ký gói Pro và đồng bộ gói đang dùng)
* **Trạng thái:** ✅ Đã kiểm thử E2E và triển khai.
* **Git Tag:** `v1.0.6-fix-subscription-resolution-and-foreign-key`
* **Git Branch Backup:** `backup-v1.0.6-fix-subscription-resolution-and-foreign-key`
* **Nội dung cải tiến & sửa lỗi:**
  1. **Khắc phục lỗi ưu tiên gói cước (Resolution Priority)**:
     - Phát hiện nguyên nhân tài khoản sau khi nâng cấp Pro vẫn hiển thị gói Free: Bản ghi Free ban đầu được gán `EndDate` đến năm 2126. Khi backend truy vấn `order=EndDate.desc`, hệ thống luôn bốc nhầm gói Free thay vì gói Pro mới tạo.
     - Xây dựng hàm `getActiveSubscriptionForOrg(orgId)` thông minh: ưu tiên các gói trả phí/dùng thử (`Pro`, `Business`) còn hạn so với gói `Free`, và tự động chọn gói mới nhất theo `StartDate`.
     - Áp dụng trên toàn bộ hệ thống: `/api/auth/login`, `/api/profile`, `/api/dashboard/overview`, `/api/subscriptions/current`, `/api/admin/users`, `/api/admin/users/:id/details`.
  2. **Tự động đóng gói cũ khi cấp / duyệt gói mới**:
     - Khi Admin cấp gói hoặc duyệt yêu cầu đăng ký, hệ thống tự động cập nhật trạng thái các gói cũ thành `Status = 1` (Expired), tránh xung đột dữ liệu.
  3. **Đồng bộ đầy đủ ràng buộc khóa ngoại (Foreign Key) và Not-Null**:
     - Đồng bộ cả hai cột `OrgId` và `OrganizationId` trong bảng `Subscriptions` trên Supabase, đảm bảo tính toàn vẹn dữ liệu cho mọi luồng đăng ký user mới, nâng cấp gói và duyệt yêu cầu.

---

### [v1.0.5-fix-pro-registration-and-user-plan] - 09/09/2026 (Sửa lỗi đăng ký và cấp gói Pro cho user trên Admin & Billing)
* **Trạng thái:** ✅ Đã hoàn tất và kiểm thử.
* **Git Tag:** `v1.0.5-fix-pro-registration-and-user-plan`
* **Git Branch Backup:** `backup-v1.0.5-fix-pro-registration-and-user-plan`
* **Nội dung cải tiến & sửa lỗi:**
  1. **Khắc phục lỗi Đăng ký / Kích hoạt / Cấp gói Pro cho User**:
     - Phát hiện nguyên nhân gốc rễ: Khi Admin cấp gói Pro (`PUT /api/admin/users/:id/plan`) hoặc duyệt yêu cầu gói (`POST /api/admin/subscription-requests/:id/approve`), lệnh chèn bản ghi vào bảng `Subscriptions` trên Supabase bị lỗi `HTTP 400 null value in column "AutoRenew" of relation "Subscriptions" violates not-null constraint`.
     - Bổ sung trường `AutoRenew: true` bắt buộc, tính toán đúng số tiền `Amount` (699.000đ/năm, 59.000đ/tháng) và tính toán thời gian `StartDate`, `EndDate` chính xác.
     - Hỗ trợ cả hai phương thức HTTP `PUT` và `POST` cho route `/api/admin/users/:id/plan`.
     - Người dùng hoặc Quản trị viên thao tác cấp gói Pro / chuyển gói thành công 100%, không còn báo lỗi thất bại.

---

### [v1.0.4-clean-plan-status-and-cat-icons] - 09/09/2026 (Hiển thị gói đang dùng & Sửa biểu tượng danh mục mẫu tem)
* **Trạng thái:** ✅ Đã hoàn tất và kiểm thử.
* **Git Tag:** `v1.0.4-clean-plan-status-and-cat-icons`
* **Git Branch Backup:** `backup-v1.0.4-clean-plan-status-and-cat-icons`
* **Nội dung cải tiến & sửa lỗi:**
  1. **Hiển thị trạng thái gói dịch vụ (/billing)**:
     - Gói tài khoản đã đăng ký (ví dụ gói Pro) hiện nút trạng thái **"Đang dùng"** rõ ràng, không hiển thị chữ "Gia hạn Pro" hay nhắc gia hạn khi gói còn nhiều thời hạn (ví dụ còn 365 ngày).
     - Nút "Gia hạn gói" ở khung thông tin trên cùng và nút "Gia hạn" trên thẻ gói chỉ tự động xuất hiện khi tài khoản **gần đến ngày hết hạn** (dưới 30 ngày).
  2. **Khắc phục lỗi biểu tượng danh mục thư viện mẫu tem (/system-templates)**:
     - Chuyển đổi toàn bộ mã icon từ tiền tố FontAwesome (`fa-tag`, `fa-utensils`, `fa-barcode`...) sang định dạng SVG nội tại của frontend (`tag`, `bowl`, `code`, `cup`, `plug`, `gem`, `folder`, `box`, `book`, `leaf`, `gift`, `bottle`, `pill`, `truck`, `shirt`).
     - Các nút danh mục hiển thị đầy đủ icon vector sắc nét, xóa bỏ hoàn toàn hiện tượng hiển thị chữ thô `fa-tag`, `fa-utensils`.

---

### [v1.0.3-spa-routes-and-syntax-fix] - 09/09/2026 (Khắc phục triệt để lỗi 404 NOT_FOUND & 500 FUNCTION_INVOCATION_FAILED trên Vercel)
* **Trạng thái:** ✅ Đã kiểm thử và triển khai.
* **Git Tag:** `v1.0.3-spa-routes-and-syntax-fix`
* **Git Branch Backup:** `backup-v1.0.3-spa-routes-and-syntax-fix`
* **Nội dung cải tiến & sửa lỗi:**
  1. **Sửa lỗi cú pháp Node.js (SyntaxError: Unexpected end of input)**: Bổ sung dấu đóng hàm `});` bị thiếu tại endpoint `POST /api/label-templates/upload-image`, khôi phục hoạt động bình thường cho toàn bộ serverless API trên Vercel.
  2. **Cấu hình chuẩn Vercel SPA Rewrites**: Đồng bộ cấu hình `vercel.json` định tuyến chuẩn:
     - `/api/(.*)` -> `/api/index.js` (xử lý API backend)
     - `/swagger/(.*)` -> `/api/index.js`
     - `/((?!api/|swagger/).*)` -> `/index.html` (chuyển tiếp toàn bộ client routing SPA sang index.html)
  3. **Hỗ trợ tải trực tiếp và F5 toàn bộ trang**: Người dùng F5 hoặc gõ trực tiếp URL `/billing`, `/dashboard`, `/designer`, `/admin` đều nhận HTTP 200 OK với giao diện Angular đầy đủ mà không còn bị 404 NOT_FOUND.

---

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
