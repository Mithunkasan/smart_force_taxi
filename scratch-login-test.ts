async function testRedirect() {
  const baseURL = 'http://localhost:3000';
  
  // 1. Get CSRF token
  const csrfRes = await fetch(`${baseURL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookies = csrfRes.headers.getSetCookie();

  // 2. Perform Login POST
  const allCookiesMap = new Map<string, string>();
  initialCookies.forEach(c => {
    const parts = c.split(';')[0].split('=');
    if (parts.length >= 2) {
      allCookiesMap.set(parts[0], parts.slice(1).join('='));
    }
  });

  const cookieString = Array.from(allCookiesMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  
  const loginForm = new URLSearchParams();
  loginForm.append('csrfToken', csrfToken);
  loginForm.append('email', 'testdriver@example.com');
  loginForm.append('password', 'driverpassword');
  loginForm.append('redirect', 'false');
  loginForm.append('json', 'true');

  const loginRes = await fetch(`${baseURL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieString
    },
    body: loginForm,
    redirect: 'manual'
  });

  const authCookies = loginRes.headers.getSetCookie();
  authCookies.forEach(c => {
    const parts = c.split(';')[0].split('=');
    if (parts.length >= 2) {
      allCookiesMap.set(parts[0], parts.slice(1).join('='));
    }
  });

  let currentCookie = Array.from(allCookiesMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  console.log("Requesting /driver...");
  const res = await fetch(`${baseURL}/driver`, {
    headers: {
      'Cookie': currentCookie
    },
    redirect: 'manual'
  });

  console.log("Response status:", res.status);
  console.log("Response location:", res.headers.get('location'));
}

testRedirect().catch(console.error);
