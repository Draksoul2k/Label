const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && req.url !== '/') {
    req.url = '/api' + req.url;
  }
  next();
});

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boaroamqjvzcmlrfsfit.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYXJvYW1xanZ6Y21scmZzZml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDQ1OTgsImV4cCI6MjEwNDMyMDU5OH0.pzinNPh-pxWWc2CPsClcPHdWAeydgudZyOye08gezq8';
const JWT_SECRET = process.env.JWT_SECRET || 'VNLabelSuperSecretKeyForJwtAuthenticationMustBeAtLeast32BytesLong!';

// Helper to call Supabase REST API
async function supaFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text();
    let parsed;
    try { parsed = JSON.parse(errText); } catch { parsed = { message: errText }; }
    throw { status: res.status, ...parsed };
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập hoặc thiếu token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token đã hết hạn hoặc không hợp lệ' });
  }
}

// System Admin Check
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.isAdmin !== 'True' && req.user.email !== 'admin@hacode.vn' && req.user.role !== 'Owner')) {
    return res.status(403).json({ message: 'Bạn không có quyền quản trị hệ thống' });
  }
  next();
}

// ----------------------------------------------------
// 1. AUTH ENDPOINTS
// ----------------------------------------------------

// POST /api/auth/login
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    const input = email.trim().toLowerCase();
    const users = await supaFetch(`Users?or=(Email.ilike.${input},Phone.eq.${input})&select=*&limit=1`);
    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const user = users[0];
    const passwordMatch = bcrypt.compareSync(password, user.PasswordHash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    // Determine plan and admin
    const isAdmin = user.IsSystemAdmin || user.Email.toLowerCase() === 'admin@hacode.vn';
    let planName = 'Free';

    if (isAdmin) {
      planName = 'Business';
    } else {
      const subs = await supaFetch(`Subscriptions?OrgId=eq.${user.OrgId}&Status=eq.1&order=EndDate.desc&limit=1`);
      if (subs && subs.length > 0) {
        const sub = subs[0];
        const p = (sub.Plan || '').toLowerCase();
        if (p === 'business') planName = 'Business';
        else if (p === 'pro') planName = 'Pro';
        else if (p === 'basic') planName = 'Basic';
        else planName = sub.PlanName || 'Free';
      }
    }

    // Get Organization
    let orgName = 'Tổ chức';
    try {
      const orgs = await supaFetch(`Organizations?Id=eq.${user.OrgId}&select=*&limit=1`);
      if (orgs && orgs.length > 0) orgName = orgs[0].Name;
    } catch {}

    const roleName = user.Role === 0 ? 'Owner' : (user.Role === 1 ? 'Admin' : (user.Role === 2 ? 'Editor' : 'Viewer'));

    const tokenPayload = {
      sub: user.Id,
      email: user.Email,
      orgId: user.OrgId,
      role: roleName,
      isAdmin: isAdmin ? 'True' : 'False',
      name: user.Name
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return res.json({
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
        phone: user.Phone,
        role: roleName,
        plan: planName,
        orgId: user.OrgId,
        orgName,
        isSystemAdmin: isAdmin,
        avatarUrl: user.AvatarUrl || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập', detail: err.message });
  }
});

// POST /api/auth/register
app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu không được để trống' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await supaFetch(`Users?Email=ilike.${cleanEmail}&select=Id&limit=1`);
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'Email này đã được sử dụng trên hệ thống' });
    }

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Create Org
    await supaFetch('Organizations', {
      method: 'POST',
      body: JSON.stringify([{
        Id: orgId,
        Name: name ? `Tổ chức của ${name.trim()}` : 'Tổ chức cá nhân',
        Slug: `org-${userId.substring(0, 8)}`,
        CreatedAt: now
      }])
    });

    // 2. Create User
    const hash = bcrypt.hashSync(password, 10);
    const newUsers = await supaFetch('Users', {
      method: 'POST',
      body: JSON.stringify([{
        Id: userId,
        OrgId: orgId,
        Email: cleanEmail,
        Phone: phone ? phone.trim() : null,
        Name: name ? name.trim() : cleanEmail.split('@')[0],
        PasswordHash: hash,
        Role: 0, // Owner
        IsSystemAdmin: false,
        IsEmailVerified: true,
        CreatedAt: now
      }])
    });

    // 3. Create Free Subscription
    await supaFetch('Subscriptions', {
      method: 'POST',
      body: JSON.stringify([{
        Id: crypto.randomUUID(),
        OrgId: orgId,
        Plan: 'free',
        PlanName: 'Free',
        BillingCycle: 0,
        Term: 'forever',
        TermName: 'Gói Miễn phí (Free)',
        StartDate: now,
        EndDate: farFuture,
        Status: 1, // Active
        AutoRenew: false,
        Amount: 0
      }])
    });

    const user = newUsers[0] || { Id: userId, Name: name, Email: cleanEmail, OrgId: orgId };
    const tokenPayload = {
      sub: user.Id,
      email: user.Email,
      orgId: user.OrgId,
      role: 'Owner',
      isAdmin: 'False',
      name: user.Name
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return res.json({
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
        phone: user.Phone || null,
        role: 'Owner',
        plan: 'Free',
        orgId: user.OrgId,
        orgName: name ? `Tổ chức của ${name.trim()}` : 'Tổ chức',
        isSystemAdmin: false,
        avatarUrl: null
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Lỗi đăng ký tài khoản', detail: err.message });
  }
});

// POST /api/auth/refresh-token
app.post(['/api/auth/refresh-token', '/auth/refresh-token'], (req, res) => {
  return res.json({
    accessToken: jwt.sign({ sub: 'refreshed' }, JWT_SECRET, { expiresIn: '30d' }),
    refreshToken: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
});

// ----------------------------------------------------
// 2. DASHBOARD OVERVIEW
// ----------------------------------------------------
app.get(['/api/dashboard/overview', '/dashboard/overview'], authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const isAdmin = req.user.isAdmin === 'True' || req.user.email === 'admin@hacode.vn';

    // Get Barcodes count
    let barcodes = [];
    try {
      barcodes = await supaFetch(`BarcodeItems?OrgId=eq.${orgId}&order=CreatedAt.desc&limit=10`);
    } catch {}

    // Get plan details
    let plan = {
      Name: isAdmin ? 'Business' : 'Free',
      BarcodeLimit: isAdmin ? 100000 : 50,
      ProductLimit: isAdmin ? 100000 : 30,
      FeatureFlagsJson: JSON.stringify({
        bulkUpload: isAdmin,
        products: isAdmin,
        subAccounts: isAdmin,
        templateLibrary: true,
        systemTemplates: true,
        directPrint: true,
        activityLog: isAdmin
      })
    };

    if (!isAdmin) {
      try {
        const subs = await supaFetch(`Subscriptions?OrgId=eq.${orgId}&Status=eq.1&order=EndDate.desc&limit=1`);
        if (subs && subs.length > 0) {
          const pKey = subs[0].Plan || 'free';
          const plans = await supaFetch(`SubscriptionPlans?Key=eq.${pKey}&limit=1`);
          if (plans && plans.length > 0) plan = plans[0];
        }
      } catch {}
    }

    let membersCount = 1;
    try {
      const members = await supaFetch(`Users?OrgId=eq.${orgId}&select=Id`);
      membersCount = members.length;
    } catch {}

    const features = typeof plan.FeatureFlagsJson === 'string' ? JSON.parse(plan.FeatureFlagsJson || '{}') : (plan.FeatureFlagsJson || {});
    if (isAdmin) {
      features.subAccounts = true;
      features.products = true;
      features.activityLog = true;
      features.bulkUpload = true;
    }

    return res.json({
      barcodeCount: barcodes.length,
      barcodesThisMonth: barcodes.length,
      barcodeLimit: plan.BarcodeLimit,
      productCount: barcodes.length,
      productLimit: plan.ProductLimit,
      planName: isAdmin ? 'Business' : (plan.Name || 'Free'),
      planRenewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      memberCount: membersCount,
      features,
      usageHistory: [
        { month: 'Tháng 4', count: Math.max(2, barcodes.length) },
        { month: 'Tháng 5', count: Math.max(5, barcodes.length * 2) },
        { month: 'Tháng 6', count: Math.max(3, barcodes.length) },
        { month: 'Tháng 7', count: barcodes.length }
      ],
      recentBarcodes: barcodes.map(b => ({
        id: b.Id,
        sku: b.Sku || 'SKU-001',
        name: b.Name || 'Sản phẩm mẫu',
        barcodeType: b.BarcodeType || 'Code128',
        createdAt: b.CreatedAt
      }))
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    return res.status(500).json({ message: 'Lỗi tải dashboard', detail: err.message });
  }
});

// ----------------------------------------------------
// 3. LABEL TEMPLATES
// ----------------------------------------------------
app.get(['/api/label-templates/mine', '/label-templates/mine', '/api/labeltemplates/mine', '/labeltemplates/mine'], authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const templates = await supaFetch(`LabelTemplates?OrgId=eq.${orgId}&order=CreatedAt.desc`);
    return res.json(templates.map(mapTemplate));
  } catch (err) {
    return res.json([]);
  }
});

app.get(['/api/label-templates/library', '/label-templates/library', '/api/system-templates', '/system-templates', '/api/label-templates', '/label-templates', '/api/labeltemplates', '/labeltemplates'], async (req, res) => {
  try {
    const templates = await supaFetch(`LabelTemplates?IsSystem=eq.true&order=SortOrder.asc`);
    return res.json(templates.map(mapTemplate));
  } catch (err) {
    return res.json([]);
  }
});

app.get(['/api/label-templates/:id', '/label-templates/:id', '/api/labeltemplates/:id', '/labeltemplates/:id'], async (req, res) => {
  try {
    const templates = await supaFetch(`LabelTemplates?Id=eq.${req.params.id}&limit=1`);
    if (!templates || templates.length === 0) return res.status(404).json({ message: 'Không tìm thấy mẫu tem' });
    return res.json(mapTemplate(templates[0]));
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy mẫu tem', detail: err.message });
  }
});

app.post(['/api/label-templates', '/label-templates', '/api/labeltemplates', '/labeltemplates'], authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const t = req.body || {};
    const id = t.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      Id: id,
      OrgId: orgId,
      Name: t.name || 'Mẫu tem mới',
      Category: t.category || 'general',
      WidthMm: t.widthMm || 50,
      HeightMm: t.heightMm || 30,
      Shape: t.shape || 'rect',
      Background: t.background || '#ffffff',
      ElementsJson: typeof t.elements === 'object' ? JSON.stringify(t.elements) : (t.elementsJson || '[]'),
      PrintSettingsJson: typeof t.printSettings === 'object' ? JSON.stringify(t.printSettings) : (t.printSettingsJson || '{}'),
      ThumbnailUrl: t.thumbnailUrl || null,
      IsSystem: false,
      IsPublished: true,
      CreatedAt: now,
      UpdatedAt: now
    };

    const inserted = await supaFetch('LabelTemplates', {
      method: 'POST',
      body: JSON.stringify([record])
    });

    return res.json(mapTemplate(inserted[0] || record));
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lưu mẫu tem', detail: err.message });
  }
});

app.delete(['/api/label-templates/:id', '/label-templates/:id'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`LabelTemplates?Id=eq.${req.params.id}`, { method: 'DELETE' });
    return res.json({ message: 'Đã xóa mẫu tem' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi xóa mẫu tem', detail: err.message });
  }
});

function mapTemplate(t) {
  let elements = [];
  try { elements = typeof t.ElementsJson === 'string' ? JSON.parse(t.ElementsJson) : (t.ElementsJson || []); } catch {}
  let printSettings = {};
  try { printSettings = typeof t.PrintSettingsJson === 'string' ? JSON.parse(t.PrintSettingsJson) : (t.PrintSettingsJson || {}); } catch {}

  return {
    id: t.Id,
    orgId: t.OrgId,
    name: t.Name,
    category: t.Category,
    widthMm: t.WidthMm,
    heightMm: t.HeightMm,
    shape: t.Shape,
    background: t.Background,
    elements,
    elementsJson: t.ElementsJson,
    printSettings,
    printSettingsJson: t.PrintSettingsJson,
    thumbnailUrl: t.ThumbnailUrl,
    isSystem: t.IsSystem,
    isPublished: t.IsPublished,
    createdAt: t.CreatedAt
  };
}

// ----------------------------------------------------
// 4. BARCODES
// ----------------------------------------------------
app.get(['/api/barcodes', '/barcodes'], authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const items = await supaFetch(`BarcodeItems?OrgId=eq.${orgId}&order=CreatedAt.desc`);
    return res.json(items.map(b => ({
      id: b.Id,
      sku: b.Sku,
      name: b.Name,
      barcodeType: b.BarcodeType,
      barcodeValue: b.BarcodeValue,
      createdAt: b.CreatedAt
    })));
  } catch (err) {
    return res.json([]);
  }
});

app.post(['/api/barcodes', '/barcodes'], authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const b = req.body || {};
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      Id: id,
      OrgId: orgId,
      Sku: b.sku || `SKU-${Date.now()}`,
      Name: b.name || 'Sản phẩm mới',
      BarcodeType: b.barcodeType || 'Code128',
      BarcodeValue: b.barcodeValue || b.sku || `${Date.now()}`,
      CreatedAt: now
    };

    await supaFetch('BarcodeItems', {
      method: 'POST',
      body: JSON.stringify([record])
    });

    return res.json(record);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi tạo mã vạch', detail: err.message });
  }
});

// ----------------------------------------------------
// 5. ORGANIZATION & TEAM
// ----------------------------------------------------
app.get(['/api/organization', '/organization'], authMiddleware, async (req, res) => {
  try {
    const orgs = await supaFetch(`Organizations?Id=eq.${req.user.orgId}&limit=1`);
    if (orgs && orgs.length > 0) {
      return res.json({ id: orgs[0].Id, name: orgs[0].Name, slug: orgs[0].Slug, logoUrl: orgs[0].LogoUrl });
    }
    return res.json({ id: req.user.orgId, name: 'Tổ chức', slug: 'org' });
  } catch {
    return res.json({ id: req.user.orgId, name: 'Tổ chức', slug: 'org' });
  }
});

app.get(['/api/organization/users', '/organization/users'], authMiddleware, async (req, res) => {
  try {
    const users = await supaFetch(`Users?OrgId=eq.${req.user.orgId}&order=CreatedAt.desc`);
    return res.json(users.map(u => ({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      role: u.Role === 0 ? 'Owner' : (u.Role === 1 ? 'Admin' : (u.Role === 2 ? 'Editor' : 'Viewer')),
      emailVerified: u.IsEmailVerified,
      createdAt: u.CreatedAt
    })));
  } catch (err) {
    return res.json([]);
  }
});

app.post(['/api/organization/invite', '/organization/invite'], authMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const orgId = req.user.orgId;
    const cleanEmail = email.trim().toLowerCase();

    const hash = bcrypt.hashSync(password || '123456', 10);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const roleNum = role === 'Owner' ? 0 : (role === 'Admin' ? 1 : (role === 'Viewer' ? 3 : 2));

    await supaFetch('Users', {
      method: 'POST',
      body: JSON.stringify([{
        Id: id,
        OrgId: orgId,
        Email: cleanEmail,
        Name: name.trim(),
        PasswordHash: hash,
        Role: roleNum,
        IsSystemAdmin: false,
        IsEmailVerified: true,
        CreatedAt: now
      }])
    });

    return res.json({
      id,
      name: name.trim(),
      email: cleanEmail,
      role: role || 'Editor',
      emailVerified: true,
      createdAt: now
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi thêm thành viên', detail: err.message });
  }
});

app.delete(['/api/organization/users/:id', '/organization/users/:id'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`Users?Id=eq.${req.params.id}`, { method: 'DELETE' });
    return res.json({ message: 'Đã xóa thành viên' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi xóa thành viên', detail: err.message });
  }
});

app.get(['/api/organization/activity', '/organization/activity'], authMiddleware, (req, res) => {
  return res.json([
    { id: '1', userName: req.user.name || 'Admin', action: 'Đăng nhập', detail: 'Đăng nhập hệ thống Vercel', createdAt: new Date().toISOString() }
  ]);
});

// ----------------------------------------------------
// 6. ADMIN SYSTEM
// ----------------------------------------------------
app.get(['/api/admin/stats', '/admin/stats'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await supaFetch('Users?select=Id');
    const templates = await supaFetch('LabelTemplates?select=Id');
    return res.json({
      totalUsers: users.length,
      totalTemplates: templates.length,
      totalBarcodes: 5000,
      totalRevenue: 699000
    });
  } catch (err) {
    return res.json({ totalUsers: 1, totalTemplates: 28, totalBarcodes: 0, totalRevenue: 699000 });
  }
});

app.get(['/api/admin/users', '/admin/users'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await supaFetch('Users?order=CreatedAt.desc');
    const subs = await supaFetch('Subscriptions?select=*');

    const result = users.map(u => {
      const userSub = subs.find(s => s.OrgId === u.OrgId);
      const isAdm = u.IsSystemAdmin || u.Email.toLowerCase() === 'admin@hacode.vn';
      return {
        id: u.Id,
        name: u.Name,
        email: u.Email,
        phone: u.Phone || '—',
        role: u.Role === 0 ? 'Owner' : 'Member',
        plan: isAdm ? 'Business' : (userSub?.Plan ? userSub.Plan.charAt(0).toUpperCase() + userSub.Plan.slice(1) : 'Free'),
        isSystemAdmin: isAdm,
        barcodeCount: 50,
        productCount: 30,
        revenue: isAdm ? 0 : (userSub?.Amount || 0),
        createdAt: u.CreatedAt
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi tải danh sách người dùng', detail: err.message });
  }
});

app.get(['/api/admin/users/:id/details', '/admin/users/:id/details'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await supaFetch(`Users?Id=eq.${req.params.id}&limit=1`);
    if (!users || users.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const u = users[0];
    const isAdm = u.IsSystemAdmin || u.Email.toLowerCase() === 'admin@hacode.vn';

    return res.json({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      phone: u.Phone || '—',
      role: u.Role === 0 ? 'Owner' : 'Member',
      plan: isAdm ? 'Business' : 'Free',
      isSystemAdmin: isAdm,
      createdAt: u.CreatedAt,
      orgName: 'Tổ chức'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi tải chi tiết người dùng' });
  }
});

app.post(['/api/admin/users/:id/reset-password', '/admin/users/:id/reset-password'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const newPwd = req.body.newPassword || '12345678';
    const hash = bcrypt.hashSync(newPwd, 10);
    await supaFetch(`Users?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ PasswordHash: hash })
    });
    return res.json({ message: `Đã đặt lại mật khẩu thành công: ${newPwd}` });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi đặt lại mật khẩu', detail: err.message });
  }
});

app.get(['/api/admin/reports', '/admin/reports'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    return res.json({
      mrr: 699000,
      quarterlyRevenue: 699000,
      yearlyRevenue: 699000,
      plansDistribution: [
        { plan: 'Free', count: 1, percentage: 50 },
        { plan: 'Pro', count: 1, percentage: 50 }
      ],
      monthlyRevenueHistory: [
        { month: 'Tháng 4', revenue: 0 },
        { month: 'Tháng 5', revenue: 0 },
        { month: 'Tháng 6', revenue: 0 },
        { month: 'Tháng 7', revenue: 0 },
        { month: 'Tháng 8', revenue: 0 },
        { month: 'Tháng 9', revenue: 699000 }
      ]
    });
  } catch (err) {
    return res.json({ mrr: 699000, quarterlyRevenue: 699000, yearlyRevenue: 699000 });
  }
});

// ----------------------------------------------------
// 7. FONTS & SUBSCRIPTIONS
// ----------------------------------------------------
app.get(['/api/fonts', '/fonts', '/api/admin/fonts', '/admin/fonts'], async (req, res) => {
  try {
    const fonts = await supaFetch('Fonts?order=SortOrder.asc');
    return res.json(fonts.map(f => ({
      id: f.Id,
      name: f.Name,
      familyCss: f.FamilyCss,
      source: f.Source,
      groupLabel: f.GroupLabel,
      supportsVietnamese: f.SupportsVietnamese
    })));
  } catch (err) {
    return res.json([]);
  }
});

app.get(['/api/subscriptions/plans', '/subscriptions/plans'], async (req, res) => {
  try {
    const plans = await supaFetch('SubscriptionPlans?order=PriceMonthly.asc');
    return res.json(plans);
  } catch (err) {
    return res.json([]);
  }
});

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  return res.json({ status: 'ok', server: 'Vercel Serverless + Supabase', time: new Date().toISOString() });
});

// Export Express app for Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 5043;
  app.listen(PORT, () => {
    console.log(`> Serverless API local test server running on http://localhost:${PORT}`);
  });
}
