const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.warn('[Security Warning] SECRET_KEY not provided in environment! Using development fallback.');
}
const JWT_SECRET = SECRET_KEY || "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7";

// Ephemeral runtime identifier: freshly generated on each server start.
// Ensures any existing session tokens from previous server runs are immediately invalidated.
const SERVER_BOOT_ID = crypto.randomBytes(16).toString('hex');

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

function createAccessToken(data) {
    return jwt.sign({ ...data, bootId: SERVER_BOOT_ID }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || decoded.bootId !== SERVER_BOOT_ID) {
            return null; // Token was issued by a previous server run
        }
        return decoded;
    } catch (e) {
        return null;
    }
}

/**
 * Extracts JWT token from either the Authorization header or the admin_token cookie.
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    if (req.cookies && req.cookies.admin_token) {
        return req.cookies.admin_token;
    }
    return null;
}

/**
 * Validates admin credentials from the request token and returns the Admin record.
 */
async function getAuthenticatedAdmin(req) {
    const token = extractToken(req);
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload || !payload.sub) return null;

    const { Admin } = require('./models');
    try {
        const admin = await Admin.findOne({ where: { username: payload.sub } });
        return admin || null;
    } catch (err) {
        console.error('[Auth] Error fetching admin:', err);
        return null;
    }
}

/**
 * Middleware for Web UI routes (/dashboard, /devices, /requests).
 * If the user is not authenticated, clears any stale cookie and redirects them to /login.
 */
async function requireWebAdmin(req, res, next) {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
        if (req.cookies && req.cookies.admin_token) {
            res.clearCookie('admin_token');
        }
        return res.redirect('/login');
    }
    req.admin = admin;
    res.locals.admin = admin;
    next();
}

/**
 * Middleware for API and administrative action endpoints.
 * Supports both Bearer token and cookie-based authentication.
 */
async function requireAdminRequire(req, res, next) {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
        if (req.cookies && req.cookies.admin_token) {
            res.clearCookie('admin_token');
        }
        if (req.headers.accept && req.headers.accept.includes('text/html') && req.method === 'GET') {
            return res.redirect('/login');
        }
        return res.status(401).json({ detail: "Unauthorized - Admin session required" });
    }
    req.admin = admin;
    res.locals.admin = admin;
    next();
}

function generateDeviceToken() {
    const raw = crypto.randomBytes(24).toString('base64url');
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hashed };
}

module.exports = {
    hashPassword,
    verifyPassword,
    createAccessToken,
    verifyToken,
    extractToken,
    getAuthenticatedAdmin,
    requireWebAdmin,
    requireAdminRequire,
    requireAdminAuth: requireAdminRequire,
    generateDeviceToken
};


