/**
 * Diagnostic script to check Supabase connectivity
 * Run with: node scripts/check-supabase.js
 */

const https = require('https');
const dns = require('dns').promises;

const SUPABASE_URL = 'spetbmkfktmkrqjmotec.supabase.co';
const FULL_URL = `https://${SUPABASE_URL}`;

console.log('🔍 Supabase Connection Diagnostic Tool\n');
console.log('━'.repeat(50));

async function checkDNS() {
  console.log('\n1️⃣  Checking DNS Resolution...');
  try {
    const addresses = await dns.resolve4(SUPABASE_URL);
    console.log('✅ DNS Resolution: SUCCESS');
    console.log(`   IP Address: ${addresses[0]}`);
    return true;
  } catch (error) {
    console.log('❌ DNS Resolution: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkHTTPS() {
  console.log('\n2️⃣  Checking HTTPS Connection...');
  return new Promise((resolve) => {
    const req = https.get(`${FULL_URL}/rest/v1/`, { timeout: 15000 }, (res) => {
      console.log('✅ HTTPS Connection: SUCCESS');
      console.log(`   Status Code: ${res.statusCode}`);
      console.log(`   Server: ${res.headers.server || 'Unknown'}`);
      resolve(true);
      res.resume(); // Consume response
    });

    req.on('error', (error) => {
      console.log('❌ HTTPS Connection: FAILED');
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ HTTPS Connection: TIMEOUT');
      console.log('   Request timed out after 15 seconds');
      req.destroy();
      resolve(false);
    });
  });
}

async function checkAuth() {
  console.log('\n3️⃣  Checking Supabase Auth API...');
  return new Promise((resolve) => {
    const req = https.get(`${FULL_URL}/auth/v1/health`, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Auth API: HEALTHY');
          console.log(`   Response: ${data}`);
          resolve(true);
        } else {
          console.log(`⚠️  Auth API: Responded with ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Auth API: FAILED');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Auth API: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

async function runDiagnostics() {
  console.log(`Target: ${FULL_URL}\n`);

  const dnsOk = await checkDNS();
  if (!dnsOk) {
    console.log('\n━'.repeat(50));
    console.log('\n🚨 DNS resolution failed. Possible causes:');
    console.log('   • No internet connection');
    console.log('   • DNS server issues');
    console.log('   • Firewall blocking DNS queries\n');
    return;
  }

  const httpsOk = await checkHTTPS();
  if (!httpsOk) {
    console.log('\n━'.repeat(50));
    console.log('\n🚨 Cannot connect to Supabase. Possible causes:');
    console.log('   • Supabase project is PAUSED (most common)');
    console.log('   • Firewall/antivirus blocking connection');
    console.log('   • Corporate network blocking external APIs');
    console.log('   • VPN/Proxy interfering with connection\n');
    console.log('📋 Next Steps:');
    console.log('   1. Check project status at: https://supabase.com/dashboard');
    console.log('   2. If paused, click "Restore" to reactivate');
    console.log('   3. Free tier projects auto-pause after 7 days inactivity\n');
    return;
  }

  await checkAuth();

  console.log('\n━'.repeat(50));
  console.log('\n✨ All checks passed! Supabase is reachable.');
  console.log('   If you still have issues, check your environment variables.\n');
}

runDiagnostics().catch(console.error);
