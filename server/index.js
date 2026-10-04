const express = require('express');
const nunjucks = require('nunjucks');
const aedes = require('aedes')();
const net = require('net');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./database');
const { UpdateRequest, Device, Admin } = require('./models');
const { 
    requireWebAdmin, 
    getAuthenticatedAdmin, 
    verifyPassword, 
    createAccessToken 
} = require('./auth');


/**
 * -------------------------------------------------------------------
 * MQTT BROKER CONFIGURATION
 * -------------------------------------------------------------------
 * We use Aedes as our embedded MQTT broker to handle real-time 
 * communication with the ESP32 hardware displays.
 */
const mqttServer = net.createServer(aedes.handle);
const mqttPort = 1883;

mqttServer.listen(mqttPort, '0.0.0.0', () => {
    console.log(`[MQTT] Broker is running on port ${mqttPort}`);
});

/**
 * -------------------------------------------------------------------
 * EXPRESS APP CONFIGURATION
 * -------------------------------------------------------------------
 */
const app = express();
app.set('mqtt', aedes); // Make aedes accessible in routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'static')));

// Configure Templating Engine (Nunjucks)
nunjucks.configure('templates', {
    autoescape: true,
    express: app,
    noCache: true
});
app.set('view engine', 'html');

/**
 * -------------------------------------------------------------------
 * MQTT EVENT HANDLERS (Presence Logic)
 * -------------------------------------------------------------------
 */
aedes.on('clientReady', async (client) => {
    console.log(`[MQTT] Presence: Client ${client.id} connected`);
    if (client.id.startsWith('DigiPlayClient-')) {
        const deviceId = client.id.replace('DigiPlayClient-', '');
        try {
            const device = await Device.findByPk(deviceId);
            if (device) {
                device.is_online = true;
                device.last_seen = new Date();
                await device.save();
                console.log(`[Presence] Device ${deviceId} is now ONLINE`);
            }
        } catch (err) {
            console.error(`[Presence] Error updating device ${deviceId}:`, err);
        }
    }
});

aedes.on('clientDisconnect', async (client) => {
    if (client.id && client.id.startsWith('DigiPlayClient-')) {
        const deviceId = client.id.replace('DigiPlayClient-', '');
        try {
            const device = await Device.findByPk(deviceId);
            if (device) {
                device.is_online = false;
                await device.save();
                console.log(`[Presence] Device ${deviceId} is now OFFLINE`);
            }
        } catch (err) {
            console.error(`[Presence] Error updating disconnect status for ${deviceId}:`, err);
        }
    }
});

/**
 * -------------------------------------------------------------------
 * SYSTEM ROUTES & ENDPOINTS
 * -------------------------------------------------------------------
 */

// API Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/requests', require('./routes/requests'));


// UI Routes (Web Dashboard)
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
    res.render('login.html', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).render('login.html', {
                error: 'Please enter both username and password.',
                username: username || ''
            });
        }

        const admin = await Admin.findOne({ where: { username } });
        if (!admin || !(await verifyPassword(password, admin.password_hash))) {
            return res.status(401).render('login.html', {
                error: 'Invalid username or password.',
                username
            });
        }

        const token = createAccessToken({ sub: admin.username });
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.redirect('/dashboard');
    } catch (error) {
        console.error('[Login] Error authenticating admin:', error);
        return res.status(500).render('login.html', {
            error: 'Authentication failed due to an internal server error.',
            username
        });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.redirect('/login');
});

// Mobile App REST Auth handler
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ where: { username } });
        if (!admin || !(await verifyPassword(password, admin.password_hash))) {
            return res.status(401).json({ detail: "Invalid credentials" });
        }
        const token = createAccessToken({ sub: admin.username });
        res.json({ access_token: token });
    } catch (error) {
        res.status(500).json({ detail: "Authentication error" });
    }
});

app.get('/dashboard', requireWebAdmin, async (req, res) => {
    const device_count = await Device.count();
    const online_count = await Device.count({ where: { is_online: true } });
    const pending_requests = await UpdateRequest.findAll({
        where: { status: 'PENDING' },
        include: [{ model: Device, as: 'device' }]
    });
    res.render('dashboard.html', { 
        admin: req.admin,
        device_count, 
        online_count, 
        pending_requests 
    });
});

app.get('/devices', requireWebAdmin, async (req, res) => {
    const devices = await Device.findAll();
    res.render('devices.html', {
        admin: req.admin,
        devices,
        new_device_id: req.query.new_id,
        raw_token: req.query.token
    });
});

app.get('/requests', requireWebAdmin, async (req, res) => {
    const requests = await UpdateRequest.findAll({
        include: [{ model: Device, as: 'device' }],
        order: [['created_at', 'DESC']]
    });
    res.render('requests.html', { 
        admin: req.admin,
        requests 
    });
});

/**
 * -------------------------------------------------------------------
 * DATABASE INITIALIZATION & SERVER START
 * -------------------------------------------------------------------
 */
db.sync({ alter: false }).then(async () => {
    // Maintenance: Reset all devices to offline on startup
    await Device.update({ is_online: false }, { where: {} });
    console.log('[DB] Database synchronized. System ready.');

    app.listen(8000, () => {
        console.log('--------------------------------------------------');
        console.log('🚀 DigiPlay Platform: http://localhost:8000');
        console.log('📁 Admin Credentials: Run npm run seed');
        console.log('--------------------------------------------------');
    });
}).catch(err => {
    console.error('[DB] Synchronization failed:', err.message);
});

