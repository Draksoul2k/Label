const API_BASE = "http://localhost:5043/api";

let state = {
  token: localStorage.getItem("vnl_token") || "",
  user: JSON.parse(localStorage.getItem("vnl_user") || "null"),
  currentView: "dashboard",
  templates: [],
  barcodes: [],
  categories: [],
  activeDesign: {
    id: null,
    name: "Tem nhãn mới",
    widthMm: 60,
    heightMm: 40,
    shape: "rect",
    background: "#ffffff",
    elements: [
      { id: "el-1", type: "text", x: 4, y: 3, width: 52, height: 6, text: "{{name}}", fontSize: 9, fontWeight: "bold", textAlign: "left", color: "#000000" },
      { id: "el-2", type: "text", x: 4, y: 10, width: 52, height: 5, text: "Giá: {{price}}", fontSize: 8, fontWeight: "bold", textAlign: "left", color: "#dc2626" },
      { id: "el-3", type: "barcode", x: 4, y: 16, width: 52, height: 18, value: "{{sku}}", format: "CODE128", showText: true }
    ],
    selectedElementIndex: 0
  }
};

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401) {
      showAuthModal();
      throw new Error("Unauthorized");
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return await res.json();
    return await res.text();
  } catch (err) {
    console.error(`[API Error] ${path}:`, err);
    throw err;
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
  if (!state.token) {
    await performLogin("test@gmail.com", "12345678");
  } else {
    updateTopBar();
    navigate(state.currentView);
  }
});

function updateTopBar() {
  if (state.user) {
    document.getElementById("user-display-name").textContent = `${state.user.name} (${state.user.orgName || 'Cty'})`;
    document.getElementById("topbar-plan").textContent = `Gói: ${state.user.plan || 'Free'}`;
    if (state.user.isSystemAdmin) {
      document.getElementById("admin-category").style.display = "block";
      document.getElementById("admin-nav").style.display = "flex";
    }
  }
}

function showAuthModal() { document.getElementById("auth-modal").style.display = "flex"; }
function hideAuthModal() { document.getElementById("auth-modal").style.display = "none"; }

async function performLogin(emailInput, passInput) {
  const email = emailInput || document.getElementById("login-email").value;
  const password = passInput || document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
      return;
    }
    const data = await res.json();
    state.token = data.accessToken;
    state.user = data.user;
    localStorage.setItem("vnl_token", data.accessToken);
    localStorage.setItem("vnl_user", JSON.stringify(data.user));
    hideAuthModal();
    updateTopBar();
    navigate("dashboard");
  } catch (err) {
    alert("Không thể kết nối đến máy chủ API (http://localhost:5043). Hãy chắc chắn Backend đang chạy.");
  }
}

function navigate(view) {
  state.currentView = view;
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => {
    if (el.getAttribute("onclick")?.includes(view)) el.classList.add("active");
  });

  const content = document.getElementById("main-content");
  if (view === "dashboard") renderDashboard(content);
  else if (view === "barcodes") renderBarcodes(content);
  else if (view === "bulk") renderBulkImport(content);
  else if (view === "templates") renderTemplates(content);
  else if (view === "designer") renderDesigner(content);
  else if (view === "print") renderPrint(content);
  else if (view === "team") renderTeam(content);
  else if (view === "apikeys") renderApiKeys(content);
  else if (view === "billing") renderBilling(content);
  else if (view === "admin") renderAdmin(content);
}

// 1. Dashboard View
async function renderDashboard(container) {
  document.getElementById("topbar-title").textContent = "Tổng quan hệ thống";
  container.innerHTML = `<div class="card">Đang tải dữ liệu tổng quan...</div>`;

  try {
    const data = await api("/dashboard/overview");
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7; color:#d97706;"><i class="fa-solid fa-barcode"></i></div>
          <div>
            <div class="stat-val">${data.barcodesThisMonth} / ${data.barcodeLimit}</div>
            <div class="stat-lbl">Mã vạch tháng này</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe; color:#0284c7;"><i class="fa-solid fa-box-archive"></i></div>
          <div>
            <div class="stat-val">${data.productCount} / ${data.productLimit}</div>
            <div class="stat-lbl">Sản phẩm trong kho</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7; color:#16a34a;"><i class="fa-solid fa-users"></i></div>
          <div>
            <div class="stat-val">${data.memberCount}</div>
            <div class="stat-lbl">Thành viên tổ chức</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f3e8ff; color:#9333ea;"><i class="fa-solid fa-crown"></i></div>
          <div>
            <div class="stat-val">${data.planName}</div>
            <div class="stat-lbl">Gói cước đang dùng</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:16px; font-size:16px;">Tính Năng Kích Hoạt Theo Gói Cước (${Object.keys(data.features).length} Feature Flags)</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px;">
          ${Object.entries(data.features).map(([k, v]) => `
            <div style="display:flex; align-items:center; gap:8px; font-size:13px;">
              <i class="fa-solid ${v ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color:${v ? 'var(--success)' : 'var(--danger)'}"></i>
              <span><code>${k}</code></span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi tải dữ liệu. Hãy đảm bảo API Backend đang bật.</div>`;
  }
}

// 2. Barcodes View
async function renderBarcodes(container) {
  document.getElementById("topbar-title").textContent = "Kho mã vạch & Sản phẩm";
  container.innerHTML = `<div class="card">Đang tải danh sách mã vạch...</div>`;

  try {
    const data = await api("/barcodes?page=1&pageSize=50");
    state.barcodes = data.items;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:16px; gap:12px;">
        <input type="text" placeholder="Tìm kiếm theo SKU hoặc tên..." class="form-control" style="max-width:320px;" oninput="filterBarcodes(this.value)">
        <div style="display:flex; gap:10px;">
          <button class="btn btn-secondary" onclick="exportCsv()"><i class="fa-solid fa-file-export"></i> Xuất CSV</button>
          <button class="btn btn-primary" onclick="showAddBarcodeModal()"><i class="fa-solid fa-plus"></i> Thêm sản phẩm</button>
        </div>
      </div>
      <div class="card" style="padding:0; overflow:hidden;">
        <table class="data-table" id="barcodes-table">
          <thead>
            <tr>
              <th>Mã SKU</th>
              <th>Tên sản phẩm</th>
              <th>Loại mã</th>
              <th>Giá bán</th>
              <th>Mã vạch xem trước</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(b => `
              <tr>
                <td><strong>${b.sku}</strong></td>
                <td>${b.name}</td>
                <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12px;">${b.barcodeType}</span></td>
                <td>${Number(b.price).toLocaleString()} đ</td>
                <td><img src="${API_BASE}/barcodes/${b.id}/render" style="height:32px;" alt="${b.sku}"></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="printSingleBarcode('${b.id}')"><i class="fa-solid fa-print"></i></button>
                  <button class="btn btn-danger btn-sm" onclick="deleteBarcode('${b.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi tải danh sách mã vạch.</div>`;
  }
}

async function exportCsv() {
  window.open(`${API_BASE}/barcodes/export`, "_blank");
}

function showAddBarcodeModal() {
  const sku = "SP-" + Math.floor(100000 + Math.random() * 900000);
  const modalHtml = `
    <div class="modal-backdrop" id="add-bc-modal">
      <div class="modal-content">
        <div class="modal-header">
          <span>Thêm Sản Phẩm Mới</span>
          <i class="fa-solid fa-xmark" style="cursor:pointer;" onclick="document.getElementById('add-bc-modal').remove()"></i>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Mã SKU / Barcode *</label>
            <input type="text" id="new-bc-sku" class="form-control" value="${sku}">
          </div>
          <div class="form-group">
            <label class="form-label">Tên sản phẩm *</label>
            <input type="text" id="new-bc-name" class="form-control" placeholder="Ví dụ: Áo sơ mi công sở cao cấp">
          </div>
          <div class="form-group">
            <label class="form-label">Đơn giá (VNĐ)</label>
            <input type="number" id="new-bc-price" class="form-control" value="150000">
          </div>
          <div class="form-group">
            <label class="form-label">Loại mã vạch</label>
            <select id="new-bc-type" class="form-control">
              <option value="Code128">Code 128 (Mặc định)</option>
              <option value="Code39">Code 39</option>
              <option value="QrCode">QR Code</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('add-bc-modal').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="submitAddBarcode()">Lưu sản phẩm</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitAddBarcode() {
  const sku = document.getElementById("new-bc-sku").value;
  const name = document.getElementById("new-bc-name").value;
  const price = parseFloat(document.getElementById("new-bc-price").value) || 0;
  const barcodeType = document.getElementById("new-bc-type").value;

  try {
    await api("/barcodes", {
      method: "POST",
      body: JSON.stringify({ sku, name, price, barcodeType })
    });
    document.getElementById("add-bc-modal").remove();
    navigate("barcodes");
  } catch (err) {
    alert("Lỗi thêm sản phẩm: " + err.message);
  }
}

async function deleteBarcode(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa mã vạch này?")) return;
  try {
    await api(`/barcodes/${id}`, { method: "DELETE" });
    navigate("barcodes");
  } catch (err) {
    alert("Không thể xóa mã vạch");
  }
}

// 3. Bulk Import View
function renderBulkImport(container) {
  document.getElementById("topbar-title").textContent = "Nhập dữ liệu hàng loạt";
  container.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:12px; font-size:16px;">Nhập Danh Sách Sản Phẩm Từ CSV / Excel</h3>
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
        Định dạng CSV chuẩn: <code>SKU,Name,Price,Category</code> (Dòng đầu tiên là tiêu đề).
      </p>
      <textarea id="csv-input" class="form-control" style="height:180px; font-family:monospace; margin-bottom:16px;">SKU,Name,Price,Category
SP-GIAP-01,Giày Thể Thao Nam,499000,Giày Dép
SP-BALO-02,Balo Du Lịch Chống Nước,350000,Phụ Kiện
SP-VI-03,Ví Da Bò Cao Cấp,220000,Ví Da</textarea>
      <button class="btn btn-primary" onclick="executeBulkImport()"><i class="fa-solid fa-cloud-arrow-up"></i> Thực hiện Import</button>
    </div>
  `;
}

async function executeBulkImport() {
  const csvContent = document.getElementById("csv-input").value;
  try {
    const res = await api("/barcodes/bulk-import", {
      method: "POST",
      body: JSON.stringify({ csvContent })
    });
    alert(`Import thành công: ${res.successCount} sản phẩm, Lỗi: ${res.failedCount}`);
    navigate("barcodes");
  } catch (err) {
    alert("Lỗi khi import dữ liệu");
  }
}

// 4. Templates Library View
async function renderTemplates(container) {
  document.getElementById("topbar-title").textContent = "Thư viện 24 mẫu tem chuẩn công nghiệp";
  container.innerHTML = `<div class="card">Đang tải danh sách mẫu tem...</div>`;

  try {
    const data = await api("/label-templates/library");
    state.templates = data.items;

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
        ${data.items.map(t => `
          <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <span style="font-weight:600; font-size:15px;">${t.name}</span>
                <span style="background:#e2e8f0; font-size:11px; padding:2px 8px; border-radius:999px;">${t.widthMm}×${t.heightMm}mm</span>
              </div>
              <div style="background:#f8fafc; border:1px dashed var(--border); height:120px; border-radius:var(--radius); display:flex; align-items:center; justify-content:center; margin-bottom:14px;">
                <i class="fa-solid fa-tag" style="font-size:32px; color:#cbd5e1;"></i>
              </div>
              <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Danh mục: <strong>${t.category}</strong> | Hình dáng: <code>${t.shape}</code></div>
            </div>
            <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center;" onclick="copyTemplateToMine('${t.id}')">
              <i class="fa-solid fa-copy"></i> Dùng mẫu này
            </button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi tải thư viện mẫu.</div>`;
  }
}

async function copyTemplateToMine(id) {
  try {
    const copy = await api(`/label-templates/library/${id}/copy`, { method: "POST" });
    alert("Đã sao chép mẫu vào danh sách của bạn. Đang mở trình thiết kế!");
    loadTemplateToDesigner(copy);
  } catch (err) {
    alert("Không thể sao chép mẫu tem");
  }
}

// 5. WYSIWYG Designer Studio
function renderDesigner(container) {
  document.getElementById("topbar-title").textContent = "Trình thiết kế tem nhãn (WYSIWYG)";
  const t = state.activeDesign;

  container.innerHTML = `
    <div class="designer-container">
      <!-- Toolbar -->
      <div class="designer-toolbar">
        <div style="font-weight:600; font-size:14px; margin-bottom:4px;">Công cụ vẽ</div>
        <button class="btn btn-secondary btn-sm" onclick="addElement('text')"><i class="fa-solid fa-font"></i> Thêm Text</button>
        <button class="btn btn-secondary btn-sm" onclick="addElement('barcode')"><i class="fa-solid fa-barcode"></i> Thêm Barcode</button>
        <button class="btn btn-secondary btn-sm" onclick="addElement('qrcode')"><i class="fa-solid fa-qrcode"></i> Thêm QR Code</button>
        <button class="btn btn-secondary btn-sm" onclick="addElement('rect')"><i class="fa-regular fa-square"></i> Thêm Khung viền</button>
        <button class="btn btn-secondary btn-sm" onclick="addElement('line')"><i class="fa-solid fa-minus"></i> Thêm Đường kẻ</button>
        
        <hr style="border:0; border-top:1px solid var(--border); margin:8px 0;">
        <div style="font-weight:600; font-size:13px;">Chèn biến tự động</div>
        <button class="btn btn-secondary btn-sm" onclick="insertVariable('{{name}}')">Tên SP <code>{{name}}</code></button>
        <button class="btn btn-secondary btn-sm" onclick="insertVariable('{{sku}}')">Mã SKU <code>{{sku}}</code></button>
        <button class="btn btn-secondary btn-sm" onclick="insertVariable('{{price}}')">Giá bán <code>{{price}}</code></button>

        <hr style="border:0; border-top:1px solid var(--border); margin:8px 0;">
        <button class="btn btn-primary" style="justify-content:center;" onclick="saveTemplateFromDesigner()">
          <i class="fa-solid fa-floppy-disk"></i> Lưu mẫu tem
        </button>
      </div>

      <!-- Canvas Stage -->
      <div class="designer-canvas-area">
        <div class="canvas-paper" id="canvas-paper" style="
          width: ${t.widthMm * 6}px;
          height: ${t.heightMm * 6}px;
          border-radius: ${t.shape === 'rounded' ? '12px' : (t.shape === 'ellipse' ? '50%' : '0')};
          background: ${t.background};
          border: 1px solid #94a3b8;
        ">
          ${renderCanvasElements()}
        </div>
      </div>

      <!-- Inspector Panel -->
      <div class="designer-inspector">
        <h4 style="font-size:14px; margin-bottom:12px;">Thông số tem nhãn</h4>
        <div class="form-group">
          <label class="form-label">Tên mẫu tem</label>
          <input type="text" class="form-control" value="${t.name}" oninput="state.activeDesign.name = this.value">
        </div>
        <div style="display:flex; gap:10px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Rộng (mm)</label>
            <input type="number" class="form-control" value="${t.widthMm}" onchange="changeCanvasDimension('widthMm', this.value)">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Cao (mm)</label>
            <input type="number" class="form-control" value="${t.heightMm}" onchange="changeCanvasDimension('heightMm', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Hình dáng</label>
          <select class="form-control" onchange="changeCanvasShape(this.value)">
            <option value="rect" ${t.shape==='rect'?'selected':''}>Chữ nhật vuông góc</option>
            <option value="rounded" ${t.shape==='rounded'?'selected':''}>Bo góc (Rounded)</option>
            <option value="ellipse" ${t.shape==='ellipse'?'selected':''}>Bầu dục / Tròn</option>
          </select>
        </div>

        <hr style="border:0; border-top:1px solid var(--border); margin:16px 0;">
        <h4 style="font-size:14px; margin-bottom:12px;">Thuộc tính phần tử</h4>
        <div id="element-properties-content">
          ${renderElementProperties()}
        </div>
      </div>
    </div>
  `;
}

function renderCanvasElements() {
  const scale = 6; // 1mm = 6px on screen
  return state.activeDesign.elements.map((el, idx) => {
    const isSelected = idx === state.activeDesign.selectedElementIndex;
    const border = isSelected ? "1px dashed var(--primary)" : "none";

    if (el.type === "text") {
      return `
        <div onclick="selectElement(${idx})" style="
          position:absolute; left:${el.x * scale}px; top:${el.y * scale}px;
          width:${el.width * scale}px; height:${el.height * scale}px;
          font-size:${el.fontSize * 1.5}px; font-weight:${el.fontWeight || 'normal'};
          color:${el.color}; border:${border}; cursor:pointer; user-select:none;
        ">${el.text}</div>
      `;
    } else if (el.type === "barcode") {
      return `
        <div onclick="selectElement(${idx})" style="
          position:absolute; left:${el.x * scale}px; top:${el.y * scale}px;
          width:${el.width * scale}px; height:${el.height * scale}px;
          border:${border}; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center;
        ">
          <i class="fa-solid fa-barcode" style="font-size:24px;"></i>
          <span style="font-size:9px; font-family:monospace;">${el.value}</span>
        </div>
      `;
    } else if (el.type === "qrcode") {
      return `
        <div onclick="selectElement(${idx})" style="
          position:absolute; left:${el.x * scale}px; top:${el.y * scale}px;
          width:${el.width * scale}px; height:${el.height * scale}px;
          border:${border}; cursor:pointer; display:flex; align-items:center; justify-content:center;
        ">
          <i class="fa-solid fa-qrcode" style="font-size:28px;"></i>
        </div>
      `;
    } else if (el.type === "rect") {
      return `
        <div onclick="selectElement(${idx})" style="
          position:absolute; left:${el.x * scale}px; top:${el.y * scale}px;
          width:${el.width * scale}px; height:${el.height * scale}px;
          border:1px solid #000; border-radius:${el.borderRadius || 0}px; cursor:pointer;
        "></div>
      `;
    }
    return '';
  }).join('');
}

function renderElementProperties() {
  const el = state.activeDesign.elements[state.activeDesign.selectedElementIndex];
  if (!el) return '<p style="font-size:12px; color:var(--text-muted);">Bấm vào phần tử trên tem để chỉnh sửa.</p>';

  return `
    <div class="form-group">
      <label class="form-label">Loại phần tử</label>
      <input type="text" class="form-control" value="${el.type.toUpperCase()}" disabled>
    </div>
    ${el.type === 'text' ? `
      <div class="form-group">
        <label class="form-label">Nội dung text</label>
        <input type="text" class="form-control" value="${el.text}" oninput="updateCurrentElement('text', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Cỡ chữ (pt)</label>
        <input type="number" class="form-control" value="${el.fontSize}" onchange="updateCurrentElement('fontSize', parseFloat(this.value))">
      </div>
    ` : ''}
    ${el.type === 'barcode' || el.type === 'qrcode' ? `
      <div class="form-group">
        <label class="form-label">Dữ liệu mã hóa</label>
        <input type="text" class="form-control" value="${el.value}" oninput="updateCurrentElement('value', this.value)">
      </div>
    ` : ''}
    <div style="display:flex; gap:10px;">
      <div class="form-group" style="flex:1;">
        <label class="form-label">Tọa độ X (mm)</label>
        <input type="number" class="form-control" value="${el.x}" onchange="updateCurrentElement('x', parseFloat(this.value))">
      </div>
      <div class="form-group" style="flex:1;">
        <label class="form-label">Tọa độ Y (mm)</label>
        <input type="number" class="form-control" value="${el.y}" onchange="updateCurrentElement('y', parseFloat(this.value))">
      </div>
    </div>
    <button class="btn btn-danger btn-sm" style="width:100%; margin-top:8px;" onclick="removeSelectedElement()">
      <i class="fa-solid fa-trash"></i> Xóa phần tử này
    </button>
  `;
}

function selectElement(idx) {
  state.activeDesign.selectedElementIndex = idx;
  document.getElementById("canvas-paper").innerHTML = renderCanvasElements();
  document.getElementById("element-properties-content").innerHTML = renderElementProperties();
}

function updateCurrentElement(prop, val) {
  const el = state.activeDesign.elements[state.activeDesign.selectedElementIndex];
  if (el) {
    el[prop] = val;
    document.getElementById("canvas-paper").innerHTML = renderCanvasElements();
  }
}

function addElement(type) {
  const newEl = {
    id: "el-" + Math.floor(Math.random() * 1000),
    type,
    x: 5, y: 5,
    width: type === "qrcode" ? 15 : 40,
    height: type === "qrcode" ? 15 : (type === "barcode" ? 14 : 6),
    text: "Văn bản mẫu",
    value: "SP-" + Math.floor(Math.random() * 10000),
    fontSize: 8,
    color: "#000000"
  };
  state.activeDesign.elements.push(newEl);
  selectElement(state.activeDesign.elements.length - 1);
}

function removeSelectedElement() {
  state.activeDesign.elements.splice(state.activeDesign.selectedElementIndex, 1);
  state.activeDesign.selectedElementIndex = 0;
  selectElement(0);
}

function insertVariable(v) {
  const el = state.activeDesign.elements[state.activeDesign.selectedElementIndex];
  if (el) {
    if (el.type === 'text') el.text = (el.text || '') + ' ' + v;
    else if (el.type === 'barcode' || el.type === 'qrcode') el.value = v;
    selectElement(state.activeDesign.selectedElementIndex);
  }
}

function changeCanvasDimension(prop, val) {
  state.activeDesign[prop] = parseFloat(val) || 40;
  renderDesigner(document.getElementById("main-content"));
}

function changeCanvasShape(val) {
  state.activeDesign.shape = val;
  renderDesigner(document.getElementById("main-content"));
}

function loadTemplateToDesigner(tpl) {
  state.activeDesign = {
    id: tpl.id,
    name: tpl.name,
    widthMm: tpl.widthMm,
    heightMm: tpl.heightMm,
    shape: tpl.shape || 'rect',
    background: tpl.background || '#ffffff',
    elements: JSON.parse(tpl.elementsJson || '[]'),
    selectedElementIndex: 0
  };
  navigate("designer");
}

async function saveTemplateFromDesigner() {
  const t = state.activeDesign;
  try {
    const res = await api("/label-templates/designer", {
      method: "POST",
      body: JSON.stringify({
        id: t.id,
        name: t.name,
        widthMm: t.widthMm,
        heightMm: t.heightMm,
        shape: t.shape,
        background: t.background,
        elementsJson: JSON.stringify(t.elements)
      })
    });
    alert("Lưu mẫu tem thành công!");
    t.id = res.id;
  } catch (err) {
    alert("Lỗi lưu mẫu tem: " + err.message);
  }
}

// 6. Print Center View
async function renderPrint(container) {
  document.getElementById("topbar-title").textContent = "Trung tâm in ấn & Xuất file";
  container.innerHTML = `<div class="card">Đang chuẩn bị dữ liệu in ấn...</div>`;

  try {
    const [templatesData, barcodesData] = await Promise.all([
      api("/label-templates/library"),
      api("/barcodes?pageSize=50")
    ]);

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:360px 1fr; gap:20px;">
        <div class="card">
          <h3 style="font-size:16px; margin-bottom:14px;">Cấu hình in ấn</h3>
          
          <div class="form-group">
            <label class="form-label">Chọn mẫu tem</label>
            <select id="print-template-select" class="form-control" onchange="updatePrintPreview()">
              ${templatesData.items.map(t => `<option value="${t.id}">${t.name} (${t.widthMm}×${t.heightMm}mm)</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Chọn sản phẩm cần in</label>
            <select id="print-barcode-select" class="form-control" onchange="updatePrintPreview()">
              ${barcodesData.items.map(b => `<option value="${b.id}">${b.sku} - ${b.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Số lượng tem cần in</label>
            <input type="number" id="print-qty" class="form-control" value="2" min="1" max="5000" onchange="updatePrintPreview()">
          </div>

          <hr style="border:0; border-top:1px solid var(--border); margin:16px 0;">
          
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button class="btn btn-primary" onclick="triggerDirectWebPrint()">
              <i class="fa-solid fa-print"></i> In trực tiếp (Web Print)
            </button>
            <button class="btn btn-secondary" onclick="triggerDownloadPdf()">
              <i class="fa-solid fa-file-pdf" style="color:var(--danger)"></i> Xuất file PDF Vector
            </button>
            <button class="btn btn-secondary" onclick="triggerDownloadZpl()">
              <i class="fa-solid fa-barcode"></i> Xuất file ZPL (Máy in nhiệt)
            </button>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:16px; margin-bottom:14px;">Xem trước bản in (Live Print Preview)</h3>
          <div id="print-preview-container" style="background:#f1f5f9; border:1px solid var(--border); border-radius:var(--radius); padding:20px; display:flex; flex-wrap:wrap; gap:16px; min-height:300px; align-items:center; justify-content:center;">
            <p style="color:var(--text-muted); font-size:13px;">Đang tải bản in mẫu...</p>
          </div>
        </div>
      </div>
    `;

    updatePrintPreview();
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi nạp dữ liệu in ấn.</div>`;
  }
}

async function updatePrintPreview() {
  const templateId = document.getElementById("print-template-select")?.value;
  const barcodeId = document.getElementById("print-barcode-select")?.value;
  const qty = parseInt(document.getElementById("print-qty")?.value) || 1;
  const previewBox = document.getElementById("print-preview-container");
  if (!templateId || !barcodeId || !previewBox) return;

  try {
    const res = await api("/print/preview", {
      method: "POST",
      body: JSON.stringify({
        templateId,
        items: [{ barcodeId, quantity: qty }]
      })
    });

    previewBox.innerHTML = res.labels.map(l => `
      <div style="
        width:${res.widthMm * 4}px; height:${res.heightMm * 4}px;
        background:${res.background}; border:1px solid #94a3b8;
        border-radius:${res.shape === 'rounded' ? '8px' : (res.shape === 'ellipse' ? '50%' : '0')};
        box-shadow:var(--shadow); position:relative; padding:8px; overflow:hidden;
      ">
        <div style="font-weight:bold; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.name}</div>
        <div style="color:var(--danger); font-size:10px; font-weight:bold; margin-top:2px;">${Number(l.price).toLocaleString()} đ</div>
        <div style="margin-top:6px; display:flex; justify-content:center;">
          <img src="${API_BASE}/barcodes/${l.barcodeId}/render" style="height:34px; max-width:90%;" alt="${l.sku}">
        </div>
      </div>
    `).join('');
  } catch (err) {
    previewBox.innerHTML = `<p style="color:var(--danger)">Lỗi xem trước bản in.</p>`;
  }
}

async function triggerDirectWebPrint() {
  const templateId = document.getElementById("print-template-select").value;
  const barcodeId = document.getElementById("print-barcode-select").value;
  const qty = parseInt(document.getElementById("print-qty").value) || 1;

  const html = await api("/print/html", {
    method: "POST",
    body: JSON.stringify({ templateId, items: [{ barcodeId, quantity: qty }] })
  });

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

async function triggerDownloadPdf() {
  const templateId = document.getElementById("print-template-select").value;
  const barcodeId = document.getElementById("print-barcode-select").value;
  const qty = parseInt(document.getElementById("print-qty").value) || 1;

  const res = await fetch(`${API_BASE}/print/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${state.token}` },
    body: JSON.stringify({ templateId, items: [{ barcodeId, quantity: qty }] })
  });

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `labels_${Date.now()}.pdf`;
  a.click();
}

async function triggerDownloadZpl() {
  const templateId = document.getElementById("print-template-select").value;
  const barcodeId = document.getElementById("print-barcode-select").value;
  const qty = parseInt(document.getElementById("print-qty").value) || 1;

  const zplText = await api("/print/zpl", {
    method: "POST",
    body: JSON.stringify({ templateId, items: [{ barcodeId, quantity: qty }] })
  });

  const blob = new Blob([zplText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `labels_${Date.now()}.zpl`;
  a.click();
}

// 7. Team View
async function renderTeam(container) {
  document.getElementById("topbar-title").textContent = "Quản lý Đội ngũ & Thành viên";
  container.innerHTML = `<div class="card">Đang tải thành viên...</div>`;

  try {
    const members = await api("/organization/users");
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
        <h3 style="font-size:16px;">Thành viên tổ chức</h3>
        <button class="btn btn-primary" onclick="showInviteModal()"><i class="fa-solid fa-user-plus"></i> Mời thành viên</button>
      </div>
      <div class="card" style="padding:0; overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên thành viên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tham gia</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td><strong>${m.name}</strong></td>
                <td>${m.email}</td>
                <td><span class="badge-plan">${m.role}</span></td>
                <td>${new Date(m.createdAt).toLocaleDateString("vi-VN")}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi tải danh sách thành viên.</div>`;
  }
}

function showInviteModal() {
  const modalHtml = `
    <div class="modal-backdrop" id="invite-modal">
      <div class="modal-content">
        <div class="modal-header">
          <span>Mời Thành Viên Mới</span>
          <i class="fa-solid fa-xmark" style="cursor:pointer;" onclick="document.getElementById('invite-modal').remove()"></i>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Họ và tên</label>
            <input type="text" id="inv-name" class="form-control" placeholder="Nguyễn Văn A">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="inv-email" class="form-control" placeholder="nhanvien@congty.com">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu ban đầu</label>
            <input type="password" id="inv-pass" class="form-control" value="12345678">
          </div>
          <div class="form-group">
            <label class="form-label">Vai trò</label>
            <select id="inv-role" class="form-control">
              <option value="Member">Member (Thành viên)</option>
              <option value="Admin">Admin (Quản trị viên)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('invite-modal').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="submitInvite()">Gửi lời mời</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitInvite() {
  const name = document.getElementById("inv-name").value;
  const email = document.getElementById("inv-email").value;
  const password = document.getElementById("inv-pass").value;
  const role = document.getElementById("inv-role").value;

  try {
    await api("/organization/invite", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role })
    });
    alert("Mời thành viên thành công!");
    document.getElementById("invite-modal").remove();
    navigate("team");
  } catch (err) {
    alert("Lỗi mời thành viên: " + err.message);
  }
}

// 8. API Keys View
async function renderApiKeys(container) {
  document.getElementById("topbar-title").textContent = "Tích hợp API Keys";
  container.innerHTML = `<div class="card">Đang tải danh sách API Keys...</div>`;

  try {
    const keys = await api("/apikeys");
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
        <h3 style="font-size:16px;">Khóa kết nối ERP, POS & TMĐT</h3>
        <button class="btn btn-primary" onclick="createApiKey()"><i class="fa-solid fa-plus"></i> Tạo API Key mới</button>
      </div>
      <div class="card" style="padding:0; overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên Key</th>
              <th>Tiền tố</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${keys.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Chưa có API Key nào.</td></tr>' : ''}
            ${keys.map(k => `
              <tr>
                <td><strong>${k.name}</strong></td>
                <td><code>${k.keyPrefix}••••••••</code></td>
                <td><span style="color:var(--success); font-weight:600;">Active</span></td>
                <td>${new Date(k.createdAt).toLocaleDateString("vi-VN")}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteApiKey('${k.id}')"><i class="fa-solid fa-trash"></i></button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi tải API Keys.</div>`;
  }
}

async function createApiKey() {
  const name = prompt("Nhập tên cho API Key (ví dụ: KiotViet Integration, Shopee Sync):");
  if (!name) return;

  try {
    const res = await api("/apikeys", {
      method: "POST",
      body: JSON.stringify({ name })
    });
    alert(`Tạo API Key thành công! Vui lòng lưu lại khóa bí mật (chỉ hiển thị 1 lần duy nhất):\n\n${res.fullApiKey}`);
    navigate("apikeys");
  } catch (err) {
    alert("Lỗi tạo API Key");
  }
}

async function deleteApiKey(id) {
  if (!confirm("Bạn có chắc muốn thu hồi API Key này?")) return;
  try {
    await api(`/apikeys/${id}`, { method: "DELETE" });
    navigate("apikeys");
  } catch (err) {
    alert("Lỗi thu hồi API Key");
  }
}

// 9. Billing View
async function renderBilling(container) {
  document.getElementById("topbar-title").textContent = "Gói cước & Bảng giá SaaS";
  container.innerHTML = `<div class="card">Đang tải bảng giá...</div>`;

  try {
    const [plans, contact] = await Promise.all([
      api("/subscriptions/plans"),
      api("/subscriptions/contact")
    ]);

    container.innerHTML = `
      <div style="text-align:center; margin-bottom:28px;">
        <h2 style="font-size:22px; margin-bottom:8px;">Bảng Giá Dịch Vụ HACODE</h2>
        <p style="font-size:14px; color:var(--text-muted);">Lựa chọn gói dịch vụ tối ưu cho doanh nghiệp và xưởng in của bạn.</p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px; margin-bottom:32px;">
        ${plans.map(p => `
          <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; ${p.popular ? 'border:2px solid var(--primary);' : ''}">
            <div>
              ${p.popular ? '<div style="background:var(--primary); color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:999px; display:inline-block; margin-bottom:12px;">Phổ biến nhất</div>' : ''}
              <h3 style="font-size:20px; font-weight:700;">${p.name}</h3>
              <p style="font-size:13px; color:var(--text-muted); margin:6px 0 16px;">${p.description}</p>
              
              <div style="font-size:28px; font-weight:800; color:var(--text); margin-bottom:16px;">
                ${p.priceMonthly === 0 ? 'Miễn phí' : `${Number(p.priceMonthly).toLocaleString()} đ<span style="font-size:14px; font-weight:normal; color:var(--text-muted);">/tháng</span>`}
              </div>

              <hr style="border:0; border-top:1px solid var(--border); margin-bottom:16px;">

              <div style="font-size:13px; font-weight:600; margin-bottom:10px;">Tính năng bao gồm:</div>
              <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:13px; margin-bottom:20px;">
                ${p.features.map(f => `<li><i class="fa-solid fa-check" style="color:var(--success); margin-right:8px;"></i>${f}</li>`).join('')}
              </ul>
            </div>

            <button class="btn ${p.popular ? 'btn-primary' : 'btn-secondary'}" style="width:100%; justify-content:center;" onclick="requestUpgrade('${p.key}')">
              ${p.key === 'free' ? 'Đang sử dụng' : 'Nâng cấp ngay'}
            </button>
          </div>
        `).join('')}
      </div>

      <div class="card" style="background:#f8fafc;">
        <h4 style="font-size:15px; margin-bottom:8px;">Hỗ Trợ Nhanh & Tư Vấn Triển Khai</h4>
        <p style="font-size:13px; color:var(--text-muted);">
          Hotline: <strong>${contact.hotline}</strong> | Zalo OA: <strong>${contact.zaloOaName}</strong> | Email: <strong>${contact.email}</strong> (${contact.workingHours})
        </p>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi nạp bảng giá.</div>`;
  }
}

async function requestUpgrade(planKey) {
  if (planKey === "free") return;
  const note = prompt(`Nhập ghi chú nâng cấp gói ${planKey.toUpperCase()} (ví dụ: Nâng cấp 1 năm):`);
  if (note === null) return;

  try {
    await api("/subscriptions/requests", {
      method: "POST",
      body: JSON.stringify({
        plan: planKey,
        cycle: "month",
        contactName: state.user?.name || "Khách hàng",
        contactPhone: state.user?.phone || "0942858285",
        note
      })
    });
    alert("Yêu cầu nâng cấp đã được gửi đến Quản trị viên hệ thống để phê duyệt!");
  } catch (err) {
    alert("Lỗi gửi yêu cầu nâng cấp");
  }
}

// 10. Super Admin View
async function renderAdmin(container) {
  document.getElementById("topbar-title").textContent = "Bảng điều khiển Super Admin";
  container.innerHTML = `<div class="card">Đang tải dữ liệu quản trị...</div>`;

  try {
    const [stats, requests] = await Promise.all([
      api("/admin/stats"),
      api("/admin/subscription-requests")
    ]);

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe; color:#0284c7;"><i class="fa-solid fa-building"></i></div>
          <div>
            <div class="stat-val">${stats.totalOrganizations}</div>
            <div class="stat-lbl">Tổng số công ty</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7; color:#d97706;"><i class="fa-solid fa-users"></i></div>
          <div>
            <div class="stat-val">${stats.totalUsers}</div>
            <div class="stat-lbl">Tổng người dùng</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7; color:#16a34a;"><i class="fa-solid fa-clock"></i></div>
          <div>
            <div class="stat-val">${stats.pendingRequests}</div>
            <div class="stat-lbl">Yêu cầu chờ duyệt</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f3e8ff; color:#9333ea;"><i class="fa-solid fa-barcode"></i></div>
          <div>
            <div class="stat-val">${stats.totalBarcodes}</div>
            <div class="stat-lbl">Mã vạch toàn sàn</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:16px; margin-bottom:14px;">Yêu Cầu Nâng Cấp Gói Chờ Duyệt (${requests.filter(r => r.status === 'Pending').length})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Công ty</th>
              <th>Người liên hệ</th>
              <th>Gói yêu cầu</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${requests.length === 0 ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Không có yêu cầu nào.</td></tr>' : ''}
            ${requests.map(r => `
              <tr>
                <td><strong>${r.orgName}</strong></td>
                <td>${r.contactName} (${r.contactPhone})</td>
                <td><span class="badge-plan">${r.plan.toUpperCase()}</span> (${r.cycle})</td>
                <td>${r.note || '-'}</td>
                <td><span style="font-weight:600; color:${r.status==='Approved'?'var(--success)':'var(--warning)'};">${r.status}</span></td>
                <td>
                  ${r.status === 'Pending' ? `
                    <button class="btn btn-primary btn-sm" onclick="approveRequest('${r.id}')"><i class="fa-solid fa-check"></i> Duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectRequest('${r.id}')"><i class="fa-solid fa-xmark"></i></button>
                  ` : 'Đã xử lý'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--danger)">Lỗi tải dữ liệu Super Admin.</div>`;
  }
}

async function approveRequest(id) {
  if (!confirm("Bạn có chắc muốn phê duyệt và kích hoạt gói cước cho khách hàng này?")) return;
  try {
    await api(`/admin/subscription-requests/${id}/approve`, { method: "POST", body: "{}" });
    alert("Đã kích hoạt gói cước thành công!");
    navigate("admin");
  } catch (err) {
    alert("Lỗi phê duyệt yêu cầu");
  }
}

async function rejectRequest(id) {
  const note = prompt("Nhập lý do từ chối:") || "Thông tin thanh toán chưa khớp";
  try {
    await api(`/admin/subscription-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
    alert("Đã từ chối yêu cầu");
    navigate("admin");
  } catch (err) {
    alert("Lỗi từ chối");
  }
}
