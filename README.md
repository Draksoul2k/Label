# VNLabel - Nền Tảng Quản Lý Mã Vạch & Thiết Kế Tem Nhãn

Hệ thống đầy đủ 100% chức năng: Quản lý sản phẩm mã vạch, Trình thiết kế tem nhãn WYSIWYG kéo-thả, In ấn trực tiếp đa phương thức (ZPL, PDF Vector, HTML Web Print), Quản lý tổ chức đa người dùng, Gói cước SaaS và Cổng Quản trị Super Admin.

## 🚀 Chạy Ngay Bằng Docker / Render
Dự án đã có sẵn `Dockerfile` hỗ trợ triển khai trực tiếp lên Render, Railway, Fly.io hoặc bất kỳ VPS nào.

- Cổng mặc định: `80` (hoặc biến môi trường `$PORT`)
- Cơ sở dữ liệu: SQLite tự động khởi tạo và seed dữ liệu ban đầu.

## 💻 Chạy Local
Chạy file `start.bat` trên Windows hoặc:
```bash
cd backend
dotnet run --project VNLabel.Api/VNLabel.Api.csproj
```
Truy cập: `http://localhost:5043`

## 🔑 Tài Khoản Mặc Định
- **Người dùng (Gói Pro):** `test@gmail.com` / `12345678`
- **Quản trị viên (Super Admin):** `admin@vnlabel.vn` / `Admin@123456`
