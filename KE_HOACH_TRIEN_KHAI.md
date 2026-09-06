# Kế Hoạch Triển Khai Chi Tiết: Xây Dựng Bản Sao 1:1 Hệ Thống VNLabel & Nâng Cấp

Dự án này là tài liệu kỹ thuật chuẩn xác 100%, được đối chiếu và bóc tách trực tiếp từ hệ thống **VNLabel** (`vnlabel.vn` & `api.vnlabel.vn`), bao gồm toàn bộ mã nguồn Frontend (46 JS chunks), 65 API Endpoints, 24 Mẫu tem công nghiệp, 30 thuộc tính của phần tử thiết kế, và hệ thống kiểm soát tính năng Feature Flags.

---

## Bảng Đối Chiếu Thông Tin Xác Thực Đã Kiểm Tra Với Hệ Thống

| Mục kiểm tra | Dữ liệu thực tế bóc tách từ VNLabel |
| :--- | :--- |
| **Tài khoản test** | SĐT: `0874845488` \| Email: `test@gmail.com` \| Pass: `12345678` |
| **User Profile** | ID: `2ce5db8c-...` \| Tên: **Nguyễn Xuân Nam** \| Vai trò: `Owner` |
| **Tổ chức (Tenant)** | Công ty: **Cty ACB** (Org ID: `6648948e-...`) \| Gói: `Free` |
| **Giới hạn Gói Free** | 50 Barcode/tháng, 30 Sản phẩm, 1 User, In có Watermark |
| **Thư viện lõi Frontend** | `JsBarcode` (vẽ barcode), `qrcode` (vẽ QR), `jsPDF` (xuất PDF), `xlsx (SheetJS)` (đọc Excel), `FontAwesome` (icon hệ thống), `toast` (thông báo) |
| **Chu kỳ giá (Terms)** | 1 tháng (Pro: 59k, Business: 166k), 1 năm (Pro: 699k, Business: 1.99tr), 2 năm (Pro: 1.398tr, Business: 3.98tr) |
| **Hình dáng tem (Shapes)**| `rect` (Chữ nhật), `rounded` (Bo góc), `ellipse` (Bầu dục / tròn) |

---

## Chi Tiết Kỹ Thuật Lõi Của Trình Thiết Kế (Label Designer Engine)

### 1. Hệ tọa độ & Công thức chuyển đổi
- Đơn vị lưu trữ: **Milimet (mm)**
- Công thức ánh xạ màn hình:
  $$\text{Pixel (px)} = \text{Tọa độ (mm)} \times \text{scaleFactor}$$
- Khi in ấn xuất file: Chuẩn hóa theo $203\text{ DPI } (8\text{ dots/mm})$ hoặc $300\text{ DPI } (11.81\text{ dots/mm})$.

### 2. Danh mục 30 Thuộc tính Phần tử (`elementsJson`)
Bao gồm các loại phần tử: `text`, `barcode`, `qrcode`, `image`, `rect`, `circle`, `line`:
1. `id`: Định danh duy nhất phần tử (`el-xxx`)
2. `type`: Loại phần tử (`text`, `barcode`, `qrcode`, `rect`, `line`, `image`, `circle`)
3. `x`: Tọa độ X (mm)
4. `y`: Tọa độ Y (mm)
5. `width`: Chiều rộng (mm)
6. `height`: Chiều cao (mm)
7. `zIndex`: Thứ tự lớp hiển thị
8. `locked`: Cờ khóa cố định vị trí
9. `rotation`: Góc xoay ($0^\circ, 90^\circ, 180^\circ, 270^\circ$)
10. `text`: Nội dung chữ (hỗ trợ biến động `{{sku}}`, `{{name}}`, `{{price}}`, `{{category}}`)
11. `field`: Tên trường liên kết động
12. `fontFamily`: Phông chữ (Arial, Times New Roman, Roboto, Montserrat...)
13. `fontSize`: Cỡ chữ (mm)
14. `fontWeight`: `bold` hoặc `normal`
15. `fontStyle`: `italic` hoặc `normal`
16. `textAlign`: `left`, `center`, `right`
17. `textPosition`: `top`, `bottom` (vị trí chữ số so với vạch barcode)
18. `color`: Màu chữ / nét
19. `uppercase`: boolean (ép viết hoa toàn bộ)
20. `value`: Giá trị mã hóa barcode/QR
21. `format`: Chuẩn mã vạch (`CODE128`, `CODE39`, `QRCODE`)
22. `barHeight`: Chiều cao vạch barcode (mm)
23. `moduleWidth`: Bề rộng vạch đơn vị barcode
24. `showText`: Ẩn / hiện chuỗi ký tự bên dưới barcode
25. `fill`: Màu nền (fill color của hình khối)
26. `stroke`: Màu đường viền
27. `strokeWidth`: Độ dày viền (mm)
28. `borderRadius`: Bán kính bo góc (mm)
29. `lineStyle`: Kiểu nét (`solid`, `dashed`, `dotted`)
30. `invert`: Đảo màu (chữ/vạch trắng trên nền đen)

### 3. Cấu hình In ấn Tiêu chuẩn (`printSettingsJson`)
Lưu trữ thông số máy in:
- `columns`: Số lượng tem trên 1 hàng ngang (1 đến 10 tem/hàng)
- `rows`: Số tem trên chiều dọc (cho in giấy A4/A5)
- `cutLine`: boolean (hiển thị đường đứt đoạn vạch chia nhãn)
- `colGapMm`: Khoảng cách giữa các cột tem (2mm - 3mm)
- `rowGapMm`: Khoảng cách giữa các hàng tem
- `marginTopMm`, `marginLeftMm`: Lề trên và lề trái trang in

---

## Kế Hoạch Triển Khai Từng Bước (Implementation Phases)

### Giai đoạn 1: Khởi tạo Cơ sở Dữ liệu & Kiến trúc Multi-Tenant
- [ ] Khởi tạo Database (PostgreSQL) gồm **12 bảng**:
  1. `organizations`: `id`, `name`, `slug`, `logo_url`, `created_at`
  2. `users`: `id`, `org_id`, `email`, `phone`, `password_hash`, `name`, `role`, `is_system_admin`, `is_email_verified`
  3. `categories`: `id`, `org_id`, `name`
  4. `barcode_items`: `id`, `org_id`, `sku`, `name`, `barcode_type`, `price`, `category_id`, `description`
  5. `label_templates`: `id`, `org_id`, `name`, `category`, `width_mm`, `height_mm`, `shape`, `background`, `elements_json`, `print_settings_json`, `thumbnail_url`, `is_system`, `is_published`
  6. `subscription_plans`: `key`, `name`, `price_monthly`, `price_yearly`, `barcode_limit`, `product_limit`, `max_users`, `feature_flags_json`
  7. `subscriptions`: `id`, `org_id`, `plan`, `cycle`, `start_date`, `end_date`, `status`, `amount`
  8. `subscription_requests`: `id`, `org_id`, `plan`, `cycle`, `contact_name`, `contact_phone`, `status`, `note`
  9. `invoices`: `id`, `org_id`, `subscription_id`, `amount`, `status`, `paid_at`
  10. `api_keys`: `id`, `org_id`, `name`, `key_prefix`, `key_hash`, `is_active`
  11. `fonts`: `id`, `name`, `family_css`, `source`, `file_url`, `supports_vietnamese`, `is_active`
  12. `activity_logs`: `id`, `org_id`, `user_id`, `action`, `details`, `created_at`
- [ ] Cài đặt `TenantMiddleware` lọc tự động theo `org_id`.

### Giai đoạn 2: Module Xác thực & Quản trị Tổ chức
- [ ] Cài đặt JWT Service (`accessToken` 24h, `refreshToken` 30 ngày).
- [ ] API Đăng ký (`POST /api/auth/register`): Tự động tạo Org + Gán User làm `Owner` (Gói Free).
- [ ] API Đăng nhập (`POST /api/auth/login`): Đăng nhập linh hoạt bằng Email hoặc Số điện thoại.
- [ ] API Mời thành viên & Phân quyền (`/api/organization/users`).
- [ ] API Quản lý API Key (`/api/api-keys`).

### Giai đoạn 3: Module Barcode & Bulk Import Excel
- [ ] API CRUD Barcode & Danh mục.
- [ ] API Render Barcode PNG server-side (`GET /api/barcodes/{id}/render`).
- [ ] Frontend Bulk Import: Tích hợp `SheetJS (xlsx)` đọc file Excel, tự động nhận diện cột `Mã SKU`, `Tên hàng`, `Giá`, `Danh mục`, hiển thị bảng xem trước và validate trước khi đẩy lên `/api/barcodes/bulk-import`.

### Giai đoạn 4: Bộ Thiết Kế Nhãn WYSIWYG (Trọng tâm)
- [ ] Xây dựng Canvas mm có thước đo (Ruler), lưới (Grid), hỗ trợ 3 hình dáng tem (`rect`, `rounded`, `ellipse`).
- [ ] Xây dựng bộ điều khiển 30 thuộc tính cho các element (`text`, `barcode`, `qrcode`, `image`, `shape`, `line`).
- [ ] Tích hợp `JsBarcode` vẽ barcode thời gian thực và `qrcode` vẽ mã QR.
- [ ] Tích hợp tính năng tự động lưu nháp (`localStorage`) phòng ngừa mất dữ liệu.
- [ ] Trình biên dịch biến động `{{sku}}`, `{{name}}`, `{{price}}`.

### Giai đoạn 5: Print Engine (In ấn Đa phương thức)
- [ ] Màn hình chọn mẫu tem + chọn danh sách sản phẩm + số lượng tem in.
- [ ] Trình xuất in Web (`@media print` không margin).
- [ ] Trình xuất PDF Vector (`jsPDF`) hỗ trợ in cuộn decal 1 tem/trang hoặc in tờ A4/A5 nhiều tem trên hàng.
- [ ] Trình sinh mã ZPL chuẩn công nghiệp cho máy in nhiệt Zebra/Xprinter/Godex.

### Giai đoạn 6: Nạp 24 Mẫu Tem Mặc Định & Quản lý Font Chữ
- [ ] Seed toàn bộ 24 mẫu tem tiêu chuẩn đã bóc tách từ VNLabel vào Database.
- [ ] Xây dựng màn hình Thư viện Mẫu hệ thống (`/system-templates`) kèm nút "Sao chép vào Mẫu của tôi".
- [ ] Tích hợp danh mục font tiếng Việt (Google Fonts & System Fonts) không bị lỗi hiển thị.

### Giai đoạn 7: Quản Lý Gói Cước SaaS & Bảng Giá (Billing)
- [ ] Xây dựng màn hình Bảng giá (`/billing`) với 3 gói (Free, Pro: 59k, Business: 166k) và 3 chu kỳ (1 tháng, 1 năm, 2 năm).
- [ ] Luồng gửi yêu cầu nâng cấp (`POST /api/subscriptions/requests`).
- [ ] Kiểm soát 17 Feature Flags trong toàn bộ ứng dụng.

### Giai đoạn 8: Super Admin Dashboard & Landing Page
- [ ] Màn hình Thống kê toàn sàn (`/admin/stats`).
- [ ] Màn hình Phê duyệt nâng cấp gói cước (`/admin/subscription-requests`).
- [ ] Màn hình Quản lý Mẫu hệ thống và Quản lý Font chữ.
- [ ] Giao diện Landing Page giới thiệu sản phẩm.

---

## Kế Hoạch Cải Tiến Sau Khi Hoàn Thành Bản Sao (Enhancement Phase)
1. **Bảo mật**: Bật HSTS, CSP, khóa Swagger trên Production, thêm Rate Limiting, xác thực Email kích hoạt tài khoản.
2. **Designer 2.0**: Thêm Undo/Redo (`Ctrl+Z`), Căn gióng thông minh (Smart Magnetic Snapping), Bảng quản lý Layer Z-Index, Mở rộng barcode `EAN-13`, `DataMatrix`, `PDF417`.
3. **In ấn Phần cứng**: In trực tiếp qua cổng USB bằng `WebUSB / WebSerial API` (không cần bật popup hộp thoại in Windows).
4. **Tích hợp TMĐT & POS**: Tự động lấy đơn hàng Shopee, TikTok Shop, Lazada và đồng bộ KiotViet, Sapo.
5. **AI Assistant**: AI Prompt sinh template tem nhãn tự động và AI OCR bóc tách thông tin từ ảnh chụp bao bì.
