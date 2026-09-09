const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'VNLabelSuperSecretKeyForJwtAuthenticationMustBeAtLeast32BytesLong!';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boaroamqjvzcmlrfsfit.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYXJvYW1xanZ6Y21scmZzZml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDQ1OTgsImV4cCI6MjEwNDMyMDU5OH0.pzinNPh-pxWWc2CPsClcPHdWAeydgudZyOye08gezq8';

async function supaFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`Supabase error [${res.status}] ${path}:`, txt);
    throw new Error(txt || `Supabase HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const isAdm = req.user.isSystemAdmin || req.user.role === 'Owner' || req.user.role === 'SystemAdmin' || req.user.email === 'admin@hacode.vn';
  if (!isAdm) return res.status(403).json({ message: 'Forbidden' });
  next();
}

function formatTemplate(t) {
  return {
    id: t.Id,
    name: t.Name,
    category: t.Category,
    widthMm: t.WidthMm,
    heightMm: t.HeightMm,
    shape: t.Shape,
    background: t.Background,
    elementsJson: t.ElementsJson,
    printSettingsJson: t.PrintSettingsJson,
    dataSourceJson: t.DataSourceJson,
    thumbnailUrl: t.ThumbnailUrl,
    description: t.Description,
    tags: t.Tags,
    isPopular: !!t.IsPopular,
    isSystem: !!t.IsSystem,
    isPublished: t.IsPublished !== 0,
    createdAt: t.CreatedAt,
    updatedAt: t.UpdatedAt
  };
}

function formatBarcode(b) {
  return {
    id: b.Id,
    sku: b.Sku,
    name: b.Name,
    barcodeType: b.BarcodeType !== undefined ? String(b.BarcodeType) : '0',
    price: b.Price || 0,
    description: b.Description,
    categoryId: b.CategoryId,
    categoryName: b.Category ? b.Category.Name : null,
    createdAt: b.CreatedAt,
    updatedAt: b.UpdatedAt
  };
}

// -------------------------------------------------------------
// 1. AUTH & PROFILE
// -------------------------------------------------------------
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });

    const users = await supaFetch(`Users?Email=eq.${email.trim().toLowerCase()}&select=*`);
    if (!users || users.length === 0) return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    const user = users[0];

    const match = bcrypt.compareSync(password, user.PasswordHash);
    if (!match) return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });

    let orgName = 'HACODE Organization';
    if (user.OrgId) {
      const orgs = await supaFetch(`Organizations?Id=eq.${user.OrgId}&select=Name`);
      if (orgs && orgs.length > 0) orgName = orgs[0].Name;
    }

    let planKey = user.IsSystemAdmin ? 'Business' : 'Free';
    if (user.OrgId) {
      const subs = await supaFetch(`Subscriptions?OrgId=eq.${user.OrgId}&order=EndDate.desc&limit=1`);
      if (subs && subs.length > 0) {
        const s = subs[0];
        const p = (s.Plan || 'free').toLowerCase();
        if (p === 'business') planKey = 'Business';
        else if (p === 'pro') planKey = 'Pro';
        else if (p === 'basic') planKey = 'Basic';
      }
    }
    if (user.IsSystemAdmin || user.Email === 'admin@hacode.vn') planKey = 'Business';

    const roleName = user.Role === 0 ? 'Owner' : 'Member';
    const payload = {
      sub: user.Id,
      email: user.Email,
      orgId: user.OrgId,
      role: roleName,
      isAdmin: user.IsSystemAdmin ? 'True' : 'False',
      name: user.Name,
      isSystemAdmin: !!user.IsSystemAdmin
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    const refreshToken = crypto.randomUUID();

    res.json({
      accessToken: token,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
        phone: user.Phone,
        role: roleName,
        plan: planKey,
        orgId: user.OrgId,
        orgName: orgName,
        isSystemAdmin: !!user.IsSystemAdmin,
        avatarUrl: user.AvatarUrl || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Đăng nhập thất bại: ' + err.message });
  }
});

app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });

    const existing = await supaFetch(`Users?Email=eq.${email.trim().toLowerCase()}&select=Id`);
    if (existing && existing.length > 0) return res.status(400).json({ message: 'Email đã được sử dụng' });

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    await supaFetch('Organizations', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([{
        Id: orgId,
        Name: company || `Cửa hàng của ${name}`,
        Slug: (company || name).toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + orgId.substring(0, 6),
        CreatedAt: now
      }])
    });

    await supaFetch('Users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([{
        Id: userId,
        OrgId: orgId,
        Email: email.trim().toLowerCase(),
        Name: name.trim(),
        Phone: phone || '',
        PasswordHash: hash,
        Role: 0,
        IsSystemAdmin: false,
        IsEmailVerified: true,
        CreatedAt: now
      }])
    });

    await supaFetch('Subscriptions', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([{
        Id: crypto.randomUUID(),
        OrgId: orgId,
        Plan: 'free',
        PlanName: 'Free',
        BillingCycle: 0,
        Term: 'month',
        TermName: '1 tháng',
        StartDate: now,
        EndDate: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
        Status: 0,
        AutoRenew: true,
        Amount: 0
      }])
    });

    res.json({ message: 'Đăng ký thành công' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Đăng ký thất bại: ' + err.message });
  }
});

app.post(['/api/auth/refresh-token', '/auth/refresh-token'], (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    delete decoded.iat;
    delete decoded.exp;
    const newToken = jwt.sign(decoded, JWT_SECRET, { expiresIn: '30d' });
    res.json({ accessToken: newToken });
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

app.get(['/api/auth/me', '/auth/me'], authMiddleware, async (req, res) => {
  try {
    const users = await supaFetch(`Users?Id=eq.${req.user.sub}&select=*`);
    if (!users || users.length === 0) return res.status(404).json({ message: 'User not found' });
    const u = users[0];
    let orgName = '';
    if (u.OrgId) {
      const orgs = await supaFetch(`Organizations?Id=eq.${u.OrgId}&select=Name`);
      if (orgs && orgs.length > 0) orgName = orgs[0].Name;
    }
    res.json({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      phone: u.Phone,
      role: u.Role === 0 ? 'Owner' : 'Member',
      orgId: u.OrgId,
      orgName: orgName,
      isSystemAdmin: !!u.IsSystemAdmin
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/profile', '/profile'], authMiddleware, async (req, res) => {
  try {
    const users = await supaFetch(`Users?Id=eq.${req.user.sub}&select=*`);
    if (!users || users.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const u = users[0];

    let orgName = '';
    let logoUrl = null;
    if (u.OrgId) {
      const orgs = await supaFetch(`Organizations?Id=eq.${u.OrgId}&select=Name,LogoUrl`);
      if (orgs && orgs.length > 0) {
        orgName = orgs[0].Name;
        logoUrl = orgs[0].LogoUrl;
      }
    }

    let planKey = u.IsSystemAdmin ? 'Business' : 'Free';
    if (u.OrgId) {
      const subs = await supaFetch(`Subscriptions?OrgId=eq.${u.OrgId}&order=EndDate.desc&limit=1`);
      if (subs && subs.length > 0) {
        const p = (subs[0].Plan || 'free').toLowerCase();
        if (p === 'business') planKey = 'Business';
        else if (p === 'pro') planKey = 'Pro';
        else if (p === 'basic') planKey = 'Basic';
      }
    }
    if (u.IsSystemAdmin || u.Email === 'admin@hacode.vn') planKey = 'Business';

    res.json({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      phone: u.Phone || '',
      company: orgName,
      logoUrl: logoUrl,
      role: u.Role === 0 ? 'Owner' : 'Member',
      plan: planKey,
      emailVerified: !!u.IsEmailVerified
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/profile', '/profile'], authMiddleware, async (req, res) => {
  try {
    const { name, phone, company, logoUrl } = req.body;
    const patchUser = {};
    if (name) patchUser.Name = name.trim();
    if (phone !== undefined) patchUser.Phone = phone.trim();

    if (Object.keys(patchUser).length > 0) {
      await supaFetch(`Users?Id=eq.${req.user.sub}`, {
        method: 'PATCH',
        body: JSON.stringify(patchUser)
      });
    }

    if (req.user.orgId && (company || logoUrl !== undefined)) {
      const patchOrg = {};
      if (company) patchOrg.Name = company.trim();
      if (logoUrl !== undefined) patchOrg.LogoUrl = logoUrl;
      await supaFetch(`Organizations?Id=eq.${req.user.orgId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchOrg)
      });
    }

    res.json({ message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/profile/change-password', '/profile/change-password'], authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const users = await supaFetch(`Users?Id=eq.${req.user.sub}&select=PasswordHash`);
    if (!users || users.length === 0) return res.status(404).json({ message: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, users[0].PasswordHash)) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await supaFetch(`Users?Id=eq.${req.user.sub}`, {
      method: 'PATCH',
      body: JSON.stringify({ PasswordHash: newHash })
    });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 2. DASHBOARD
// -------------------------------------------------------------
app.get(['/api/dashboard/overview', '/dashboard/overview'], authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    let barcodeCount = 0;
    let templateCount = 0;

    try {
      const barcodes = await supaFetch(`BarcodeItems?OrgId=eq.${orgId}&select=Id`);
      barcodeCount = barcodes ? barcodes.length : 0;
    } catch (e) {}

    try {
      const templates = await supaFetch(`LabelTemplates?OrgId=eq.${orgId}&select=Id`);
      templateCount = templates ? templates.length : 0;
    } catch (e) {}

    let planKey = req.user.isSystemAdmin ? 'Business' : 'Free';
    let daysRemaining = 36500;
    try {
      const subs = await supaFetch(`Subscriptions?OrgId=eq.${orgId}&order=EndDate.desc&limit=1`);
      if (subs && subs.length > 0) {
        const s = subs[0];
        const p = (s.Plan || 'free').toLowerCase();
        if (p === 'business') planKey = 'Business';
        else if (p === 'pro') planKey = 'Pro';
        else if (p === 'basic') planKey = 'Basic';
        if (s.EndDate) {
          daysRemaining = Math.max(0, Math.ceil((new Date(s.EndDate) - new Date()) / (1000 * 3600 * 24)));
        }
      }
    } catch (e) {}
    if (req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn') {
      planKey = 'Business';
      daysRemaining = 36500;
    }

    let planLimits = { barcodeLimit: 50, productLimit: 30, maxUsers: 1 };
    if (planKey === 'Business') planLimits = { barcodeLimit: 100000, productLimit: 999999, maxUsers: -1 };
    else if (planKey === 'Pro') planLimits = { barcodeLimit: 5000, productLimit: 999999, maxUsers: 10 };

    res.json({
      plan: planKey,
      planName: planKey,
      daysRemaining: daysRemaining,
      barcodeCount: barcodeCount,
      templateCount: templateCount,
      barcodeLimit: planLimits.barcodeLimit,
      productLimit: planLimits.productLimit,
      userCount: 1,
      maxUsers: planLimits.maxUsers,
      recentBarcodes: [],
      recentTemplates: [],
      monthlyUsage: [
        { month: 'T4', count: 0 },
        { month: 'T5', count: 0 },
        { month: 'T6', count: 0 },
        { month: 'T7', count: 0 },
        { month: 'T8', count: 0 },
        { month: 'T9', count: barcodeCount + templateCount }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 3. LABEL TEMPLATES
// -------------------------------------------------------------
app.get(['/api/label-templates/mine', '/label-templates/mine', '/api/labeltemplates/mine', '/labeltemplates/mine'], authMiddleware, async (req, res) => {
  try {
    const isAdm = req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn';
    let path = `LabelTemplates?IsSystem=eq.0&OrgId=eq.${req.user.orgId}&order=CreatedAt.desc&select=*`;
    if (isAdm) {
      path = `LabelTemplates?IsSystem=eq.0&order=CreatedAt.desc&select=*`;
    }
    const templates = await supaFetch(path);
    res.json((templates || []).map(formatTemplate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/label-templates/library', '/label-templates/library', '/api/system-templates', '/system-templates'], async (req, res) => {
  try {
    const { category, q } = req.query;
    let path = 'LabelTemplates?IsSystem=eq.1&IsPublished=eq.1&order=SortOrder.asc,CreatedAt.desc&select=*';
    if (category && category !== 'all') {
      path += `&Category=eq.${encodeURIComponent(category.toLowerCase())}`;
    }
    if (q) {
      path += `&Name=ilike.*${encodeURIComponent(q)}*`;
    }
    const templates = await supaFetch(path);
    res.json((templates || []).map(formatTemplate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/label-templates/categories', '/label-templates/categories'], async (req, res) => {
  try {
    const templates = await supaFetch('LabelTemplates?IsSystem=eq.1&select=Category');
    const cats = Array.from(new Set((templates || []).map(t => t.Category).filter(Boolean)));
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/label-templates', '/label-templates', '/api/labeltemplates', '/labeltemplates'], authMiddleware, async (req, res) => {
  try {
    const isAdm = req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn';
    let path = `LabelTemplates?or=(IsSystem.eq.1,OrgId.eq.${req.user.orgId})&order=CreatedAt.desc&select=*`;
    if (isAdm) path = `LabelTemplates?order=CreatedAt.desc&select=*`;
    const templates = await supaFetch(path);
    res.json((templates || []).map(formatTemplate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/label-templates/:id', '/label-templates/:id', '/api/labeltemplates/:id', '/labeltemplates/:id'], async (req, res) => {
  try {
    const templates = await supaFetch(`LabelTemplates?Id=eq.${req.params.id}&select=*`);
    if (!templates || templates.length === 0) return res.status(404).json({ message: 'Không tìm thấy mẫu tem' });
    res.json(formatTemplate(templates[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/label-templates', '/label-templates', '/api/labeltemplates', '/labeltemplates'], authMiddleware, async (req, res) => {
  try {
    const t = req.body;
    const now = new Date().toISOString();
    const id = t.id && t.id !== '00000000-0000-0000-0000-000000000000' ? t.id : crypto.randomUUID();

    const record = {
      Id: id,
      OrgId: req.user.orgId,
      Name: (t.name || 'Mẫu tem mới').trim(),
      Category: t.category || 'general',
      WidthMm: parseFloat(t.widthMm) || 40,
      HeightMm: parseFloat(t.heightMm) || 30,
      Shape: t.shape || 'rect',
      Background: t.background || '#ffffff',
      ElementsJson: typeof t.elementsJson === 'string' ? t.elementsJson : JSON.stringify(t.elementsJson || []),
      PrintSettingsJson: typeof t.printSettingsJson === 'string' ? t.printSettingsJson : JSON.stringify(t.printSettingsJson || {}),
      DataSourceJson: t.dataSourceJson ? (typeof t.dataSourceJson === 'string' ? t.dataSourceJson : JSON.stringify(t.dataSourceJson)) : null,
      ThumbnailUrl: t.thumbnailUrl || null,
      Description: t.description || null,
      Tags: t.tags || null,
      IsPopular: t.isPopular ? 1 : 0,
      IsSystem: 0,
      IsPublished: 1,
      SortOrder: parseInt(t.sortOrder) || 0,
      CreatedAt: now,
      UpdatedAt: now
    };

    const inserted = await supaFetch('LabelTemplates', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([record])
    });

    res.json(formatTemplate(inserted ? inserted[0] : record));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/label-templates/:id', '/label-templates/:id'], authMiddleware, async (req, res) => {
  try {
    const t = req.body;
    const patch = {
      Name: t.name,
      Category: t.category,
      WidthMm: t.widthMm,
      HeightMm: t.heightMm,
      Shape: t.shape,
      Background: t.background,
      ElementsJson: typeof t.elementsJson === 'string' ? t.elementsJson : JSON.stringify(t.elementsJson),
      PrintSettingsJson: typeof t.printSettingsJson === 'string' ? t.printSettingsJson : JSON.stringify(t.printSettingsJson),
      ThumbnailUrl: t.thumbnailUrl,
      UpdatedAt: new Date().toISOString()
    };
    await supaFetch(`LabelTemplates?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    res.json({ message: 'Cập nhật mẫu tem thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete(['/api/label-templates/:id', '/label-templates/:id'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`LabelTemplates?Id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ message: 'Đã xóa mẫu tem thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 4. ADMIN TEMPLATES
// -------------------------------------------------------------
app.get(['/api/admin/templates', '/admin/templates'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const templates = await supaFetch('LabelTemplates?IsSystem=eq.1&order=SortOrder.asc,Name.asc&select=*');
    res.json((templates || []).map(formatTemplate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/admin/templates', '/admin/templates'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const t = req.body;
    const now = new Date().toISOString();
    const id = t.id && t.id !== '00000000-0000-0000-0000-000000000000' ? t.id : crypto.randomUUID();

    const record = {
      Id: id,
      OrgId: null,
      Name: (t.name || 'Mẫu tem hệ thống').trim(),
      Category: t.category || 'general',
      WidthMm: parseFloat(t.widthMm) || 40,
      HeightMm: parseFloat(t.heightMm) || 30,
      Shape: t.shape || 'rect',
      Background: t.background || '#ffffff',
      ElementsJson: typeof t.elementsJson === 'string' ? t.elementsJson : JSON.stringify(t.elementsJson || []),
      PrintSettingsJson: typeof t.printSettingsJson === 'string' ? t.printSettingsJson : JSON.stringify(t.printSettingsJson || {}),
      ThumbnailUrl: t.thumbnailUrl || null,
      Description: t.description || null,
      Tags: t.tags || null,
      IsPopular: t.isPopular ? 1 : 0,
      IsSystem: 1,
      IsPublished: t.isActive !== undefined ? (t.isActive ? 1 : 0) : 1,
      SortOrder: parseInt(t.sortOrder) || 0,
      CreatedAt: now,
      UpdatedAt: now
    };

    const inserted = await supaFetch('LabelTemplates', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([record])
    });

    res.json(formatTemplate(inserted ? inserted[0] : record));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/admin/templates/:id/published', '/admin/templates/:id/published'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    await supaFetch(`LabelTemplates?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ IsPublished: isActive ? 1 : 0, UpdatedAt: new Date().toISOString() })
    });
    res.json({ message: 'Cập nhật trạng thái xuất bản thành công', isPublished: !!isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete(['/api/admin/templates/:id', '/admin/templates/:id'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    await supaFetch(`LabelTemplates?Id=eq.${req.params.id}&IsSystem=eq.1`, { method: 'DELETE' });
    res.json({ message: 'Đã xóa mẫu tem hệ thống thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/templates/categories', '/admin/templates/categories'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const templates = await supaFetch('LabelTemplates?IsSystem=eq.1&select=Category');
    const cats = Array.from(new Set((templates || []).map(t => t.Category).filter(Boolean)));
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 5. CATEGORIES & BARCODES
// -------------------------------------------------------------
app.get(['/api/categories', '/categories'], authMiddleware, async (req, res) => {
  try {
    const isAdm = req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn';
    let path = `Categories?OrgId=eq.${req.user.orgId}&order=Name.asc&select=*`;
    if (isAdm) path = `Categories?order=Name.asc&select=*`;

    const cats = await supaFetch(path);
    const result = (cats || []).map(c => ({
      id: c.Id,
      name: c.Name,
      productCount: 0,
      createdAt: c.CreatedAt
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/categories', '/categories'], authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên danh mục không được để trống' });

    const newCat = {
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Name: name.trim(),
      CreatedAt: new Date().toISOString()
    };
    await supaFetch('Categories', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([newCat])
    });
    res.json({ id: newCat.Id, name: newCat.Name, productCount: 0, createdAt: newCat.CreatedAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/categories/:id', '/categories/:id'], authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    await supaFetch(`Categories?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ Name: name.trim() })
    });
    res.json({ id: req.params.id, name: name.trim() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete(['/api/categories/:id', '/categories/:id'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`Categories?Id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ message: 'Đã xóa danh mục thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/barcodes', '/barcodes'], authMiddleware, async (req, res) => {
  try {
    const { q, categoryId, page = 1, pageSize = 20 } = req.query;
    const isAdm = req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn';
    let path = `BarcodeItems?OrgId=eq.${req.user.orgId}&order=CreatedAt.desc&select=*,Category:Categories(Name)`;
    if (isAdm) {
      path = `BarcodeItems?order=CreatedAt.desc&select=*,Category:Categories(Name)`;
    }
    if (categoryId) path += `&CategoryId=eq.${categoryId}`;
    if (q) path += `&or=(Sku.ilike.*${encodeURIComponent(q)}*,Name.ilike.*${encodeURIComponent(q)}*)`;

    const items = await supaFetch(path);
    const formatted = (items || []).map(formatBarcode);
    const totalCount = formatted.length;
    const p = parseInt(page) || 1;
    const ps = parseInt(pageSize) || 20;
    const start = (p - 1) * ps;
    const paged = formatted.slice(start, start + ps);

    res.json({
      items: paged,
      totalCount: totalCount,
      page: p,
      pageSize: ps,
      totalPages: Math.ceil(totalCount / ps) || 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/barcodes/:id', '/barcodes/:id'], authMiddleware, async (req, res) => {
  try {
    const items = await supaFetch(`BarcodeItems?Id=eq.${req.params.id}&select=*,Category:Categories(Name)`);
    if (!items || items.length === 0) return res.status(404).json({ message: 'Không tìm thấy mã vạch' });
    res.json(formatBarcode(items[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/barcodes', '/barcodes'], authMiddleware, async (req, res) => {
  try {
    const { sku, name, barcodeType, price, description, categoryId } = req.body;
    if (!sku || !name) return res.status(400).json({ message: 'Mã SKU và Tên sản phẩm không được để trống' });

    const newItem = {
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Sku: sku.trim(),
      Name: name.trim(),
      BarcodeType: parseInt(barcodeType) || 0,
      Price: parseFloat(price) || 0,
      Description: description || null,
      CategoryId: categoryId || null,
      CreatedAt: new Date().toISOString()
    };

    await supaFetch('BarcodeItems', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([newItem])
    });

    res.json(formatBarcode(newItem));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/barcodes/:id', '/barcodes/:id'], authMiddleware, async (req, res) => {
  try {
    const { sku, name, barcodeType, price, description, categoryId } = req.body;
    const patch = {
      Sku: sku ? sku.trim() : undefined,
      Name: name ? name.trim() : undefined,
      BarcodeType: barcodeType !== undefined ? parseInt(barcodeType) : undefined,
      Price: price !== undefined ? parseFloat(price) : undefined,
      Description: description,
      CategoryId: categoryId,
      UpdatedAt: new Date().toISOString()
    };
    await supaFetch(`BarcodeItems?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    res.json({ message: 'Cập nhật mã vạch thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete(['/api/barcodes/:id', '/barcodes/:id'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`BarcodeItems?Id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ message: 'Đã xóa mã vạch thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/barcodes/:id/render', '/barcodes/:id/render'], async (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="#fff"/><text x="100" y="35" font-family="Arial" font-size="14" text-anchor="middle">BARCODE PREVIEW</text></svg>`);
});

app.post(['/api/barcodes/bulk', '/barcodes/bulk'], authMiddleware, async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || rows.length === 0) return res.status(400).json({ message: 'Danh sách sản phẩm trống' });
    const now = new Date().toISOString();
    const newItems = rows.map(r => ({
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Sku: (r.sku || '').trim(),
      Name: (r.name || '').trim(),
      BarcodeType: 0,
      Price: parseFloat(r.price) || 0,
      Description: r.description || null,
      CategoryId: null,
      CreatedAt: now
    })).filter(i => i.Sku && i.Name);

    await supaFetch('BarcodeItems', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(newItems)
    });

    res.json({ successCount: newItems.length, failedCount: rows.length - newItems.length, errors: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/barcodes/bulk-import', '/barcodes/bulk-import'], authMiddleware, async (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) return res.status(400).json({ message: 'Nội dung CSV không được để trống' });
    const lines = csvContent.split('\n');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2 && parts[0].trim()) {
        rows.push({
          sku: parts[0].trim(),
          name: parts[1].trim(),
          price: parseFloat(parts[2]) || 0
        });
      }
    }
    const now = new Date().toISOString();
    const newItems = rows.map(r => ({
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Sku: r.sku,
      Name: r.name,
      BarcodeType: 0,
      Price: r.price,
      CreatedAt: now
    }));

    if (newItems.length > 0) {
      await supaFetch('BarcodeItems', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(newItems)
      });
    }

    res.json({ successCount: newItems.length, failedCount: 0, errors: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/barcodes/export', '/barcodes/export'], authMiddleware, async (req, res) => {
  try {
    const items = await supaFetch(`BarcodeItems?OrgId=eq.${req.user.orgId}&order=Sku.asc&select=*`);
    let csv = 'SKU,Name,Price,BarcodeType,CreatedAt\n';
    for (const b of (items || [])) {
      csv += `"${b.Sku}","${b.Name}",${b.Price || 0},"${b.BarcodeType}","${b.CreatedAt}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=barcodes_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 6. SUBSCRIPTIONS
// -------------------------------------------------------------
app.get(['/api/subscriptions/plans', '/subscriptions/plans'], async (req, res) => {
  try {
    const plans = await supaFetch('SubscriptionPlans?select=*');
    const formatted = (plans || []).map(p => ({
      key: p.Key,
      name: p.Name,
      description: p.Description,
      popular: !!p.Popular,
      priceMonthly: parseFloat(p.PriceMonthly) || 0,
      priceYearly: parseFloat(p.PriceYearly) || 0,
      barcodeLimit: p.BarcodeLimit,
      productLimit: p.ProductLimit,
      csvRows: p.CsvRows,
      maxUsers: p.MaxUsers,
      types: typeof p.SupportedTypesJson === 'string' ? JSON.parse(p.SupportedTypesJson) : (p.SupportedTypesJson || []),
      features: typeof p.FeaturesJson === 'string' ? JSON.parse(p.FeaturesJson) : (p.FeaturesJson || []),
      featureFlags: typeof p.FeatureFlagsJson === 'string' ? JSON.parse(p.FeatureFlagsJson) : (p.FeatureFlagsJson || {})
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/subscriptions/terms', '/subscriptions/terms'], (req, res) => {
  res.json([
    { key: 'month', name: '1 tháng', months: 1, prices: { pro: 59000, business: 166000 } },
    { key: 'year', name: '1 năm', months: 12, prices: { pro: 699000, business: 1990000 } },
    { key: '2year', name: '2 năm', months: 24, prices: { pro: 1398000, business: 3980000 } }
  ]);
});

app.get(['/api/subscriptions/contact', '/subscriptions/contact'], (req, res) => {
  res.json({ hotline: '0942 85 82 85', email: 'support@hacode.vn', website: 'https://hacode.vn' });
});

app.get(['/api/subscriptions/current', '/subscriptions/current'], authMiddleware, async (req, res) => {
  try {
    if (req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn') {
      return res.json({
        id: '00000000-0000-0000-0000-000000000000',
        plan: 'business',
        planName: 'Business',
        billingCycle: 'Yearly',
        term: 'lifetime',
        termName: 'Trọn đời',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 36500 * 24 * 3600 * 1000).toISOString(),
        status: 'Active',
        autoRenew: true,
        amount: 0,
        daysRemaining: 36500
      });
    }

    const subs = await supaFetch(`Subscriptions?OrgId=eq.${req.user.orgId}&order=EndDate.desc&limit=1`);
    if (!subs || subs.length === 0) {
      return res.json({
        id: '00000000-0000-0000-0000-000000000000',
        plan: 'free',
        planName: 'Free',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
        status: 'Active',
        daysRemaining: 3650
      });
    }

    const s = subs[0];
    const daysRemaining = Math.max(0, Math.ceil((new Date(s.EndDate) - new Date()) / (1000 * 3600 * 24)));
    res.json({
      id: s.Id,
      plan: s.Plan || 'free',
      planName: s.PlanName || (s.Plan ? s.Plan.toUpperCase() : 'Free'),
      billingCycle: s.BillingCycle === 1 ? 'Yearly' : 'Monthly',
      term: s.Term,
      termName: s.TermName,
      startDate: s.StartDate,
      endDate: s.EndDate,
      status: s.Status === 0 ? 'Active' : 'Expired',
      autoRenew: !!s.AutoRenew,
      amount: s.Amount || 0,
      daysRemaining: daysRemaining
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/subscriptions/requests', '/subscriptions/requests'], authMiddleware, async (req, res) => {
  try {
    const { plan, cycle, contactName, contactPhone, note } = req.body;
    const record = {
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Plan: plan,
      Cycle: cycle,
      ContactName: contactName || req.user.name,
      ContactPhone: contactPhone || '',
      Note: note || '',
      Status: 0,
      CreatedAt: new Date().toISOString()
    };
    await supaFetch('SubscriptionRequests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([record])
    });
    res.json({ id: record.Id, plan: record.Plan, status: 'Pending' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/subscriptions/trial-request', '/subscriptions/trial-request'], authMiddleware, async (req, res) => {
  try {
    const record = {
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Plan: 'pro',
      Cycle: 'trial',
      ContactName: req.user.name,
      ContactPhone: '',
      Note: req.body?.note || 'Khách hàng gửi yêu cầu kích hoạt dùng thử 30 ngày gói Pro',
      Status: 0,
      CreatedAt: new Date().toISOString()
    };
    await supaFetch('SubscriptionRequests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([record])
    });
    res.json({ message: 'Yêu cầu trải nghiệm 30 ngày dùng thử gói Pro đã được gửi thành công!', id: record.Id, pending: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/subscriptions/requests', '/subscriptions/requests'], authMiddleware, async (req, res) => {
  try {
    const requests = await supaFetch(`SubscriptionRequests?OrgId=eq.${req.user.orgId}&order=CreatedAt.desc&select=*`);
    res.json((requests || []).map(r => ({
      id: r.Id,
      orgId: r.OrgId,
      plan: r.Plan,
      cycle: r.Cycle,
      contactName: r.ContactName,
      contactPhone: r.ContactPhone,
      status: r.Status === 0 ? 'Pending' : (r.Status === 1 ? 'Approved' : 'Rejected'),
      note: r.Note,
      adminNote: r.AdminNote,
      createdAt: r.CreatedAt,
      processedAt: r.ProcessedAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/subscriptions/requests/:id/cancel', '/subscriptions/requests/:id/cancel'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`SubscriptionRequests?Id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ message: 'Đã hủy yêu cầu thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/subscriptions/invoices', '/subscriptions/invoices'], authMiddleware, async (req, res) => {
  try {
    const invoices = await supaFetch(`Invoices?OrgId=eq.${req.user.orgId}&order=PaidAt.desc&select=*`);
    res.json((invoices || []).map(i => ({
      id: i.Id,
      invoiceNumber: i.InvoiceNumber,
      amount: i.Amount,
      status: i.Status,
      paidAt: i.PaidAt,
      pdfUrl: i.PdfUrl
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 7. API KEYS
// -------------------------------------------------------------
app.get(['/api/apikeys', '/apikeys'], authMiddleware, async (req, res) => {
  try {
    const isAdm = req.user.isSystemAdmin || req.user.email === 'admin@hacode.vn';
    let path = `ApiKeys?OrgId=eq.${req.user.orgId}&order=CreatedAt.desc&select=*`;
    if (isAdm) path = `ApiKeys?order=CreatedAt.desc&select=*`;
    const keys = await supaFetch(path);
    res.json((keys || []).map(k => ({
      id: k.Id,
      name: k.Name,
      keyPrefix: k.KeyPrefix,
      isActive: !!k.IsActive,
      createdAt: k.CreatedAt,
      expiresAt: k.ExpiresAt,
      lastUsedAt: k.LastUsedAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/apikeys', '/apikeys'], authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên API Key không được để trống' });
    const rand = crypto.randomBytes(16).toString('hex');
    const fullKey = `vnl_${rand}`;
    const prefix = fullKey.substring(0, 8);
    const hash = bcrypt.hashSync(fullKey, 10);
    const now = new Date().toISOString();

    const record = {
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Name: name.trim(),
      KeyPrefix: prefix,
      KeyHash: hash,
      IsActive: true,
      CreatedAt: now
    };

    await supaFetch('ApiKeys', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([record])
    });

    res.json({
      id: record.Id,
      name: record.Name,
      keyPrefix: prefix,
      fullApiKey: fullKey,
      plainKey: fullKey,
      createdAt: now
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete(['/api/apikeys/:id', '/apikeys/:id'], authMiddleware, async (req, res) => {
  try {
    await supaFetch(`ApiKeys?Id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ message: 'Xóa API Key thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 8. ORGANIZATION & MEMBERS
// -------------------------------------------------------------
app.get(['/api/organization', '/organization'], authMiddleware, async (req, res) => {
  try {
    const orgs = await supaFetch(`Organizations?Id=eq.${req.user.orgId}&select=*`);
    if (!orgs || orgs.length === 0) return res.status(404).json({ message: 'Không tìm thấy tổ chức' });
    const o = orgs[0];
    res.json({ id: o.Id, name: o.Name, slug: o.Slug, logoUrl: o.LogoUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/organization/users', '/organization/users'], authMiddleware, async (req, res) => {
  try {
    const users = await supaFetch(`Users?OrgId=eq.${req.user.orgId}&order=CreatedAt.desc&select=*`);
    res.json((users || []).map(u => ({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      role: u.Role === 0 ? 'Owner' : 'Member',
      emailVerified: !!u.IsEmailVerified,
      createdAt: u.CreatedAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/organization/invite', '/organization/invite'], authMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email và mật khẩu không được để trống' });

    const existing = await supaFetch(`Users?Email=eq.${email.trim().toLowerCase()}&select=Id`);
    if (existing && existing.length > 0) return res.status(400).json({ message: 'Email đã tồn tại' });

    const newUser = {
      Id: crypto.randomUUID(),
      OrgId: req.user.orgId,
      Email: email.trim().toLowerCase(),
      Name: (name || email.split('@')[0]).trim(),
      PasswordHash: bcrypt.hashSync(password, 10),
      Role: role === 'Admin' || role === 'Owner' ? 0 : 1,
      IsSystemAdmin: false,
      IsEmailVerified: true,
      CreatedAt: new Date().toISOString()
    };

    await supaFetch('Users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([newUser])
    });

    res.json({
      id: newUser.Id,
      name: newUser.Name,
      email: newUser.Email,
      role: newUser.Role === 0 ? 'Owner' : 'Member',
      emailVerified: true,
      createdAt: newUser.CreatedAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/organization/users/:id/role', '/organization/users/:id/role'], authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const roleNum = role === 'Owner' || role === 'Admin' ? 0 : 1;
    await supaFetch(`Users?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ Role: roleNum })
    });
    res.json({ message: 'Cập nhật vai trò thành công', role: role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete(['/api/organization/users/:id', '/organization/users/:id'], authMiddleware, async (req, res) => {
  try {
    if (req.params.id === req.user.sub) return res.status(400).json({ message: 'Không thể tự xóa tài khoản của mình' });
    await supaFetch(`Users?Id=eq.${req.params.id}`, { method: 'DELETE' });
    res.json({ message: 'Xóa thành viên thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/organization/activity', '/organization/activity'], authMiddleware, (req, res) => {
  res.json([]);
});

// -------------------------------------------------------------
// 9. ADMIN SYSTEM
// -------------------------------------------------------------
app.get(['/api/admin/stats', '/admin/stats'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [users, orgs, barcodes, subs, reqs] = await Promise.all([
      supaFetch('Users?select=Id'),
      supaFetch('Organizations?select=Id'),
      supaFetch('BarcodeItems?select=Id'),
      supaFetch('Subscriptions?select=*'),
      supaFetch('SubscriptionRequests?Status=eq.0&select=Id')
    ]);

    let monthlyRevenue = 0;
    for (const s of (subs || [])) {
      if (s.Plan && s.Plan !== 'free') {
        monthlyRevenue += (s.Amount || 0);
      }
    }

    res.json({
      totalUsers: users ? users.length : 0,
      totalOrganizations: orgs ? orgs.length : 0,
      totalBarcodes: barcodes ? barcodes.length : 0,
      activeSubscriptions: subs ? subs.filter(s => s.Plan !== 'free').length : 0,
      pendingRequests: reqs ? reqs.length : 0,
      monthlyRevenue: monthlyRevenue,
      mrr: monthlyRevenue,
      quarterlyRevenue: monthlyRevenue * 3,
      yearlyRevenue: monthlyRevenue * 12
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/subscription-requests', '/admin/subscription-requests'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const requests = await supaFetch('SubscriptionRequests?order=CreatedAt.desc&select=*,Organization:Organizations(Name)');
    res.json((requests || []).map(r => ({
      id: r.Id,
      orgId: r.OrgId,
      orgName: r.Organization ? r.Organization.Name : 'Tổ chức',
      plan: r.Plan,
      cycle: r.Cycle,
      contactName: r.ContactName,
      contactPhone: r.ContactPhone,
      status: r.Status === 0 ? 'Pending' : (r.Status === 1 ? 'Approved' : 'Rejected'),
      note: r.Note,
      adminNote: r.AdminNote,
      createdAt: r.CreatedAt,
      processedAt: r.ProcessedAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/admin/subscription-requests/:id/approve', '/admin/subscription-requests/:id/approve'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const reqs = await supaFetch(`SubscriptionRequests?Id=eq.${req.params.id}&select=*`);
    if (!reqs || reqs.length === 0) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    const r = reqs[0];

    const cycle = req.body?.cycle || r.Cycle;
    const isTrial = cycle === 'trial';
    const months = cycle === 'year' ? 12 : (cycle === '2year' ? 24 : 1);
    const termName = isTrial ? '30 ngày dùng thử Pro' : (cycle === 'year' ? '1 năm' : '1 tháng');
    const endDate = isTrial
      ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      : new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString();

    await supaFetch('Subscriptions', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{
        Id: crypto.randomUUID(),
        OrgId: r.OrgId,
        Plan: r.Plan,
        PlanName: r.Plan.toUpperCase(),
        BillingCycle: cycle === 'year' ? 1 : 0,
        Term: cycle,
        TermName: termName,
        StartDate: new Date().toISOString(),
        EndDate: endDate,
        Status: 0,
        Amount: isTrial ? 0 : 59000 * months
      }])
    });

    await supaFetch(`SubscriptionRequests?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        Status: 1,
        AdminNote: req.body?.note || 'Đã duyệt',
        ProcessedAt: new Date().toISOString()
      })
    });

    res.json({ message: 'Đã phê duyệt và kích hoạt gói cước thành công!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/admin/subscription-requests/:id/reject', '/admin/subscription-requests/:id/reject'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    await supaFetch(`SubscriptionRequests?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        Status: 2,
        AdminNote: req.body?.note || 'Từ chối',
        ProcessedAt: new Date().toISOString()
      })
    });
    res.json({ message: 'Đã từ chối yêu cầu' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/users', '/admin/users'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let path = 'Users?order=CreatedAt.desc&select=*,Organization:Organizations(Name)';
    if (search) {
      path += `&or=(Name.ilike.*${encodeURIComponent(search)}*,Email.ilike.*${encodeURIComponent(search)}*)`;
    }
    const users = await supaFetch(path);
    const subs = await supaFetch('Subscriptions?select=*');

    const subMap = {};
    for (const s of (subs || [])) {
      if (!subMap[s.OrgId] || new Date(s.StartDate) > new Date(subMap[s.OrgId].StartDate)) {
        subMap[s.OrgId] = s;
      }
    }

    const result = (users || []).map(u => {
      const sub = subMap[u.OrgId];
      let pKey = u.IsSystemAdmin ? 'Business' : (sub?.Plan ? sub.Plan.toLowerCase() : 'Free');
      if (pKey === 'business') pKey = 'Business';
      else if (pKey === 'pro') pKey = 'Pro';
      else if (pKey === 'basic') pKey = 'Basic';
      else pKey = 'Free';

      const pName = u.IsSystemAdmin ? 'Business' : (sub?.PlanName || pKey);
      const isAdm = u.IsSystemAdmin || u.Email === 'admin@hacode.vn';
      const rev = isAdm || pKey === 'Free' ? 0 : (sub?.Amount || 0);

      return {
        id: u.Id,
        name: u.Name,
        email: u.Email,
        phone: u.Phone,
        role: u.Role === 0 ? 'Owner' : 'Member',
        orgId: u.OrgId,
        orgName: u.Organization ? u.Organization.Name : 'Tổ chức',
        plan: pKey,
        planName: pName,
        planEndDate: u.IsSystemAdmin ? null : sub?.EndDate,
        isSystemAdmin: !!u.IsSystemAdmin,
        createdAt: u.CreatedAt,
        revenue: rev,
        revenueText: `${rev.toLocaleString('vi-VN')} đ`
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(['/api/admin/users/:id/plan', '/admin/users/:id/plan'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { plan, cycle } = req.body;
    const users = await supaFetch(`Users?Id=eq.${req.params.id}&select=OrgId`);
    if (!users || users.length === 0) return res.status(404).json({ message: 'User not found' });
    const orgId = users[0].OrgId;

    const isTrial = cycle === 'trial';
    const months = cycle === 'year' ? 12 : 1;
    const endDate = isTrial
      ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      : (plan === 'free' ? new Date(Date.now() + 36500 * 24 * 3600 * 1000).toISOString() : new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString());

    await supaFetch('Subscriptions', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{
        Id: crypto.randomUUID(),
        OrgId: orgId,
        Plan: (plan || 'pro').toLowerCase(),
        PlanName: plan ? plan.toUpperCase() : 'PRO',
        BillingCycle: cycle === 'year' ? 1 : 0,
        Term: cycle || 'month',
        TermName: isTrial ? '30 ngày dùng thử Pro' : (cycle === 'year' ? '1 năm' : '1 tháng'),
        StartDate: new Date().toISOString(),
        EndDate: endDate,
        Status: 0,
        Amount: 0
      }])
    });

    res.json({ message: `Đã cập nhật gói cước thành ${plan} thành công!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/users/:id/details', '/admin/users/:id/details'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await supaFetch(`Users?Id=eq.${req.params.id}&select=*,Organization:Organizations(Name)`);
    if (!users || users.length === 0) return res.status(404).json({ message: 'User not found' });
    const u = users[0];

    const subs = await supaFetch(`Subscriptions?OrgId=eq.${u.OrgId}&order=EndDate.desc&limit=1`);
    const sub = subs && subs.length > 0 ? subs[0] : null;

    res.json({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      phone: u.Phone,
      company: u.Organization ? u.Organization.Name : 'Tổ chức',
      orgId: u.OrgId,
      role: u.Role === 0 ? 'Owner' : 'Member',
      isSystemAdmin: !!u.IsSystemAdmin,
      isEmailVerified: !!u.IsEmailVerified,
      createdAt: u.CreatedAt,
      plan: u.IsSystemAdmin ? 'Business' : (sub?.Plan || 'Free'),
      planName: u.IsSystemAdmin ? 'Business' : (sub?.PlanName || 'Free'),
      planStartDate: sub?.StartDate || u.CreatedAt,
      planEndDate: u.IsSystemAdmin ? null : sub?.EndDate,
      termName: sub?.TermName || (u.IsSystemAdmin ? 'Vô thời hạn' : 'Mặc định'),
      revenue: sub?.Amount || 0,
      revenueText: `${(sub?.Amount || 0).toLocaleString('vi-VN')} đ`,
      barcodeCount: 0,
      templateCount: 0,
      memberCount: 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(['/api/admin/users/:id/reset-password', '/admin/users/:id/reset-password'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const newPass = (req.body?.newPassword || '12345678').trim();
    const hash = bcrypt.hashSync(newPass, 10);
    await supaFetch(`Users?Id=eq.${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ PasswordHash: hash })
    });
    res.json({ message: 'Đã đặt lại mật khẩu thành công!', newPassword: newPass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/expiring', '/admin/expiring'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const threshold = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const subs = await supaFetch(`Subscriptions?Status=eq.0&EndDate=lte.${threshold}&select=*,Organization:Organizations(Name)`);
    const result = (subs || []).map(s => ({
      id: s.Id,
      orgName: s.Organization ? s.Organization.Name : '',
      planName: s.PlanName,
      endDate: s.EndDate
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/reports', '/admin/reports'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await supaFetch('Users?select=OrgId,IsSystemAdmin');
    const subs = await supaFetch('Subscriptions?select=*');

    const usersByPlan = { Free: 0, Pro: 0, Business: 0 };
    const subMap = {};
    for (const s of (subs || [])) {
      subMap[s.OrgId] = s;
    }

    for (const u of (users || [])) {
      if (u.IsSystemAdmin) {
        usersByPlan.Business++;
        continue;
      }
      const s = subMap[u.OrgId];
      const p = (s?.Plan || 'free').toLowerCase();
      if (p === 'business') usersByPlan.Business++;
      else if (p === 'pro') usersByPlan.Pro++;
      else usersByPlan.Free++;
    }

    const revenueByPlan = { Free: 0, Pro: 699000, Business: 0 };

    res.json({
      revenueByPlan,
      usersByPlan,
      systemUsage: [
        { month: 'T4/2026', count: 0 },
        { month: 'T5/2026', count: 0 },
        { month: 'T6/2026', count: 0 },
        { month: 'T7/2026', count: 0 },
        { month: 'T8/2026', count: 0 },
        { month: 'T9/2026', count: 20 }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(['/api/admin/support', '/admin/support'], authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ found: false });
    const users = await supaFetch(`Users?Email=ilike.*${encodeURIComponent(email.trim())}*&select=*,Organization:Organizations(Name)`);
    if (!users || users.length === 0) return res.json({ found: false });
    const u = users[0];
    res.json({
      found: true,
      id: u.Id,
      name: u.Name,
      email: u.Email,
      phone: u.Phone,
      company: u.Organization ? u.Organization.Name : 'Tổ chức',
      role: u.Role === 0 ? 'Owner' : 'Member',
      plan: u.IsSystemAdmin ? 'Business' : 'Free',
      emailVerified: !!u.IsEmailVerified,
      createdAt: u.CreatedAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 10. FONTS
// -------------------------------------------------------------
app.get(['/api/fonts', '/fonts', '/api/admin/fonts', '/admin/fonts'], async (req, res) => {
  try {
    const fonts = await supaFetch('Fonts?order=SortOrder.asc,Name.asc&select=*');
    const result = (fonts || []).map(f => ({
      id: f.Id,
      name: f.Name,
      familyCss: f.FamilyCss,
      source: f.Source,
      fileUrl: f.FileUrl,
      fileFormat: f.FileFormat,
      fileSizeBytes: f.FileSizeBytes,
      googleFamily: f.GoogleFamily,
      weights: f.Weights,
      groupLabel: f.GroupLabel,
      supportsVietnamese: !!f.SupportsVietnamese,
      sample: f.Sample,
      note: f.Note,
      isActive: !!f.IsActive,
      sortOrder: f.SortOrder || 0
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 11. HEALTH CHECK
// -------------------------------------------------------------
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', server: 'Vercel Serverless', time: new Date().toISOString() });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
