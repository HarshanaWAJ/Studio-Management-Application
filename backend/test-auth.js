

async function test() {
  const baseUrl = 'http://localhost:8088/api/v1';
  
  // 1. Register a test studio
  const regPayload = {
    studioName: "Test Studio " + Date.now(),
    email: "studio" + Date.now() + "@test.com",
    phone: "12345" + Date.now(),
    address: "123 Test St",
    adminFirstName: "Test",
    adminLastName: "Admin",
    adminEmail: "admin" + Date.now() + "@test.com",
    adminPassword: "Password123"
  };

  console.log("Registering with:", regPayload.adminEmail, regPayload.adminPassword);
  
  let res = await fetch(baseUrl + '/studios/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  let data = await res.json();
  console.log("Register Response:", res.status, data);

  if (res.status !== 201) {
    console.log("Registration failed, aborting test.");
    return;
  }

  // 2. Login
  console.log("\nLogging in...");
  res = await fetch(baseUrl + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: regPayload.adminEmail,
      password: regPayload.adminPassword
    })
  });
  data = await res.json();
  console.log("Login Response:", res.status, data);
}

test();
