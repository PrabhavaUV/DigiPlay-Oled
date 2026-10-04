const express = require('express');
const { Device } = require('../models');
const { requireAdminRequire, generateDeviceToken } = require('../auth');
require('dotenv').config();

const router = express.Router();
const APP_API_KEY = process.env.APP_API_KEY || 'my-mobile-app-static-key';

/**
 * Middleware: allowAdminOrApp
 * Allows access if either a valid Admin JWT is present OR the static Mobile App API Key.
 */
function allowAdminOrApp(req, res, next) {
    const key = req.headers['x-api-key'];
    if (key === APP_API_KEY) {
        return next();
    }
    return requireAdminRequire(req, res, next);
}

/**
 * GET /api/devices
 * Lists all registered devices.
 */
router.get('/', requireAdminRequire, async (req, res) => {
    const devices = await Device.findAll();
    res.json(devices);
});

/**
 * POST /api/devices
 * Registers a new device and generates its unique token.
 * Supports both JSON API requests and HTML form submissions.
 */
router.post('/', requireAdminRequire, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ detail: "Device name is required" });

    const { raw, hashed } = generateDeviceToken();
    const newDevice = await Device.create({
        name,
        description: description || '',
        device_token: hashed
    });

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect(`/devices?new_id=${newDevice.id}&token=${raw}`);
    }

    const result = newDevice.toJSON();
    result.raw_token = raw;
    res.status(201).json(result);
});

/**
 * GET /api/devices/:id
 * Fetches details for a specific device. Used by mobile app & admin.
 */
router.get('/:id', allowAdminOrApp, async (req, res) => {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ detail: "Device not found" });
    res.json(device);
});

/**
 * PUT /api/devices/:id
 * Updates device metadata.
 */
router.put('/:id', requireAdminRequire, async (req, res) => {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ detail: "Device not found" });
    
    const { name, description } = req.body;
    if (name) device.name = name;
    if (description !== undefined) device.description = description;
    
    await device.save();
    res.json(device);
});

/**
 * POST /api/devices/:id/push
 * Pushes new display content to hardware immediately via MQTT.
 */
router.post('/:id/push', requireAdminRequire, async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ detail: "Content is required" });

    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ detail: "Device not found" });

    device.current_content = content;
    await device.save();

    const aedes = req.app.get('mqtt');
    if (aedes) {
        const payload = JSON.stringify({
            content,
            checksum: Date.now().toString().substring(0, 8)
        });
        aedes.publish({
            topic: `digiplay/devices/${device.id}/content`,
            payload,
            qos: 1,
            retain: true
        });
    }

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/devices');
    }
    res.json({ message: "Content pushed successfully", content });
});

/**
 * DELETE /api/devices/:id
 * Removes a device from the system.
 */
router.delete('/:id', requireAdminRequire, async (req, res) => {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ detail: "Device not found" });
    await device.destroy();
    res.json({ message: "Device successfully removed" });
});

/**
 * POST /api/devices/:id/delete
 * HTML form fallback for deleting a device.
 */
router.post('/:id/delete', requireAdminRequire, async (req, res) => {
    const device = await Device.findByPk(req.params.id);
    if (device) await device.destroy();
    res.redirect('/devices');
});

module.exports = router;


