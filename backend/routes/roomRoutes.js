const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/RoomController');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard & Room listing
router.get('/dashboard/metrics', authenticate, RoomController.getDashboardMetrics);
router.get('/block-stats', authenticate, RoomController.getBlockStats);
router.get('/roommate-radar', authenticate, RoomController.getRoommateCompatibilityRadar);
router.get('/', authenticate, RoomController.getRooms);

// Blocks
router.get('/blocks', authenticate, RoomController.getBlocks);
router.post('/blocks', authenticate, authorize(['Admin']), RoomController.createBlock);
router.delete('/blocks/:id', authenticate, authorize(['Admin']), RoomController.deleteBlock);

// Room CRUD
router.post('/', authenticate, authorize(['Admin']), RoomController.createRoom);
router.put('/:id/update', authenticate, authorize(['Admin']), RoomController.updateRoom);
router.put('/:roomId/status', authenticate, authorize(['Admin', 'Warden']), RoomController.updateRoomStatus);
router.delete('/:id', authenticate, authorize(['Admin']), RoomController.deleteRoom);

// Allocation actions (Admin)
router.post('/allocate', authenticate, authorize(['Admin']), RoomController.allocateStudent);
router.post('/auto-allocate', authenticate, authorize(['Admin']), RoomController.autoAllocateAll);
router.post('/transfer', authenticate, authorize(['Admin']), RoomController.transferStudent);
router.post('/swap', authenticate, authorize(['Admin']), RoomController.swapStudents);
router.post('/deallocate', authenticate, authorize(['Admin', 'Warden']), RoomController.deallocateStudent);

// Student requests & Warden reviews
router.post('/change-request', authenticate, authorize(['Student']), RoomController.requestRoomChange);
router.post('/swap-request', authenticate, authorize(['Student']), RoomController.requestRoomSwap);
router.post('/allocation-request', authenticate, authorize(['Student']), RoomController.requestRoomAllocation);
router.get('/requests', authenticate, authorize(['Warden', 'Admin']), RoomController.getRoomRequests);
router.put('/requests/:requestId/review', authenticate, authorize(['Warden', 'Admin']), RoomController.reviewRoomRequest);

module.exports = router;
