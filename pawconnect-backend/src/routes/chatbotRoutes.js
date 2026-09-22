const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middlewares/authMiddleware');

// Using protect middleware so only authenticated users can chat with AI,
// or we can leave it public. Let's make it public for general site inquiries,
// but we could apply a strict rate limit here.
router.post('/', chatbotController.handleChatbotMessage);

module.exports = router;
