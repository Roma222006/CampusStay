const express = require('express');
const router = express.Router();
const PollController = require('../controllers/PollController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, PollController.getPolls);
router.post('/vote/:pollId', authenticate, PollController.castVote);
router.post('/create', authenticate, authorize(['Admin', 'Warden']), PollController.createPoll);
router.put('/close/:pollId', authenticate, authorize(['Admin']), PollController.closePoll);

module.exports = router;
