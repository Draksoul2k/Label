// Script kiem tra truc tiep tren VPS
const SUPABASE_URL = 'https://boaroamqjvzcmlrfsfit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvYXJvYW1xanZ6Y21scmZzZml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDQ1OTgsImV4cCI6MjEwNDMyMDU5OH0.pzinNPh-pxWWc2CPsClcPHdWAeydgudZyOye08gezq8';

async function diagnose() {
  console.log('=== BAT DAU KIEM TRA HE THONG TREN VPS ===\n');

  // 1. Kiem tra mang tu VPS toi Supabase Cloud
  console.log('1. Kiem tra ket noi Database Supabase tu VPS...');
  try {
    const t1 = Date.now();
    const res = await fetch(${SUPABASE_URL}/rest/v1/Users?select=Email&limit=1, {
      headers: { apikey: SUPABASE_KEY, Authorization: Bearer  }
    });
    const time = Date.now() - t1;
    console.log(   [OK] Ket noi Supabase thanh cong trong ms! Status: );
  } catch (err) {
    console.error('   [LOI] Khong the ket noi toi Supabase tu VPS:', err.message);
  }

  // 2. Kiem tra Backend Node.js truc tiep qua cong 5000
  console.log('\n2. Kiem tra Backend API truc tiep (127.0.0.1:5000)...');
  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hacode.vn', password: 'Admin@123' })
    });
    console.log(   [OK] Backend 5000 phan hoi Status: );
    const text = await res.text();
    console.log(   Ket qua Backend tra ve: ...);
  } catch (err) {
    console.error('   [LOI] Khong the goi Backend 127.0.0.1:5000:', err.message);
  }

  // 3. Kiem tra qua Web Server Caddy (cong 80)
  console.log('\n3. Kiem tra qua Web Server Caddy (localhost:80)...');
  try {
    const res = await fetch('http://127.0.0.1/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hacode.vn', password: 'Admin@123' })
    });
    console.log(   [OK] Caddy phan hoi Status: );
    const text = await res.text();
    console.log(   Ket qua Caddy tra ve: ...);
  } catch (err) {
    console.error('   [LOI] Khong the goi qua Caddy cong 80:', err.message);
  }

  console.log('\n=== HOAN TAT KIEM TRA ===');
}

diagnose();
