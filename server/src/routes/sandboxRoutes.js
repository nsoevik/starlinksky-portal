const sandboxController = require('../controllers/sandboxController');

const express = require('express');

const router = express.Router();

router.post('/sandbox/client', sandboxController.unsandboxClient);

module.exports = router;
