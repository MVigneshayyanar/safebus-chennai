import { PrismaClient } from '@prisma/client';
import { generateEd25519KeyPair, encryptPrivateKey, generateKid, signTicket, hashPassengerInfo } from '../src/lib/crypto';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SafeBus Chennai database...\n');

  // Clear existing data
  await prisma.webhookDelivery.deleteMany();
  await prisma.apiClient.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.scalpingAlert.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.report.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.operatorKey.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.route.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.user.deleteMany();

  // ============= USERS =============
  console.log('👤 Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@safebus.in',
      passwordHash: hashSync('admin123', 10),
      role: 'ADMIN',
      name: 'SafeBus Admin',
    },
  });
  const officerUser = await prisma.user.create({
    data: {
      email: 'officer@safebus.in',
      passwordHash: hashSync('officer123', 10),
      role: 'OFFICER',
      name: 'Inspector Rajan',
    },
  });

  // ============= OPERATORS =============
  console.log('🚌 Creating operators...');
  const operatorData = [
    { publicId: 'OP-TN-0001', name: 'KPN Travels', permitNumber: 'TN-OMN-1001', permitExpiry: new Date('2027-06-30'), gstin: '33AABCK1234A1ZX', pan: 'AABCK1234A', status: 'VERIFIED', trustScore: 92, registeredMerchantId: 'MID_KPN_001', registeredUpiVpa: 'kpntravels@ybl', contactPhone: '9876543001', hubs: JSON.stringify(['KCBT', 'Tambaram', 'Guindy']) },
    { publicId: 'OP-TN-0002', name: 'SRS Travels', permitNumber: 'TN-OMN-1002', permitExpiry: new Date('2027-08-15'), gstin: '33AABCS2345B1ZY', pan: 'AABCS2345B', status: 'VERIFIED', trustScore: 88, registeredMerchantId: 'MID_SRS_002', registeredUpiVpa: 'srstravels@paytm', contactPhone: '9876543002', hubs: JSON.stringify(['KCBT', 'Velachery', 'OMR']) },
    { publicId: 'OP-TN-0003', name: 'Parveen Travels', permitNumber: 'TN-OMN-1003', permitExpiry: new Date('2027-04-20'), gstin: '33AABCP3456C1ZZ', pan: 'AABCP3456C', status: 'VERIFIED', trustScore: 85, registeredMerchantId: 'MID_PRV_003', registeredUpiVpa: 'parveentravels@upi', contactPhone: '9876543003', hubs: JSON.stringify(['KCBT', 'Tambaram']) },
    { publicId: 'OP-TN-0004', name: 'Kallada Travels', permitNumber: 'TN-OMN-1004', permitExpiry: new Date('2027-12-31'), gstin: '33AABCL4567D1ZA', pan: 'AABCL4567D', status: 'VERIFIED', trustScore: 90, registeredMerchantId: 'MID_KLD_004', registeredUpiVpa: 'kalladatravels@ybl', contactPhone: '9876543004', hubs: JSON.stringify(['KCBT', 'Guindy', 'OMR']) },
    { publicId: 'OP-TN-0005', name: 'SVR Travels', permitNumber: 'TN-OMN-1005', permitExpiry: new Date('2027-09-30'), gstin: '33AABCV5678E1ZB', pan: 'AABCV5678E', status: 'VERIFIED', trustScore: 82, registeredMerchantId: 'MID_SVR_005', registeredUpiVpa: 'svrtravels@paytm', contactPhone: '9876543005', hubs: JSON.stringify(['KCBT', 'Tambaram', 'Velachery']) },
    { publicId: 'OP-TN-0006', name: 'GreenLine Travels', permitNumber: 'TN-OMN-1006', permitExpiry: new Date('2027-07-15'), gstin: '33AABCG6789F1ZC', pan: 'AABCG6789F', status: 'VERIFIED', trustScore: 87, registeredMerchantId: 'MID_GRN_006', registeredUpiVpa: 'greenlinetravels@upi', contactPhone: '9876543006', hubs: JSON.stringify(['KCBT', 'OMR']) },
    { publicId: 'OP-TN-0007', name: 'SS Travels', permitNumber: 'TN-OMN-1007', permitExpiry: new Date('2027-11-30'), gstin: '33AABCSS789G1ZD', pan: 'AABCSS789G', status: 'VERIFIED', trustScore: 79, registeredMerchantId: 'MID_SS_007', registeredUpiVpa: 'sstravels@ybl', contactPhone: '9876543007', hubs: JSON.stringify(['Tambaram', 'Velachery']) },
    { publicId: 'OP-TN-0008', name: 'Jabbar Travels', permitNumber: 'TN-OMN-1008', permitExpiry: new Date('2027-05-31'), gstin: '33AABCJ8901H1ZE', pan: 'AABCJ8901H', status: 'VERIFIED', trustScore: 84, registeredMerchantId: 'MID_JBR_008', registeredUpiVpa: 'jabbartravels@paytm', contactPhone: '9876543008', hubs: JSON.stringify(['KCBT', 'Guindy', 'Tambaram']) },
    { publicId: 'OP-TN-0009', name: 'New Horizon Transport', permitNumber: 'TN-OMN-1009', permitExpiry: new Date('2027-10-15'), gstin: '33AABCN9012I1ZF', pan: 'AABCN9012I', status: 'PENDING', trustScore: 45, registeredMerchantId: null, registeredUpiVpa: 'newhorizon@upi', contactPhone: '9876543009', hubs: JSON.stringify(['KCBT']) },
    { publicId: 'OP-TN-0010', name: 'Star Line Express', permitNumber: 'TN-OMN-1010', permitExpiry: new Date('2027-03-01'), gstin: '33AABCST123J1ZG', pan: 'AABCST123J', status: 'PENDING', trustScore: 40, registeredMerchantId: null, registeredUpiVpa: null, contactPhone: '9876543010', hubs: JSON.stringify(['Velachery']) },
    { publicId: 'OP-TN-0011', name: 'Regal Travels', permitNumber: 'TN-OMN-1011', permitExpiry: new Date('2024-12-31'), gstin: '33AABCR2345K1ZH', pan: 'AABCR2345K', status: 'SUSPENDED', trustScore: 20, registeredMerchantId: 'MID_RGL_011', registeredUpiVpa: 'regaltravels@ybl', contactPhone: '9876543011', hubs: JSON.stringify(['KCBT', 'Tambaram']) },
    { publicId: 'OP-TN-0012', name: 'Golden Bus Services', permitNumber: 'TN-OMN-1012', permitExpiry: new Date('2025-06-30'), gstin: null, pan: 'AABCG3456L', status: 'REJECTED', trustScore: 10, registeredMerchantId: null, registeredUpiVpa: null, contactPhone: '9876543012', hubs: JSON.stringify(['Guindy']) },
  ];

  const operators: any[] = [];
  for (const op of operatorData) {
    const operator = await prisma.operator.create({ data: op });
    operators.push(operator);
  }

  // ============= VEHICLES =============
  console.log('🚍 Creating vehicles...');
  const vehicleTypes = ['SLEEPER', 'SEMI_SLEEPER', 'SEATER', 'AC_SLEEPER'];
  for (const op of operators) {
    const vehicleCount = op.status === 'VERIFIED' ? 3 : op.status === 'PENDING' ? 1 : 2;
    for (let i = 1; i <= vehicleCount; i++) {
      const regNum = `TN${String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')}${['AB', 'CD', 'EF', 'GH', 'JK'][Math.floor(Math.random() * 5)]}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      await prisma.vehicle.create({
        data: {
          operatorId: op.id,
          registrationNumber: regNum,
          fitnessExpiry: new Date(Date.now() + (op.status === 'SUSPENDED' ? -30 : 365) * 24 * 60 * 60 * 1000),
          insuranceExpiry: new Date(Date.now() + (op.status === 'SUSPENDED' ? -15 : 180) * 24 * 60 * 60 * 1000),
          seats: [36, 40, 45, 48][Math.floor(Math.random() * 4)],
          type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
        },
      });
    }
  }

  // ============= OPERATOR KEYS =============
  console.log('🔑 Generating operator keys...');
  const operatorKeys: Record<string, { kid: string; publicKeyPem: string; privateKeyPem: string }> = {};
  for (const op of operators.filter(o => o.status === 'VERIFIED')) {
    const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();
    const kid = generateKid(op.publicId);
    
    await prisma.operatorKey.create({
      data: {
        operatorId: op.id,
        kid,
        publicKeyPem,
        privateKeyEncrypted: encryptPrivateKey(privateKeyPem),
        status: 'ACTIVE',
      },
    });
    
    operatorKeys[op.id] = { kid, publicKeyPem, privateKeyPem };
  }

  // ============= ROUTES =============
  console.log('🛤️ Creating routes...');
  const routeData = [
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Madurai', distanceKm: 460, baseFare: 650 },
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Tirunelveli', distanceKm: 620, baseFare: 850 },
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Coimbatore', distanceKm: 505, baseFare: 700 },
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Trichy', distanceKm: 330, baseFare: 500 },
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Nagercoil', distanceKm: 680, baseFare: 950 },
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Bengaluru', distanceKm: 350, baseFare: 600 },
    { fromCity: 'Kilambakkam (KCBT)', toCity: 'Tirupati', distanceKm: 140, baseFare: 300 },
    { fromCity: 'Tambaram', toCity: 'Madurai', distanceKm: 450, baseFare: 630 },
    { fromCity: 'Tambaram', toCity: 'Tirunelveli', distanceKm: 610, baseFare: 830 },
    { fromCity: 'Tambaram', toCity: 'Coimbatore', distanceKm: 495, baseFare: 680 },
    { fromCity: 'Guindy', toCity: 'Madurai', distanceKm: 465, baseFare: 660 },
    { fromCity: 'Guindy', toCity: 'Bengaluru', distanceKm: 340, baseFare: 580 },
    { fromCity: 'Velachery', toCity: 'Madurai', distanceKm: 455, baseFare: 640 },
    { fromCity: 'Velachery', toCity: 'Trichy', distanceKm: 325, baseFare: 490 },
    { fromCity: 'OMR/Sholinganallur', toCity: 'Madurai', distanceKm: 470, baseFare: 670 },
    { fromCity: 'OMR/Sholinganallur', toCity: 'Coimbatore', distanceKm: 510, baseFare: 720 },
    { fromCity: 'OMR/Sholinganallur', toCity: 'Bengaluru', distanceKm: 345, baseFare: 590 },
  ];

  const routes: any[] = [];
  for (const r of routeData) {
    const route = await prisma.route.create({
      data: { ...r, fareCapMultiplier: 1.5 },
    });
    routes.push(route);
  }

  // ============= TICKETS =============
  console.log('🎫 Creating tickets...');
  const vehicles = await prisma.vehicle.findMany();
  const verifiedOps = operators.filter(o => o.status === 'VERIFIED');
  const tickets: any[] = [];

  for (let i = 0; i < 40; i++) {
    const op = verifiedOps[i % verifiedOps.length];
    const route = routes[i % routes.length];
    const vehicle = vehicles.find(v => v.operatorId === op.id) || vehicles[0];
    const key = operatorKeys[op.id];
    if (!key) continue;

    const ticketNumber = `SB-${String(i + 1).padStart(6, '0')}`;
    const passengerHash = hashPassengerInfo(`98765${String(43000 + i)}`);
    const seat = `${['A', 'B', 'C'][i % 3]}${Math.floor(i / 3) + 1}`;
    const travelDateTime = new Date(Date.now() + (i < 20 ? (i + 1) : -(i - 19)) * 24 * 60 * 60 * 1000);
    const fare = route.baseFare + Math.round(Math.random() * 200 - 100);

    // Determine status
    let status = 'ISSUED';
    if (i >= 30 && i < 35) status = 'BOARDED';
    else if (i >= 35 && i < 38) status = 'CANCELLED';
    else if (i >= 38) status = 'REVOKED';

    const payload = {
      tid: ticketNumber,
      oid: op.publicId,
      kid: key.kid,
      route: `${route.fromCity}-${route.toCity}`,
      dt: travelDateTime.toISOString(),
      seat,
      ph: passengerHash,
      fare,
    };

    let jws: string;
    
    // Create a tampered ticket for demo (i === 25)
    if (i === 25) {
      // Sign with real key but we'll tamper the JWS later
      jws = await signTicket(payload, key.privateKeyPem, key.kid);
      // Tamper by modifying a byte in the signature
      const parts = jws.split('.');
      const sigBytes = Buffer.from(parts[2], 'base64url');
      sigBytes[0] = sigBytes[0] ^ 0xFF;
      parts[2] = sigBytes.toString('base64url');
      jws = parts.join('.');
    } else {
      jws = await signTicket(payload, key.privateKeyPem, key.kid);
    }

    // Create mock payment
    const payment = await prisma.payment.create({
      data: {
        provider: 'MOCK',
        orderId: `mock_order_${ticketNumber}`,
        paymentRefId: `mock_pay_${ticketNumber}`,
        amount: fare,
        payeeMerchantId: op.registeredMerchantId,
        status: 'PAID',
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        operatorId: op.id,
        routeId: route.id,
        vehicleId: vehicle.id,
        travelDateTime,
        seat,
        passengerHash,
        fare,
        paymentId: payment.id,
        status,
        boardedAt: status === 'BOARDED' ? new Date() : null,
        jws,
      },
    });
    tickets.push(ticket);
  }

  // ============= DOMAINS =============
  console.log('🌐 Creating domains...');
  const domainData = [
    // Allowlisted real platforms
    { host: 'redbus.in', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Verified legitimate platform' }]), whoisAgeDays: 5000, tlsIssuer: 'DigiCert', tlsAgeDays: 200, source: 'SEARCH' },
    { host: 'abhibus.com', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Verified legitimate platform' }]), whoisAgeDays: 4500, tlsIssuer: 'Sectigo', tlsAgeDays: 150, source: 'SEARCH' },
    { host: 'tnstc.in', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Official government platform' }]), whoisAgeDays: 3800, tlsIssuer: 'NIC', tlsAgeDays: 300, source: 'SEARCH' },
    { host: 'setcbus.com', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Official SETC platform' }]), whoisAgeDays: 3200, tlsIssuer: 'NIC', tlsAgeDays: 250, source: 'SEARCH' },
    { host: 'kpntravels.com', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Verified operator website' }]), whoisAgeDays: 4000, tlsIssuer: 'Comodo', tlsAgeDays: 180, source: 'SEARCH' },
    { host: 'srstravels.com', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Verified operator website' }]), whoisAgeDays: 3500, tlsIssuer: 'GeoTrust', tlsAgeDays: 160, source: 'SEARCH' },
    { host: 'makemytrip.com', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Major travel platform' }]), whoisAgeDays: 7000, tlsIssuer: 'DigiCert', tlsAgeDays: 280, source: 'SEARCH' },
    { host: 'goibibo.com', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Major travel platform' }]), whoisAgeDays: 5500, tlsIssuer: 'DigiCert', tlsAgeDays: 260, source: 'SEARCH' },
    { host: 'greenbus.in', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Verified operator website' }]), whoisAgeDays: 2800, tlsIssuer: 'Sectigo', tlsAgeDays: 140, source: 'SEARCH' },
    { host: 'intrcity.in', verdict: 'ALLOWLISTED', riskScore: 0, reasons: JSON.stringify([{ signal: 'allowlisted', description: 'Verified operator website' }]), whoisAgeDays: 2200, tlsIssuer: 'Amazon', tlsAgeDays: 120, source: 'SEARCH' },
    // Fake / suspicious domains
    { host: 'redbus-booking.xyz', verdict: 'FRAUD', riskScore: 85, reasons: JSON.stringify([{ signal: 'lookalike', description: 'Imitates redbus.in' }, { signal: 'new_domain', description: 'Domain only 12 days old' }, { signal: 'suspicious_tld', description: 'Uses suspicious .xyz TLD' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }]), whoisAgeDays: 12, tlsIssuer: "Let's Encrypt", tlsAgeDays: 10, source: 'TYPOSQUAT' },
    { host: 'redbuss.in', verdict: 'FRAUD', riskScore: 75, reasons: JSON.stringify([{ signal: 'lookalike', description: 'Typosquat of redbus.in' }, { signal: 'young_domain', description: 'Domain only 45 days old' }]), whoisAgeDays: 45, tlsIssuer: "Let's Encrypt", tlsAgeDays: 40, source: 'TYPOSQUAT' },
    { host: 'chennai-bus-tickets.online', verdict: 'FRAUD', riskScore: 78, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 8 days old' }, { signal: 'suspicious_tld', description: 'Uses suspicious .online TLD' }, { signal: 'keyword_stuffing', description: 'Bus-related keywords in new domain' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }]), whoisAgeDays: 8, tlsIssuer: 'ZeroSSL', tlsAgeDays: 7, source: 'SEARCH' },
    { host: 'kcbt-booking.com', verdict: 'FRAUD', riskScore: 72, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 20 days old' }, { signal: 'keyword_stuffing', description: 'Uses KCBT keyword' }, { signal: 'personal_upi', description: 'Payment to personal UPI ramesh.k@ybl' }]), whoisAgeDays: 20, tlsIssuer: "Let's Encrypt", tlsAgeDays: 18, source: 'CT_LOG' },
    { host: 'tambaram-bus-online.site', verdict: 'FRAUD', riskScore: 80, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 5 days old' }, { signal: 'suspicious_tld', description: 'Uses suspicious .site TLD' }, { signal: 'keyword_stuffing', description: 'Tambaram bus keyword' }, { signal: 'shared_fraud_entities', description: 'Shares phone with known scam' }]), whoisAgeDays: 5, tlsIssuer: 'ZeroSSL', tlsAgeDays: 4, source: 'USER_REPORT' },
    { host: 'madurai-sleeper-bus.tk', verdict: 'FRAUD', riskScore: 90, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 3 days old' }, { signal: 'suspicious_tld', description: 'Free .tk domain' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }, { signal: 'shared_fraud_entities', description: 'Shares UPI with 3 fraud reports' }]), whoisAgeDays: 3, tlsIssuer: "Let's Encrypt", tlsAgeDays: 2, source: 'SOCIAL' },
    { host: 'kpn-travels-booking.in', verdict: 'FRAUD', riskScore: 70, reasons: JSON.stringify([{ signal: 'lookalike', description: 'Imitates KPN Travels' }, { signal: 'young_domain', description: 'Domain only 60 days old' }]), whoisAgeDays: 60, tlsIssuer: "Let's Encrypt", tlsAgeDays: 55, source: 'TYPOSQUAT' },
    { host: 'cheapbustickets-chennai.com', verdict: 'SUSPICIOUS', riskScore: 55, reasons: JSON.stringify([{ signal: 'young_domain', description: 'Domain only 85 days old' }, { signal: 'keyword_stuffing', description: 'Bus-related keyword stuffing' }]), whoisAgeDays: 85, tlsIssuer: "Let's Encrypt", tlsAgeDays: 80, source: 'SEARCH' },
    { host: 'omni-bus-booking.online', verdict: 'FRAUD', riskScore: 82, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 15 days old' }, { signal: 'suspicious_tld', description: '.online TLD' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }]), whoisAgeDays: 15, tlsIssuer: 'ZeroSSL', tlsAgeDays: 14, source: 'CT_LOG' },
    { host: 'busbookingchennai.xyz', verdict: 'FRAUD', riskScore: 68, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 28 days old' }, { signal: 'suspicious_tld', description: '.xyz TLD' }]), whoisAgeDays: 28, tlsIssuer: "Let's Encrypt", tlsAgeDays: 25, source: 'SEARCH' },
    { host: 'velachery-travels.site', verdict: 'FRAUD', riskScore: 76, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 10 days old' }, { signal: 'suspicious_tld', description: '.site TLD' }, { signal: 'shared_fraud_entities', description: 'Shares phone with 2 reports' }]), whoisAgeDays: 10, tlsIssuer: 'ZeroSSL', tlsAgeDays: 8, source: 'USER_REPORT' },
    { host: 'fastbus-tn.com', verdict: 'SUSPICIOUS', riskScore: 42, reasons: JSON.stringify([{ signal: 'young_domain', description: 'Domain only 75 days old' }, { signal: 'keyword_stuffing', description: 'Bus-related keywords' }]), whoisAgeDays: 75, tlsIssuer: "Let's Encrypt", tlsAgeDays: 70, source: 'SEARCH' },
    { host: 'setc-online-booking.in', verdict: 'FRAUD', riskScore: 74, reasons: JSON.stringify([{ signal: 'lookalike', description: 'Imitates SETC' }, { signal: 'young_domain', description: 'Domain only 55 days old' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }]), whoisAgeDays: 55, tlsIssuer: "Let's Encrypt", tlsAgeDays: 50, source: 'TYPOSQUAT' },
    { host: 'guindy-bus-terminal.online', verdict: 'FRAUD', riskScore: 83, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 7 days old' }, { signal: 'suspicious_tld', description: '.online TLD' }, { signal: 'keyword_stuffing', description: 'Guindy bus terminal keyword' }, { signal: 'shared_fraud_entities', description: 'Shares UPI with known scam ring' }]), whoisAgeDays: 7, tlsIssuer: 'ZeroSSL', tlsAgeDays: 6, source: 'CT_LOG' },
    { host: 'abhibus-offers.xyz', verdict: 'FRAUD', riskScore: 71, reasons: JSON.stringify([{ signal: 'lookalike', description: 'Imitates AbhiBus' }, { signal: 'new_domain', description: 'Domain only 22 days old' }, { signal: 'suspicious_tld', description: '.xyz TLD' }]), whoisAgeDays: 22, tlsIssuer: "Let's Encrypt", tlsAgeDays: 20, source: 'TYPOSQUAT' },
    { host: 'overnight-bus-deals.com', verdict: 'SUSPICIOUS', riskScore: 38, reasons: JSON.stringify([{ signal: 'moderately_new_domain', description: 'Domain 120 days old' }]), whoisAgeDays: 120, tlsIssuer: 'Comodo', tlsAgeDays: 110, source: 'SEARCH' },
    { host: 'nagercoil-express-bus.ga', verdict: 'FRAUD', riskScore: 88, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 4 days old' }, { signal: 'suspicious_tld', description: 'Free .ga TLD' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }, { signal: 'shared_fraud_entities', description: 'Shares phone/UPI with known fraud ring' }]), whoisAgeDays: 4, tlsIssuer: "Let's Encrypt", tlsAgeDays: 3, source: 'SOCIAL' },
    { host: 'trichy-bus-tickets.ml', verdict: 'FRAUD', riskScore: 86, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 6 days old' }, { signal: 'suspicious_tld', description: 'Free .ml TLD' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }]), whoisAgeDays: 6, tlsIssuer: "Let's Encrypt", tlsAgeDays: 5, source: 'SEARCH' },
    { host: 'travels-booking-india.com', verdict: 'SUSPICIOUS', riskScore: 45, reasons: JSON.stringify([{ signal: 'young_domain', description: 'Domain only 90 days old' }, { signal: 'keyword_stuffing', description: 'Generic travel keywords' }]), whoisAgeDays: 90, tlsIssuer: "Let's Encrypt", tlsAgeDays: 85, source: 'SEARCH' },
    { host: 'tirupati-bus-booking.online', verdict: 'FRAUD', riskScore: 77, reasons: JSON.stringify([{ signal: 'new_domain', description: 'Domain only 14 days old' }, { signal: 'suspicious_tld', description: '.online TLD' }, { signal: 'personal_upi', description: 'Payment to personal UPI' }]), whoisAgeDays: 14, tlsIssuer: 'ZeroSSL', tlsAgeDays: 12, source: 'CT_LOG' },
  ];

  for (const d of domainData) {
    await prisma.domain.create({ data: d });
  }

  // ============= ENTITIES (scam identifiers) =============
  console.log('🕸️ Creating entities...');
  const entityData = [
    // Cluster 1: "Ramesh Scam Ring"
    { kind: 'PHONE', value: '9876500001', reportCount: 5, blocklisted: true, clusterId: 'cluster-1' },
    { kind: 'UPI', value: 'ramesh.k@ybl', reportCount: 4, blocklisted: true, clusterId: 'cluster-1' },
    { kind: 'UPI', value: 'rameshkumar@paytm', reportCount: 3, blocklisted: true, clusterId: 'cluster-1' },
    { kind: 'DOMAIN', value: 'kcbt-booking.com', reportCount: 3, blocklisted: true, clusterId: 'cluster-1' },
    { kind: 'DOMAIN', value: 'chennai-bus-tickets.online', reportCount: 2, blocklisted: true, clusterId: 'cluster-1' },
    // Cluster 2: "Velachery UPI Gang"
    { kind: 'PHONE', value: '9876500002', reportCount: 3, blocklisted: true, clusterId: 'cluster-2' },
    { kind: 'PHONE', value: '9876500003', reportCount: 2, blocklisted: true, clusterId: 'cluster-2' },
    { kind: 'UPI', value: 'suresh.travel@ybl', reportCount: 4, blocklisted: true, clusterId: 'cluster-2' },
    { kind: 'DOMAIN', value: 'velachery-travels.site', reportCount: 2, blocklisted: true, clusterId: 'cluster-2' },
    // Cluster 3: "Social Media Scalpers"
    { kind: 'PHONE', value: '9876500004', reportCount: 4, blocklisted: true, clusterId: 'cluster-3' },
    { kind: 'UPI', value: 'busdeals.chennai@ybl', reportCount: 3, blocklisted: true, clusterId: 'cluster-3' },
    { kind: 'DOMAIN', value: 'madurai-sleeper-bus.tk', reportCount: 2, blocklisted: true, clusterId: 'cluster-3' },
    { kind: 'DOMAIN', value: 'nagercoil-express-bus.ga', reportCount: 2, blocklisted: true, clusterId: 'cluster-3' },
    // Additional entities
    { kind: 'UPI', value: 'fakebus@upi', reportCount: 1, blocklisted: false, clusterId: null },
    { kind: 'PHONE', value: '9876500005', reportCount: 1, blocklisted: false, clusterId: null },
  ];

  for (const e of entityData) {
    await prisma.entity.create({ data: e });
  }

  // ============= REPORTS =============
  console.log('📝 Creating reports...');
  const reportData = [
    // Cluster 1 reports
    { type: 'FAKE_PORTAL', url: 'https://kcbt-booking.com', phone: '9876500001', upiId: 'ramesh.k@ybl', amountLost: 1200, routeId: routes[0].id, description: 'Paid for Chennai to Madurai ticket via this website. Got a fake ticket. UPI payment went to ramesh.k@ybl.', status: 'CONFIRMED', clusterId: 'cluster-1' },
    { type: 'FAKE_PORTAL', url: 'https://kcbt-booking.com', phone: '9876500001', upiId: 'rameshkumar@paytm', amountLost: 850, routeId: routes[3].id, description: 'Booked Trichy bus from this fake KCBT site. Money debited but no ticket.', status: 'CONFIRMED', clusterId: 'cluster-1' },
    { type: 'FAKE_PORTAL', url: 'https://chennai-bus-tickets.online', phone: '9876500001', upiId: 'ramesh.k@ybl', amountLost: 1500, routeId: routes[1].id, description: 'Website looks like official KCBT site but payment goes to personal UPI.', status: 'CONFIRMED', clusterId: 'cluster-1' },
    { type: 'FAKE_TICKET', phone: '9876500001', upiId: 'ramesh.k@ybl', amountLost: 700, routeId: routes[5].id, description: 'Bought ticket to Bengaluru from WhatsApp seller. Ticket was fake at the counter.', status: 'CONFIRMED', clusterId: 'cluster-1' },
    { type: 'FAKE_PORTAL', url: 'https://chennai-bus-tickets.online', upiId: 'rameshkumar@paytm', amountLost: 950, routeId: routes[2].id, description: 'Fake Coimbatore bus booking site. Shares the same UPI as other scam sites.', status: 'IN_REVIEW', clusterId: 'cluster-1' },
    { type: 'FAKE_PORTAL', url: 'https://kcbt-booking.com', phone: '9876500001', amountLost: 600, routeId: routes[6].id, description: 'Same phone number keeps calling offering cheap Tirupati tickets.', status: 'IN_REVIEW', clusterId: 'cluster-1' },
    { type: 'FAKE_TICKET', phone: '9876500001', upiId: 'ramesh.k@ybl', amountLost: 1100, routeId: routes[0].id, description: 'QR code on ticket is invalid. Paid via Google Pay to this UPI.', status: 'CONFIRMED', clusterId: 'cluster-1' },
    { type: 'SCALPER', phone: '9876500001', amountLost: 2000, routeId: routes[0].id, description: 'Scalper selling Pongal season Madurai tickets at 3x price via WhatsApp.', status: 'CONFIRMED', clusterId: 'cluster-1' },
    // Cluster 2 reports
    { type: 'FAKE_PORTAL', url: 'https://velachery-travels.site', phone: '9876500002', upiId: 'suresh.travel@ybl', amountLost: 800, routeId: routes[12].id, description: 'Fake booking site for Velachery to Madurai. Payment goes to personal UPI.', status: 'CONFIRMED', clusterId: 'cluster-2' },
    { type: 'FAKE_PORTAL', url: 'https://velachery-travels.site', phone: '9876500003', upiId: 'suresh.travel@ybl', amountLost: 950, routeId: routes[13].id, description: 'Same fake site for Velachery-Trichy route. Different phone, same UPI.', status: 'CONFIRMED', clusterId: 'cluster-2' },
    { type: 'FAKE_OPERATOR', phone: '9876500002', upiId: 'suresh.travel@ybl', amountLost: 1300, routeId: routes[12].id, description: 'Posed as verified operator at Velachery bus stand. Collected payment via UPI.', status: 'CONFIRMED', clusterId: 'cluster-2' },
    { type: 'FAKE_TICKET', phone: '9876500003', upiId: 'suresh.travel@ybl', amountLost: 750, routeId: routes[13].id, description: 'Printed fake tickets being sold near Velachery metro. Same scammer network.', status: 'IN_REVIEW', clusterId: 'cluster-2' },
    { type: 'SCALPER', phone: '9876500002', amountLost: 1800, routeId: routes[12].id, description: 'Buying bulk tickets and reselling at inflated prices near Velachery terminal.', status: 'CONFIRMED', clusterId: 'cluster-2' },
    { type: 'FAKE_PORTAL', url: 'https://velachery-travels.site', phone: '9876500002', amountLost: 650, routeId: routes[12].id, description: 'Website has no operator license info. Looks professional but is a scam.', status: 'NEW', clusterId: 'cluster-2' },
    // Cluster 3 reports
    { type: 'SCALPER', phone: '9876500004', upiId: 'busdeals.chennai@ybl', amountLost: 2500, routeId: routes[0].id, description: 'Advertising "festival special" bus deals on Instagram. Payment to personal UPI. Never sends tickets.', status: 'CONFIRMED', clusterId: 'cluster-3' },
    { type: 'FAKE_PORTAL', url: 'https://madurai-sleeper-bus.tk', phone: '9876500004', upiId: 'busdeals.chennai@ybl', amountLost: 900, routeId: routes[0].id, description: 'Free TK domain scam site. Promotes via Facebook ads for Chennai-Madurai buses.', status: 'CONFIRMED', clusterId: 'cluster-3' },
    { type: 'FAKE_PORTAL', url: 'https://nagercoil-express-bus.ga', upiId: 'busdeals.chennai@ybl', amountLost: 1050, routeId: routes[4].id, description: 'Another free domain scam. Same UPI as madurai-sleeper-bus.tk scammer.', status: 'CONFIRMED', clusterId: 'cluster-3' },
    { type: 'SCALPER', phone: '9876500004', amountLost: 3000, routeId: routes[0].id, description: 'Selling "confirmed" Deepavali tickets at 4x price. Active on Telegram groups.', status: 'CONFIRMED', clusterId: 'cluster-3' },
    { type: 'FAKE_TICKET', phone: '9876500004', upiId: 'busdeals.chennai@ybl', amountLost: 1200, routeId: routes[1].id, description: 'Bought "guaranteed" Tirunelveli ticket via Telegram. Completely fake.', status: 'IN_REVIEW', clusterId: 'cluster-3' },
    // Standalone reports
    { type: 'FAKE_PORTAL', url: 'https://busbookingchennai.xyz', amountLost: 500, routeId: routes[2].id, description: 'Generic fake bus booking site with suspicious domain.', status: 'NEW', clusterId: null },
    { type: 'FAKE_OPERATOR', phone: '9876500005', amountLost: 400, routeId: routes[5].id, description: 'Man at Guindy bus stand claiming to be authorized agent for Bengaluru buses.', status: 'NEW', clusterId: null },
    { type: 'FAKE_TICKET', amountLost: 350, routeId: routes[7].id, description: 'Found a counterfeit ticket that was poorly printed.', status: 'NEW', clusterId: null },
    { type: 'SCALPER', url: 'https://omni-bus-booking.online', amountLost: 1500, routeId: routes[0].id, description: 'Overpriced tickets sold through this fake aggregator.', status: 'NEW', clusterId: null },
    { type: 'FAKE_PORTAL', url: 'https://setc-online-booking.in', amountLost: 780, routeId: routes[9].id, description: 'Imitates SETC official website. Not legitimate.', status: 'IN_REVIEW', clusterId: null },
    { type: 'FAKE_PORTAL', url: 'https://trichy-bus-tickets.ml', amountLost: 600, routeId: routes[3].id, description: 'Free .ml domain selling fake Trichy bus tickets.', status: 'NEW', clusterId: null },
  ];

  for (const r of reportData) {
    await prisma.report.create({ data: r });
  }

  // ============= SCALPING ALERTS =============
  console.log('📊 Creating scalping alerts...');
  const alertData = [
    { kind: 'BULK_BUY', severity: 'HIGH', details: JSON.stringify({ buyerHash: 'hash_bulk_1', ticketCount: 15, route: 'KCBT to Madurai', timeWindow: '2 hours', pattern: 'Single buyer purchased 15 tickets in 2 hours for Pongal weekend' }), routeId: routes[0].id, operatorId: operators[0].id, status: 'OPEN' },
    { kind: 'PRICE_GOUGE', severity: 'CRITICAL', details: JSON.stringify({ fare: 1950, baseFare: 650, capFare: 975, overchargePercent: 200, route: 'KCBT to Madurai', note: 'Pongal festival period - fare 3x base' }), routeId: routes[0].id, operatorId: operators[1].id, status: 'OPEN' },
    { kind: 'RESALE_LISTING', severity: 'MEDIUM', details: JSON.stringify({ platform: 'OLX', listing: 'Chennai to Madurai AC Sleeper - Pongal confirmed', price: 2500, actualFare: 650, seller: 'anonymous_user_123' }), routeId: routes[0].id, status: 'OPEN' },
    { kind: 'DUPLICATE_SCAN', severity: 'HIGH', details: JSON.stringify({ ticketNumber: 'SB-000031', firstScan: '2026-01-14T22:30:00', secondScan: '2026-01-14T23:15:00', location1: 'KCBT Gate 5', location2: 'KCBT Gate 12', note: 'Same ticket scanned at two different gates' }), routeId: routes[0].id, operatorId: operators[0].id, status: 'OPEN' },
    { kind: 'BULK_BUY', severity: 'MEDIUM', details: JSON.stringify({ buyerHash: 'hash_bulk_2', ticketCount: 8, route: 'KCBT to Coimbatore', timeWindow: '30 minutes', pattern: 'Suspected scalper pre-booking for Deepavali' }), routeId: routes[2].id, operatorId: operators[2].id, status: 'OPEN' },
    { kind: 'PRICE_GOUGE', severity: 'HIGH', details: JSON.stringify({ fare: 1700, baseFare: 850, capFare: 1275, overchargePercent: 100, route: 'KCBT to Tirunelveli', note: 'Deepavali surge pricing detected' }), routeId: routes[1].id, operatorId: operators[3].id, status: 'OPEN' },
    { kind: 'RESALE_LISTING', severity: 'LOW', details: JSON.stringify({ platform: 'Facebook Marketplace', listing: 'Tambaram to Madurai sleeper - great deal', price: 1200, actualFare: 630 }), routeId: routes[7].id, status: 'RESOLVED' },
    { kind: 'BULK_BUY', severity: 'CRITICAL', details: JSON.stringify({ buyerHash: 'hash_bulk_3', ticketCount: 25, route: 'KCBT to Bengaluru', timeWindow: '1 hour', pattern: 'Massive bulk purchase detected - likely organized scalping' }), routeId: routes[5].id, operatorId: operators[5].id, status: 'OPEN' },
  ];

  for (const a of alertData) {
    await prisma.scalpingAlert.create({ data: a });
  }

  // ============= API CLIENTS =============
  console.log('🔗 Creating API clients...');
  const apiClient1 = await prisma.apiClient.create({
    data: {
      name: 'Demo Aggregator',
      apiKeyHash: hashSync('sb_test_demo_aggregator_key_2026', 10),
      rateLimit: 100,
      webhookUrl: 'https://webhook.site/demo-aggregator',
    },
  });

  const apiClient2 = await prisma.apiClient.create({
    data: {
      name: 'Travel Portal Integration',
      apiKeyHash: hashSync('sb_test_travel_portal_key_2026', 10),
      rateLimit: 50,
      webhookUrl: null,
    },
  });

  // Sample webhook deliveries
  await prisma.webhookDelivery.create({
    data: {
      clientId: apiClient1.id,
      event: 'operator.suspended',
      payload: JSON.stringify({ operatorId: operators[10].publicId, name: operators[10].name, reason: 'Expired permit' }),
      status: 'DELIVERED',
      attempts: 1,
      lastAttempt: new Date(),
    },
  });

  // ============= AUDIT LOGS =============
  console.log('📋 Creating audit logs...');
  const auditData = [
    { actor: adminUser.email, action: 'OPERATOR_VERIFIED', entity: 'Operator', entityId: operators[0].publicId, meta: JSON.stringify({ name: operators[0].name }) },
    { actor: adminUser.email, action: 'OPERATOR_SUSPENDED', entity: 'Operator', entityId: operators[10].publicId, meta: JSON.stringify({ name: operators[10].name, reason: 'Expired permit' }) },
    { actor: officerUser.email, action: 'REPORT_CONFIRMED', entity: 'Report', entityId: 'RPT-001', meta: JSON.stringify({ type: 'FAKE_PORTAL' }) },
    { actor: 'system', action: 'DOMAIN_BLOCKLISTED', entity: 'Domain', entityId: 'redbus-booking.xyz', meta: JSON.stringify({ riskScore: 85 }) },
    { actor: 'system', action: 'KEY_GENERATED', entity: 'OperatorKey', entityId: operators[0].publicId, meta: JSON.stringify({ kid: operatorKeys[operators[0].id]?.kid }) },
  ];

  for (const a of auditData) {
    await prisma.auditLog.create({ data: a });
  }

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📊 ${operators.length} operators`);
  console.log(`  🚍 ${await prisma.vehicle.count()} vehicles`);
  console.log(`  🔑 ${Object.keys(operatorKeys).length} operator keypairs`);
  console.log(`  🛤️  ${routes.length} routes`);
  console.log(`  🎫 ${tickets.length} tickets`);
  console.log(`  🌐 ${domainData.length} domains`);
  console.log(`  📝 ${reportData.length} reports`);
  console.log(`  🕸️  ${entityData.length} entities`);
  console.log(`  📊 ${alertData.length} scalping alerts`);
  console.log(`  🔗 2 API clients`);
  console.log(`  👤 2 users`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 Demo Credentials:');
  console.log('  Admin: admin@safebus.in / admin123');
  console.log('  Officer: officer@safebus.in / officer123');
  console.log('  API Key: sb_test_demo_aggregator_key_2026');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
