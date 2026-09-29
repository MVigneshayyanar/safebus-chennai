/**
 * Internationalization dictionary (English + Tamil)
 */

export type Locale = 'en' | 'ta';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // App
    'app.name': 'SafeBus Chennai',
    'app.tagline': 'Verify Before You Pay',
    'app.description': 'Protect yourself from fake bus ticket scams in South Chennai',
    
    // Navigation
    'nav.scan': 'Scan',
    'nav.check': 'Check',
    'nav.report': 'Report',
    'nav.operators': 'Operators',
    'nav.more': 'More',
    'nav.home': 'Home',
    'nav.admin': 'Admin',
    'nav.conductor': 'Conductor',
    'nav.book': 'Book',
    'nav.tickets': 'My Tickets',
    'nav.safety': 'Safety Tips',
    
    // Home
    'home.hero': 'Verify Before You Pay',
    'home.subtitle': 'Don\'t fall victim to fake bus ticketing scams. Verify tickets, check websites, and report fraudsters.',
    'home.scanCard': 'Scan Ticket',
    'home.scanDesc': 'Verify any e-ticket QR code instantly',
    'home.checkCard': 'Check Link / Number',
    'home.checkDesc': 'Verify a website, phone, or UPI ID',
    'home.reportCard': 'Report Seller',
    'home.reportDesc': 'Help others by reporting fraudsters',
    'home.stats.domainsScanned': 'Domains Scanned',
    'home.stats.fraudsBlocked': 'Frauds Blocked',
    'home.stats.reportsReceived': 'Reports Received',
    'home.stats.operatorsVerified': 'Verified Operators',
    'home.festivalWarning': '⚠️ Festival Season Alert: Increased scam activity around Pongal/Deepavali travel. Always verify before booking!',
    
    // Scan
    'scan.title': 'Scan Ticket QR',
    'scan.instruction': 'Point your camera at the ticket QR code',
    'scan.upload': 'Upload QR Image',
    'scan.torch': 'Toggle Flash',
    'scan.offline': 'Offline mode: Signature verification only',
    
    // Verdicts
    'verdict.genuine': 'Genuine Ticket',
    'verdict.genuine.desc': 'This ticket is valid and verified',
    'verdict.alreadyUsed': 'Already Used',
    'verdict.alreadyUsed.desc': 'This ticket has already been used for boarding',
    'verdict.invalid': 'Invalid Ticket',
    'verdict.invalid.desc': 'This ticket\'s signature could not be verified',
    'verdict.revoked': 'Revoked Ticket',
    'verdict.revoked.desc': 'This ticket has been revoked by the operator or admin',
    'verdict.expired': 'Expired Ticket',
    'verdict.expired.desc': 'This ticket is past its travel date',
    
    // Check
    'check.title': 'Check Before You Pay',
    'check.placeholder': 'Enter URL, phone number, UPI ID, or operator name',
    'check.button': 'Check Now',
    'check.detecting': 'Analyzing...',
    'check.safe': 'Looks Safe',
    'check.suspicious': 'Suspicious',
    'check.fraud': 'Likely Fraud',
    'check.allowlisted': 'Verified Platform',
    
    // Report
    'report.title': 'Report a Seller',
    'report.type': 'Report Type',
    'report.fakePortal': 'Fake Booking Website',
    'report.fakeTicket': 'Fake/Counterfeit Ticket',
    'report.scalper': 'Ticket Scalper/Reseller',
    'report.fakeOperator': 'Fake Bus Operator',
    'report.url': 'Website URL',
    'report.phone': 'Phone Number',
    'report.upi': 'UPI ID',
    'report.amount': 'Amount Lost (₹)',
    'report.route': 'Route',
    'report.description': 'Description',
    'report.screenshots': 'Upload Screenshots',
    'report.submit': 'Submit Report',
    'report.success': 'Report submitted successfully!',
    'report.reference': 'Reference Number',
    'report.cybercrime': 'File Cybercrime Complaint',
    'report.helpline': 'Call 1930 Helpline',
    
    // Operators
    'operators.title': 'Verified Operators',
    'operators.search': 'Search operators...',
    'operators.filterHub': 'Filter by Hub',
    'operators.verified': 'Verified',
    'operators.pending': 'Pending',
    'operators.suspended': 'Suspended',
    'operators.trustScore': 'Trust Score',
    'operators.permit': 'Permit',
    'operators.vehicles': 'Vehicles',
    'operators.routes': 'Routes',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try Again',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.noResults': 'No results found',
    'common.viewAll': 'View All',
    'common.language': 'Language',
    
    // Admin
    'admin.title': 'Admin Dashboard',
    'admin.overview': 'Overview',
    'admin.domains': 'Domains',
    'admin.reports': 'Reports',
    'admin.scamRings': 'Scam Rings',
    'admin.operators': 'Operators',
    'admin.scalping': 'Scalping',
    'admin.aggregators': 'Aggregators',
    'admin.audit': 'Audit Log',
    'admin.login': 'Admin Login',
    'admin.logout': 'Logout',
  },
  ta: {
    // App
    'app.name': 'SafeBus சென்னை',
    'app.tagline': 'பணம் செலுத்தும் முன் சரிபார்க்கவும்',
    'app.description': 'தென் சென்னையில் போலி பேருந்து டிக்கெட் மோசடிகளிலிருந்து உங்களைப் பாதுகாக்கவும்',
    
    // Navigation
    'nav.scan': 'ஸ்கேன்',
    'nav.check': 'சரிபார்',
    'nav.report': 'புகார்',
    'nav.operators': 'ஆபரேட்டர்',
    'nav.more': 'மேலும்',
    'nav.home': 'முகப்பு',
    'nav.admin': 'நிர்வாகி',
    'nav.conductor': 'நடத்துனர்',
    'nav.book': 'புக்',
    'nav.tickets': 'டிக்கெட்',
    'nav.safety': 'பாதுகாப்பு',
    
    // Home
    'home.hero': 'பணம் செலுத்தும் முன் சரிபார்க்கவும்',
    'home.subtitle': 'போலி பேருந்து டிக்கெட் மோசடிகளில் பாதிக்கப்படாதீர்கள். டிக்கெட்டுகளை சரிபார்க்கவும், இணையதளங்களை சோதிக்கவும், மோசடி செய்பவர்களை புகாரளிக்கவும்.',
    'home.scanCard': 'டிக்கெட் ஸ்கேன்',
    'home.scanDesc': 'எந்த இ-டிக்கெட் QR குறியீட்டையும் உடனடியாக சரிபார்க்கவும்',
    'home.checkCard': 'இணைப்பு / எண் சரிபார்',
    'home.checkDesc': 'இணையதளம், தொலைபேசி அல்லது UPI ID சரிபார்க்கவும்',
    'home.reportCard': 'விற்பனையாளரை புகாரளி',
    'home.reportDesc': 'மோசடி செய்பவர்களை புகாரளித்து மற்றவர்களுக்கு உதவுங்கள்',
    'home.stats.domainsScanned': 'ஸ்கேன் செய்யப்பட்ட டொமைன்கள்',
    'home.stats.fraudsBlocked': 'தடுக்கப்பட்ட மோசடிகள்',
    'home.stats.reportsReceived': 'பெறப்பட்ட புகார்கள்',
    'home.stats.operatorsVerified': 'சரிபார்க்கப்பட்ட ஆபரேட்டர்கள்',
    'home.festivalWarning': '⚠️ பண்டிகை கால எச்சரிக்கை: பொங்கல்/தீபாவளி பயணத்தின் போது அதிகரித்த மோசடி நடவடிக்கைகள். புக்கிங் செய்வதற்கு முன் எப்போதும் சரிபார்க்கவும்!',
    
    // Scan
    'scan.title': 'டிக்கெட் QR ஸ்கேன்',
    'scan.instruction': 'உங்கள் கேமராவை டிக்கெட் QR குறியீட்டில் காட்டுங்கள்',
    'scan.upload': 'QR படத்தை பதிவேற்றவும்',
    'scan.torch': 'ஃபிளாஷ் மாற்றவும்',
    'scan.offline': 'ஆஃப்லைன் பயன்முறை: கையொப்ப சரிபார்ப்பு மட்டுமே',
    
    // Verdicts
    'verdict.genuine': 'உண்மையான டிக்கெட்',
    'verdict.genuine.desc': 'இந்த டிக்கெட் செல்லுபடியாகும் மற்றும் சரிபார்க்கப்பட்டது',
    'verdict.alreadyUsed': 'ஏற்கனவே பயன்படுத்தப்பட்டது',
    'verdict.alreadyUsed.desc': 'இந்த டிக்கெட் ஏற்கனவே ஏற்றத்திற்கு பயன்படுத்தப்பட்டது',
    'verdict.invalid': 'தவறான டிக்கெட்',
    'verdict.invalid.desc': 'இந்த டிக்கெட்டின் கையொப்பத்தை சரிபார்க்க இயலவில்லை',
    'verdict.revoked': 'ரத்து செய்யப்பட்ட டிக்கெட்',
    'verdict.revoked.desc': 'இந்த டிக்கெட் ஆபரேட்டர் அல்லது நிர்வாகியால் ரத்து செய்யப்பட்டது',
    'verdict.expired': 'காலாவதியான டிக்கெட்',
    'verdict.expired.desc': 'இந்த டிக்கெட் பயண தேதியைக் கடந்துவிட்டது',
    
    // Check
    'check.title': 'பணம் செலுத்தும் முன் சரிபார்க்கவும்',
    'check.placeholder': 'URL, தொலைபேசி எண், UPI ID அல்லது ஆபரேட்டர் பெயரை உள்ளிடவும்',
    'check.button': 'இப்போது சரிபார்',
    'check.detecting': 'பகுப்பாய்வு...',
    'check.safe': 'பாதுகாப்பானது',
    'check.suspicious': 'சந்தேகத்திற்குரியது',
    'check.fraud': 'மோசடி சாத்தியம்',
    'check.allowlisted': 'சரிபார்க்கப்பட்ட தளம்',
    
    // Report
    'report.title': 'விற்பனையாளரை புகாரளிக்கவும்',
    'report.type': 'புகார் வகை',
    'report.fakePortal': 'போலி புக்கிங் இணையதளம்',
    'report.fakeTicket': 'போலி/நகல் டிக்கெட்',
    'report.scalper': 'டிக்கெட் ஸ்கால்பர்/மறுவிற்பனையாளர்',
    'report.fakeOperator': 'போலி பேருந்து ஆபரேட்டர்',
    'report.url': 'இணையதள URL',
    'report.phone': 'தொலைபேசி எண்',
    'report.upi': 'UPI ID',
    'report.amount': 'இழந்த தொகை (₹)',
    'report.route': 'வழித்தடம்',
    'report.description': 'விவரம்',
    'report.screenshots': 'ஸ்கிரீன்ஷாட் பதிவேற்றவும்',
    'report.submit': 'புகாரை சமர்ப்பிக்கவும்',
    'report.success': 'புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!',
    'report.reference': 'குறிப்பு எண்',
    'report.cybercrime': 'சைபர் கிரைம் புகார் அளிக்கவும்',
    'report.helpline': '1930 ஹெல்ப்லைனை அழைக்கவும்',
    
    // Operators
    'operators.title': 'சரிபார்க்கப்பட்ட ஆபரேட்டர்கள்',
    'operators.search': 'ஆபரேட்டர்களைத் தேடுங்கள்...',
    'operators.filterHub': 'ஹப் மூலம் வடிகட்டவும்',
    'operators.verified': 'சரிபார்க்கப்பட்டது',
    'operators.pending': 'நிலுவையில்',
    'operators.suspended': 'இடைநிறுத்தப்பட்டது',
    'operators.trustScore': 'நம்பகத்தன்மை மதிப்பெண்',
    'operators.permit': 'அனுமதி',
    'operators.vehicles': 'வாகனங்கள்',
    'operators.routes': 'வழித்தடங்கள்',
    
    // Common
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'ஏதோ தவறு நடந்தது',
    'common.retry': 'மீண்டும் முயற்சிக்கவும்',
    'common.back': 'பின்',
    'common.next': 'அடுத்து',
    'common.submit': 'சமர்ப்பி',
    'common.cancel': 'ரத்து',
    'common.close': 'மூடு',
    'common.search': 'தேடு',
    'common.filter': 'வடிகட்டு',
    'common.noResults': 'முடிவுகள் இல்லை',
    'common.viewAll': 'அனைத்தையும் காண',
    'common.language': 'மொழி',
    
    // Admin
    'admin.title': 'நிர்வாகி டாஷ்போர்டு',
    'admin.overview': 'கண்ணோட்டம்',
    'admin.domains': 'டொமைன்கள்',
    'admin.reports': 'புகார்கள்',
    'admin.scamRings': 'மோசடி வளையங்கள்',
    'admin.operators': 'ஆபரேட்டர்கள்',
    'admin.scalping': 'ஸ்கால்பிங்',
    'admin.aggregators': 'அக்ரிகேட்டர்கள்',
    'admin.audit': 'தணிக்கை பதிவு',
    'admin.login': 'நிர்வாகி உள்நுழைவு',
    'admin.logout': 'வெளியேறு',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.en;
}

export const SUPPORTED_LOCALES: Locale[] = ['en', 'ta'];
export const DEFAULT_LOCALE: Locale = 'en';
