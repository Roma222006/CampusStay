const Room = require('../models/Room');
const Student = require('../models/Student');
const HostelBlock = require('../models/HostelBlock');
const Notification = require('../models/Notification');
const RoomRequest = require('../models/RoomRequest');
const { createNotification } = require('../utils/notificationHelper');

const RoomController = {
  // 1. Get Occupancy Dashboard Metrics
  getDashboardMetrics: async (req, res) => {
    try {
      const blocks = await HostelBlock.find();
      const rooms = await Room.find();
      
      let totalBeds = 0;
      let occupiedBeds = 0;
      let emptyRoomsCount = 0;
      let partialRoomsCount = 0;
      let fullRoomsCount = 0;
      let maintenanceRoomsCount = 0;
      let totalFloors = 0;

      blocks.forEach(b => {
        totalFloors += b.totalFloors;
      });

      rooms.forEach(r => {
        totalBeds += r.capacity;
        occupiedBeds += r.occupiedBeds;

        if (r.status === 'Maintenance') {
          maintenanceRoomsCount++;
        } else if (r.occupiedBeds === 0) {
          emptyRoomsCount++;
        } else if (r.occupiedBeds === r.capacity) {
          fullRoomsCount++;
        } else {
          partialRoomsCount++;
        }
      });

      const vacantBeds = totalBeds - occupiedBeds;
      const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

      return res.status(200).json({
        totalBlocks: blocks.length,
        totalFloors,
        totalRooms: rooms.length,
        totalBedCapacity: totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyPercentage: Number(occupancyRate),
        emptyRooms: emptyRoomsCount,
        partialRooms: partialRoomsCount,
        fullRooms: fullRoomsCount,
        maintenanceRooms: maintenanceRoomsCount,
        rooms: rooms
      });
    } catch (error) {
      console.error('Error fetching occupancy metrics:', error);
      return res.status(500).json({ message: 'Server error fetching occupancy dashboard.' });
    }
  },

  // 2. Create Hostel Block
  createBlock: async (req, res) => {
    try {
      const { name, totalFloors, description } = req.body;
      if (!name || !totalFloors) {
        return res.status(400).json({ message: 'Block name and total floors are required.' });
      }

      const existing = await HostelBlock.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ message: 'Hostel Block already exists.' });
      }

      const block = new HostelBlock({ name: name.trim(), totalFloors, description });
      await block.save();
      return res.status(201).json({ message: 'Hostel block created successfully.', block });
    } catch (error) {
      console.error('Create block error:', error);
      return res.status(500).json({ message: 'Server error creating block.' });
    }
  },

  getBlocks: async (req, res) => {
    try {
      const blocks = await HostelBlock.find();
      return res.status(200).json(blocks);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching blocks.' });
    }
  },

  // Get all rooms with optional filters: block, floor, status, type, search
  getRooms: async (req, res) => {
    try {
      const { hostelBlock, floor, status, roomType, search } = req.query;
      const filter = {};
      if (hostelBlock) filter.hostelBlock = hostelBlock;
      if (floor !== undefined && floor !== '') filter.floor = Number(floor);
      if (status) filter.status = status;
      if (roomType) filter.roomType = roomType;

      let rooms = await Room.find(filter)
        .populate('currentStudents', 'name registerNumber department phone')
        .sort({ hostelBlock: 1, floor: 1, roomNumber: 1 })
        .lean();

      if (search) {
        const q = search.toLowerCase();
        rooms = rooms.filter(r =>
          r.roomNumber.toLowerCase().includes(q) ||
          r.hostelBlock.toLowerCase().includes(q) ||
          r.currentStudents?.some(s => s.name?.toLowerCase().includes(q) || s.registerNumber?.toLowerCase().includes(q))
        );
      }

      return res.status(200).json(rooms);
    } catch (error) {
      console.error('Get rooms error:', error);
      return res.status(500).json({ message: 'Error fetching rooms.' });
    }
  },

  deleteBlock: async (req, res) => {
    try {
      const { id } = req.params;
      const block = await HostelBlock.findById(id);
      if (!block) return res.status(404).json({ message: 'Block not found.' });

      await Room.deleteMany({ hostelBlock: block.name });
      await HostelBlock.findByIdAndDelete(id);

      return res.status(200).json({ message: 'Hostel block and associated rooms deleted.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting block.' });
    }
  },

  // 3. Manage Rooms
  createRoom: async (req, res) => {
    try {
      const { roomNumber, hostelBlock, floor, roomType, restroomType } = req.body;
      if (!roomNumber || !hostelBlock || floor === undefined || !roomType) {
        return res.status(400).json({ message: 'Missing required room fields.' });
      }

      const blockExists = await HostelBlock.findOne({ name: hostelBlock });
      if (!blockExists) {
        return res.status(400).json({ message: `Hostel block '${hostelBlock}' does not exist.` });
      }

      const existingRoom = await Room.findOne({ roomNumber, hostelBlock });
      if (existingRoom) {
        return res.status(400).json({ message: `Room ${roomNumber} already exists in ${hostelBlock}.` });
      }

      const room = new Room({ roomNumber, hostelBlock, floor, roomType, restroomType });
      await room.save();

      return res.status(201).json({ message: 'Room created successfully.', room });
    } catch (error) {
      console.error('Create room error:', error);
      return res.status(500).json({ message: 'Server error creating room.' });
    }
  },

  updateRoomStatus: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { status } = req.body;

      const room = await Room.findById(roomId);
      if (!room) return res.status(404).json({ message: 'Room not found.' });

      room.status = status;
      await room.save();

      return res.status(200).json({ message: `Room status updated to ${status}.`, room });
    } catch (error) {
      return res.status(500).json({ message: 'Server error updating room.' });
    }
  },

  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const room = await Room.findById(id);
      if (!room) return res.status(404).json({ message: 'Room not found.' });

      if (room.occupiedBeds > 0) {
        return res.status(400).json({ message: 'Cannot delete room with active occupants.' });
      }

      await Room.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Room deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting room.' });
    }
  },

  // 4. SMART ROOM ALLOCATION ALGORITHM
  allocateStudent: async (req, res) => {
    try {
      const { studentId } = req.body;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      if (student.room) {
        return res.status(400).json({ message: 'Student is already allocated to a room.' });
      }

      const hostelBlock = student.hostelBlock;

      // Friend Request (Mutual compatibility override)
      const friendReg = student.preferences.friendRequestRegisterNumber;
      if (friendReg) {
        const friend = await Student.findOne({ registerNumber: friendReg.trim() });
        if (friend && friend.preferences.friendRequestRegisterNumber === student.registerNumber) {
          if (friend.room) {
            const fRoom = await Room.findById(friend.room);
            if (fRoom && fRoom.hostelBlock === hostelBlock && fRoom.occupiedBeds < fRoom.capacity && fRoom.status === 'Available') {
              fRoom.currentStudents.push(student._id);
              fRoom.occupiedBeds += 1;
              await fRoom.save();

              student.room = fRoom._id;
              student.allocatedAt = new Date();
              await student.save();

              await createNotification(student._id, 'Student', 'Room Allocated (Mutual Match)', `Allocated Room ${fRoom.roomNumber} in ${fRoom.hostelBlock} with friend ${friend.name}.`, 'room');
              return res.status(200).json({ message: `Mutual Match! Allocated Room ${fRoom.roomNumber} with friend.`, room: fRoom });
            }
          } else {
            const reqSharing = student.preferences.roomSharing;
            const sharedRoom = await Room.findOne({ hostelBlock, roomType: reqSharing, status: 'Available', occupiedBeds: 0 });

            if (sharedRoom && sharedRoom.capacity >= 2) {
              sharedRoom.currentStudents.push(student._id, friend._id);
              sharedRoom.occupiedBeds += 2;
              await sharedRoom.save();

              student.room = sharedRoom._id;
              student.allocatedAt = new Date();
              await student.save();

              friend.room = sharedRoom._id;
              friend.allocatedAt = new Date();
              await friend.save();

              await createNotification(student._id, 'Student', 'Room Allocated (Mutual Match)', `Allocated Room ${sharedRoom.roomNumber} in ${sharedRoom.hostelBlock} with friend ${friend.name}.`, 'room');
              await createNotification(friend._id, 'Student', 'Room Allocated (Mutual Match)', `Allocated Room ${sharedRoom.roomNumber} in ${sharedRoom.hostelBlock} with friend ${student.name}.`, 'room');

              return res.status(200).json({ message: `Mutual Match! Allocated Room ${sharedRoom.roomNumber} for both students.`, room: sharedRoom });
            }
          }
        }
      }

      // Compatibility Score Matching
      const rooms = await Room.find({ hostelBlock, status: 'Available' });
      if (rooms.length === 0) {
        return res.status(404).json({ message: 'No available rooms in the selected hostel block.' });
      }

      let bestRoom = null;
      let highestScore = -1;

      for (const room of rooms) {
        if (room.occupiedBeds >= room.capacity) continue;

        // Strict Gender Segregation: Check existing room occupants
        if (room.occupiedBeds > 0) {
          const occupants = await Student.find({ _id: { $in: room.currentStudents } });
          const studentGender = student.gender || (student.hostelBlock === 'Gargi Block' ? 'Female' : 'Male');
          const hasGenderMismatch = occupants.some(occ => {
            const occGender = occ.gender || (occ.hostelBlock === 'Gargi Block' ? 'Female' : 'Male');
            return occGender && studentGender && occGender !== studentGender;
          });
          if (hasGenderMismatch) {
            continue; // Strictly skip rooms with different gender occupants
          }
        }

        let roomScore = 0;

        const restroomPref = student.preferences.restroomPreference;
        if (restroomPref === 'No Preference') roomScore += 10;
        else if (restroomPref === 'Attached Restroom' && room.restroomType === 'Attached') roomScore += 10;
        else if (restroomPref === 'Common Restroom' && room.restroomType === 'Common') roomScore += 10;

        const floorPref = student.preferences.preferredFloor;
        if (floorPref === 'No Preference') roomScore += 5;
        else if (floorPref === 'Ground' && room.floor === 0) roomScore += 5;
        else if (floorPref === 'First' && room.floor === 1) roomScore += 5;
        else if (floorPref === 'Second' && room.floor === 2) roomScore += 5;

        if (student.preferences.roomSharing === room.roomType) roomScore += 10;

        if (room.occupiedBeds > 0) {
          let compatibilitySum = 0;
          const occupants = await Student.find({ _id: { $in: room.currentStudents } });
          
          occupants.forEach(occ => {
            let sScore = 0;
            const p1 = student.preferences;
            const p2 = occ.preferences;

            if (p1.sleepingTime === p2.sleepingTime) sScore += 15;
            if (p1.wakeUpTime === p2.wakeUpTime) sScore += 15;
            if (p1.studyEnvironment === p2.studyEnvironment) sScore += 15;
            if (p1.cleanliness === p2.cleanliness) sScore += 15;
            if (p1.visitorPreference === p2.visitorPreference) sScore += 10;
            if (p1.preferredLanguage === p2.preferredLanguage) sScore += 15;

            compatibilitySum += sScore;
          });

          const avgComp = compatibilitySum / occupants.length;
          roomScore += avgComp;
        } else {
          roomScore += 60;
        }

        if (roomScore > highestScore) {
          highestScore = roomScore;
          bestRoom = room;
        }
      }

      if (!bestRoom) {
        return res.status(400).json({ message: 'Could not allocate a matching room.' });
      }

      bestRoom.currentStudents.push(student._id);
      bestRoom.occupiedBeds += 1;
      await bestRoom.save();

      student.room = bestRoom._id;
      student.allocatedAt = new Date();
      await student.save();

      await createNotification(student._id, 'Student', 'Room Allocated', `Allocated Room ${bestRoom.roomNumber} in ${bestRoom.hostelBlock} with compatibility score of ${highestScore.toFixed(0)}%.`, 'room');

      return res.status(200).json({ message: `Successfully allocated Room ${bestRoom.roomNumber} (Score: ${highestScore.toFixed(0)}%)`, room: bestRoom, score: highestScore });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error during allocation.' });
    }
  },

  autoAllocateAll: async (req, res) => {
    try {
      const students = await Student.find({ room: null, studentType: 'Hosteller' });
      let allocatedCount = 0;

      for (const s of students) {
        const responseMock = { status: function() { return this; }, json: function() { return this; } };
        await RoomController.allocateStudent({ body: { studentId: s._id } }, responseMock);
        allocatedCount++;
      }

      return res.status(200).json({ message: `Auto allocation complete. Assigned ${allocatedCount} students.` });
    } catch (error) {
      return res.status(500).json({ message: 'Error during bulk auto allocation.' });
    }
  },

  // 5. Manual Override & Transfer (Admin only)
  transferStudent: async (req, res) => {
    try {
      const { studentId, targetRoomId } = req.body;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      const targetRoom = await Room.findById(targetRoomId);
      if (!targetRoom) return res.status(404).json({ message: 'Target room not found.' });

      if (targetRoom.occupiedBeds >= targetRoom.capacity) {
        return res.status(400).json({ message: 'Target room has no vacancy.' });
      }

      if (student.room) {
        const oldRoom = await Room.findById(student.room);
        if (oldRoom) {
          oldRoom.currentStudents = oldRoom.currentStudents.filter(id => id.toString() !== student._id.toString());
          oldRoom.occupiedBeds = Math.max(0, oldRoom.occupiedBeds - 1);
          await oldRoom.save();
        }
      }

      targetRoom.currentStudents.push(student._id);
      targetRoom.occupiedBeds += 1;
      await targetRoom.save();

      student.room = targetRoom._id;
      await student.save();

      await createNotification(student._id, 'Student', 'Room Transferred', `Admin has manually transferred you to Room ${targetRoom.roomNumber} in ${targetRoom.hostelBlock}.`, 'room');

      return res.status(200).json({ message: 'Student transferred successfully.', room: targetRoom });
    } catch (error) {
      return res.status(500).json({ message: 'Server error during transfer.' });
    }
  },

  // Manual Override Swap (Admin only)
  swapStudents: async (req, res) => {
    try {
      const { studentId1, studentId2 } = req.body;
      const s1 = await Student.findById(studentId1);
      const s2 = await Student.findById(studentId2);

      if (!s1 || !s2) return res.status(404).json({ message: 'One or both students not found.' });
      if (!s1.room || !s2.room) return res.status(400).json({ message: 'Both students must have room allocations to perform swap.' });

      const room1 = await Room.findById(s1.room);
      const room2 = await Room.findById(s2.room);

      if (!room1 || !room2) return res.status(404).json({ message: 'Rooms not found.' });

      room1.currentStudents = room1.currentStudents.map(id => id.toString() === s1._id.toString() ? s2._id : id);
      room2.currentStudents = room2.currentStudents.map(id => id.toString() === s2._id.toString() ? s1._id : id);

      await room1.save();
      await room2.save();

      const tempRoom = s1.room;
      s1.room = s2.room;
      s2.room = tempRoom;

      await s1.save();
      await s2.save();

      await createNotification(s1._id, 'Student', 'Room Swap Completed', `Your room has been swapped with ${s2.name}. You are now in Room ${room2.roomNumber}.`, 'room');
      await createNotification(s2._id, 'Student', 'Room Swap Completed', `Your room has been swapped with ${s1.name}. You are now in Room ${room1.roomNumber}.`, 'room');

      return res.status(200).json({ message: 'Students swapped successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error during swap.' });
    }
  },

  // 6. STUDENT SWAP / CHANGE REQUESTS SAVED IN DB
  requestRoomChange: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { reason, preferredBlock, preferredRoomType } = req.body;

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      const request = new RoomRequest({
        student: studentId,
        requestType: 'Change',
        preferredBlock: preferredBlock || student.hostelBlock,
        preferredRoomType: preferredRoomType || 'Double',
        reason
      });
      await request.save();

      await createNotification(
        student.hostelBlock,
        'Warden',
        'Room Change Request Raised',
        `Student ${student.name} (${student.registerNumber}) raised Room Change request. Reason: ${reason}`,
        'room'
      );

      return res.status(201).json({ message: 'Room change request submitted successfully to Warden.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error submitting change request.' });
    }
  },

  requestRoomSwap: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { targetRegisterNumber } = req.body;

      const student = await Student.findById(studentId);
      const targetStudent = await Student.findOne({ registerNumber: targetRegisterNumber });

      if (!targetStudent) {
        return res.status(404).json({ message: 'Target friend student not found.' });
      }

      if (!student.room || !targetStudent.room) {
        return res.status(400).json({ message: 'Both you and your friend must have room allocations to request swap.' });
      }

      const request = new RoomRequest({
        student: studentId,
        requestType: 'Swap',
        targetStudent: targetStudent._id,
        reason: `Roommate swap request between ${student.name} and ${targetStudent.name}`
      });
      await request.save();

      await createNotification(
        student.hostelBlock,
        'Warden',
        'Room Swap Request Raised',
        `Room Swap requested between ${student.name} (${student.registerNumber}) and ${targetStudent.name} (${targetStudent.registerNumber}).`,
        'room'
      );

      return res.status(201).json({ message: `Room swap request with ${targetStudent.name} submitted to Warden.` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error submitting swap request.' });
    }
  },

  // 7. WARDEN REVIEW OF STUDENT REQUESTS
  getRoomRequests: async (req, res) => {
    try {
      const { role, hostelBlock } = req.user;
      let filter = {};

      if (role === 'Warden' && hostelBlock) {
        // Find students belonging to warden's block
        const students = await Student.find({ hostelBlock });
        filter.student = { $in: students.map(s => s._id) };
      }

      const requests = await RoomRequest.find(filter)
        .populate({
          path: 'student',
          select: 'name registerNumber department hostelBlock room',
          populate: { path: 'room', select: 'roomNumber' }
        })
        .populate({
          path: 'targetStudent',
          select: 'name registerNumber department hostelBlock room',
          populate: { path: 'room', select: 'roomNumber' }
        })
        .sort({ createdAt: -1 })
        .exec();

      return res.status(200).json(requests);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error retrieving room requests.' });
    }
  },

  reviewRoomRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status, remarks } = req.body; // status: 'Approved' or 'Rejected'

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Choose Approved or Rejected.' });
      }

      const request = await RoomRequest.findById(requestId);
      if (!request) return res.status(404).json({ message: 'Request not found.' });

      if (request.status !== 'Pending') {
        return res.status(400).json({ message: 'This request has already been reviewed.' });
      }

      if (status === 'Approved') {
        // Execute automatic database allocations adjustments
        if (request.requestType === 'Swap') {
          const s1 = await Student.findById(request.student);
          const s2 = await Student.findById(request.targetStudent);

          if (!s1 || !s2) return res.status(404).json({ message: 'Students involved in swap not found.' });
          if (!s1.room || !s2.room) return res.status(400).json({ message: 'Both students must have rooms allocated to complete swap.' });

          const room1 = await Room.findById(s1.room);
          const room2 = await Room.findById(s2.room);

          if (!room1 || !room2) return res.status(404).json({ message: 'Rooms not found.' });

          // Swap occupants arrays in rooms
          room1.currentStudents = room1.currentStudents.map(id => id.toString() === s1._id.toString() ? s2._id : id);
          room2.currentStudents = room2.currentStudents.map(id => id.toString() === s2._id.toString() ? s1._id : id);

          await room1.save();
          await room2.save();

          // Swap references in student documents
          const temp = s1.room;
          s1.room = s2.room;
          s2.room = temp;

          await s1.save();
          await s2.save();

          await createNotification(s1._id, 'Student', 'Room Swap Approved', `Warden approved your room swap. You are now in Room ${room2.roomNumber}.`, 'room');
          await createNotification(s2._id, 'Student', 'Room Swap Approved', `Warden approved your room swap. You are now in Room ${room1.roomNumber}.`, 'room');
        } 
        else if (request.requestType === 'Change') {
          const student = await Student.findById(request.student);
          if (!student) return res.status(404).json({ message: 'Student not found.' });

          // Find available room in preferred configuration
          const targetRoom = await Room.findOne({
            hostelBlock: request.preferredBlock,
            roomType: request.preferredRoomType,
            status: 'Available',
            occupiedBeds: { $lt: 2 } // Check vacancy
          });

          if (targetRoom) {
            // Free old room
            if (student.room) {
              const oldRoom = await Room.findById(student.room);
              if (oldRoom) {
                oldRoom.currentStudents = oldRoom.currentStudents.filter(id => id.toString() !== student._id.toString());
                oldRoom.occupiedBeds = Math.max(0, oldRoom.occupiedBeds - 1);
                await oldRoom.save();
              }
            }

            // Assign to new room
            targetRoom.currentStudents.push(student._id);
            targetRoom.occupiedBeds += 1;
            await targetRoom.save();

            student.room = targetRoom._id;
            student.hostelBlock = request.preferredBlock;
            await student.save();

            await createNotification(student._id, 'Student', 'Room Change Approved', `Warden approved change. Allocated Room ${targetRoom.roomNumber} in ${targetRoom.hostelBlock}.`, 'room');
          } else {
            // If no vacant room matches, we approve the request but leave allocation manual for warden/admin transfer override
            await createNotification(student._id, 'Student', 'Room Change Verified', `Warden approved change request. Room placement pending manual allocation.`, 'room');
          }
        }
        else if (request.requestType === 'Allocation') {
          const student = await Student.findById(request.student);
          if (!student) return res.status(404).json({ message: 'Student not found.' });
          if (student.room) return res.status(400).json({ message: 'Student is already allocated a room.' });

          // Find available rooms in preferredBlock
          const block = request.preferredBlock || student.hostelBlock || 'Aryabhata Block';
          const rooms = await Room.find({ hostelBlock: block, status: 'Available' });

          if (rooms.length === 0) {
            return res.status(404).json({ message: `No available rooms in block ${block}.` });
          }

          let bestRoom = null;
          let highestScore = -1;

          for (const room of rooms) {
            if (room.occupiedBeds >= room.capacity) continue;

            let roomScore = 0;

            const restroomPref = student.preferences.restroomPreference;
            if (restroomPref === 'No Preference') roomScore += 10;
            else if (restroomPref === 'Attached Restroom' && room.restroomType === 'Attached') roomScore += 10;
            else if (restroomPref === 'Common Restroom' && room.restroomType === 'Common') roomScore += 10;

            const floorPref = student.preferences.preferredFloor;
            if (floorPref === 'No Preference') roomScore += 5;
            else if (floorPref === 'Ground' && room.floor === 0) roomScore += 5;
            else if (floorPref === 'First' && room.floor === 1) roomScore += 5;
            else if (floorPref === 'Second' && room.floor === 2) roomScore += 5;

            if (request.preferredRoomType === room.roomType) roomScore += 10;

            if (room.occupiedBeds > 0) {
              let compatibilitySum = 0;
              const occupants = await Student.find({ _id: { $in: room.currentStudents } });
              
              occupants.forEach(occ => {
                let sScore = 0;
                const p1 = student.preferences;
                const p2 = occ.preferences;

                if (p1.sleepingTime === p2.sleepingTime) sScore += 15;
                if (p1.wakeUpTime === p2.wakeUpTime) sScore += 15;
                if (p1.studyEnvironment === p2.studyEnvironment) sScore += 15;
                if (p1.cleanliness === p2.cleanliness) sScore += 15;
                if (p1.visitorPreference === p2.visitorPreference) sScore += 10;
                if (p1.preferredLanguage === p2.preferredLanguage) sScore += 15;

                compatibilitySum += sScore;
              });

              const avgComp = compatibilitySum / occupants.length;
              roomScore += avgComp;
            } else {
              roomScore += 60;
            }

            if (roomScore > highestScore) {
              highestScore = roomScore;
              bestRoom = room;
            }
          }

          if (!bestRoom) {
            return res.status(400).json({ message: 'Could not allocate a matching room.' });
          }

          bestRoom.currentStudents.push(student._id);
          bestRoom.occupiedBeds += 1;
          await bestRoom.save();

          student.room = bestRoom._id;
          student.hostelBlock = block;
          student.allocatedAt = new Date();
          await student.save();

          await createNotification(
            student._id,
            'Student',
            'Room Allocated via Request',
            `Warden approved allocation. Assigned Room ${bestRoom.roomNumber} in ${bestRoom.hostelBlock}.`,
            'room'
          );
        }
      } else {
        // Rejected
        await createNotification(request.student, 'Student', 'Room Request Rejected', `Warden rejected your room request. Remarks: ${remarks || 'None'}`, 'room');
      }

      request.status = status;
      request.wardenRemarks = remarks || '';
      await request.save();

      return res.status(200).json({ message: `Request successfully ${status}.`, request });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error reviewing request.' });
    }
  },

  requestRoomAllocation: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { preferredBlock, preferredRoomType, reason, preferences } = req.body;

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      if (student.studentType === 'Dayscholar') {
        return res.status(400).json({ message: 'Dayscholars do not require hostel room allocation.' });
      }

      if (student.room) {
        return res.status(400).json({ message: 'You already have an allocated room.' });
      }

      // Check if there is already a pending allocation request
      const existing = await RoomRequest.findOne({ student: studentId, requestType: 'Allocation', status: 'Pending' });
      if (existing) {
        return res.status(400).json({ message: 'You already have a pending room allocation request.' });
      }

      // If preferences are sent, update the student model first so the allocation algorithm uses them
      if (preferences) {
        student.preferences = { ...student.preferences, ...preferences };
        await student.save();
      }

      const request = new RoomRequest({
        student: studentId,
        requestType: 'Allocation',
        preferredBlock: preferredBlock || student.hostelBlock || '',
        preferredRoomType: preferredRoomType || 'Double',
        reason: reason || 'Initial room allocation preference request.'
      });
      await request.save();

      // Notify warden of student's block
      await createNotification(
        preferredBlock || 'Aryabhata Block',
        'Warden',
        'New Room Allocation Request',
        `Student ${student.name} requested room allocation in ${preferredBlock || 'Aryabhata Block'}.`,
        'room'
      );

      return res.status(201).json({ message: 'Room allocation request submitted successfully.', request });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error requesting room allocation.' });
    }
  },

  // 8. Update Room Details (Admin only)
  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const { roomNumber, hostelBlock, floor, roomType, restroomType, maintenanceNote } = req.body;

      const room = await Room.findById(id);
      if (!room) return res.status(404).json({ message: 'Room not found.' });

      if (roomNumber) room.roomNumber = roomNumber;
      if (hostelBlock) room.hostelBlock = hostelBlock;
      if (floor !== undefined) room.floor = floor;
      if (roomType) room.roomType = roomType;
      if (restroomType) room.restroomType = restroomType;
      if (maintenanceNote !== undefined) room.maintenanceNote = maintenanceNote;

      await room.save();
      return res.status(200).json({ message: 'Room updated successfully.', room });
    } catch (error) {
      console.error('Update room error:', error);
      return res.status(500).json({ message: 'Server error updating room.' });
    }
  },

  // 9. Deallocate Student from Room (Admin/Warden only)
  deallocateStudent: async (req, res) => {
    try {
      const { studentId } = req.body;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });
      if (!student.room) return res.status(400).json({ message: 'Student is not allocated to any room.' });

      const room = await Room.findById(student.room);
      if (room) {
        room.currentStudents = room.currentStudents.filter(id => id.toString() !== student._id.toString());
        room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
        await room.save();
      }

      student.room = null;
      student.allocatedAt = null;
      await student.save();

      await createNotification(student._id, 'Student', 'Room Deallocated', 'You have been removed from your room allocation.', 'room');
      return res.status(200).json({ message: 'Student deallocated from room successfully.' });
    } catch (error) {
      console.error('Deallocate error:', error);
      return res.status(500).json({ message: 'Server error during deallocation.' });
    }
  },

  // 10. Get Per-Block Occupancy Stats (for charts)
  getBlockStats: async (req, res) => {
    try {
      const blocks = await HostelBlock.find().lean();
      const rooms = await Room.find().lean();

      const blockStats = blocks.map(block => {
        const blockRooms = rooms.filter(r => r.hostelBlock === block.name);
        const totalBeds = blockRooms.reduce((sum, r) => sum + r.capacity, 0);
        const occupied = blockRooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
        const available = blockRooms.filter(r => r.status === 'Available').length;
        const full = blockRooms.filter(r => r.status === 'Full' || r.occupiedBeds >= r.capacity).length;
        const maintenance = blockRooms.filter(r => r.status === 'Maintenance').length;

        // Room type distribution
        const typeDistribution = {};
        blockRooms.forEach(r => {
          typeDistribution[r.roomType] = (typeDistribution[r.roomType] || 0) + 1;
        });

        return {
          blockName: block.name,
          totalFloors: block.totalFloors,
          totalRooms: blockRooms.length,
          totalBeds,
          occupiedBeds: occupied,
          vacantBeds: totalBeds - occupied,
          occupancyRate: totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : 0,
          availableRooms: available,
          fullRooms: full,
          maintenanceRooms: maintenance,
          typeDistribution
        };
      });

      return res.status(200).json({ blockStats });
    } catch (error) {
      console.error('Block stats error:', error);
      return res.status(500).json({ message: 'Error fetching block stats.' });
    }
  },

  // 11. AI Roommate Compatibility Radar & 360 Match Engine
  getRoommateCompatibilityRadar: async (req, res) => {
    try {
      const studentId = req.user.id;
      const currentStudent = await Student.findById(studentId).populate('room');
      if (!currentStudent) return res.status(404).json({ message: 'Student record not found.' });

      const myPrefs = currentStudent.preferences || {};

      // Helper to compute match score between two students
      const computeMatch = (s1Prefs, s2Prefs) => {
        let sleepScore = 50;
        let wakeScore = 50;
        let studyScore = 50;
        let cleanScore = 50;
        let socialScore = 50;
        let langScore = 50;

        // Sleep
        if (s1Prefs.sleepingTime === s2Prefs.sleepingTime) sleepScore = 100;
        else if (
          (s1Prefs.sleepingTime === '10 PM–12 AM' && s2Prefs.sleepingTime !== undefined) ||
          (s2Prefs.sleepingTime === '10 PM–12 AM' && s1Prefs.sleepingTime !== undefined)
        ) sleepScore = 75;
        else sleepScore = 40;

        // Wake
        if (s1Prefs.wakeUpTime === s2Prefs.wakeUpTime) wakeScore = 100;
        else if (
          (s1Prefs.wakeUpTime === '6–8 AM' && s2Prefs.wakeUpTime !== undefined) ||
          (s2Prefs.wakeUpTime === '6–8 AM' && s1Prefs.wakeUpTime !== undefined)
        ) wakeScore = 75;
        else wakeScore = 45;

        // Study
        if (s1Prefs.studyEnvironment === s2Prefs.studyEnvironment) studyScore = 100;
        else if (s1Prefs.studyEnvironment === 'No Preference' || s2Prefs.studyEnvironment === 'No Preference') studyScore = 80;
        else studyScore = 50;

        // Cleanliness
        if (s1Prefs.cleanliness === s2Prefs.cleanliness) cleanScore = 100;
        else if (s1Prefs.cleanliness === 'No Preference' || s2Prefs.cleanliness === 'No Preference') cleanScore = 80;
        else cleanScore = 55;

        // Social / Visitors
        if (s1Prefs.visitorPreference === s2Prefs.visitorPreference) socialScore = 100;
        else if (s1Prefs.visitorPreference === 'No Preference' || s2Prefs.visitorPreference === 'No Preference') socialScore = 80;
        else socialScore = 60;

        // Language
        if (s1Prefs.preferredLanguage && s2Prefs.preferredLanguage && s1Prefs.preferredLanguage === s2Prefs.preferredLanguage) langScore = 100;
        else langScore = 70;

        const overall = Math.round((sleepScore * 0.25) + (wakeScore * 0.15) + (studyScore * 0.2) + (cleanScore * 0.2) + (socialScore * 0.1) + (langScore * 0.1));

        return {
          overallMatch: Math.min(100, Math.max(30, overall)),
          radarMetrics: [
            { axis: 'Sleep Cycle', score: sleepScore, max: 100 },
            { axis: 'Wake Up Schedule', score: wakeScore, max: 100 },
            { axis: 'Study Quietness', score: studyScore, max: 100 },
            { axis: 'Cleanliness Norms', score: cleanScore, max: 100 },
            { axis: 'Social & Visitors', score: socialScore, max: 100 },
            { axis: 'Language Synergy', score: langScore, max: 100 }
          ],
          aiHighlights: overall >= 85
            ? ['🌟 Exceptional Synergy: Sleep, study & hygiene habits closely aligned.', '🤝 Seamless daily routine synchronization.', '🎯 Ideal for distraction-free study blocks.']
            : overall >= 70
            ? ['✅ Solid Compatibility: Balanced lifestyle with compatible quiet hours.', '💡 Complementary schedules with minimal friction.', '🗣️ Good communication will ensure high room harmony.']
            : ['⚠️ Noticeable Preference Differences: Consider establishing early ground rules for sleep hours and study noise.']
        };
      };

      // Determine student gender strictly
      const studentGender = currentStudent.gender || (currentStudent.hostelBlock === 'Gargi Block' ? 'Female' : 'Male');

      // Roommates compatibility (if allocated)
      let currentRoommates = [];
      if (currentStudent.room) {
        const roomObj = await Room.findById(currentStudent.room).populate('currentStudents');
        if (roomObj && roomObj.currentStudents) {
          currentRoommates = roomObj.currentStudents
            .filter(s => s._id.toString() !== studentId.toString())
            .filter(s => {
              const mateGender = s.gender || (s.hostelBlock === 'Gargi Block' ? 'Female' : 'Male');
              return mateGender === studentGender; // Strict same-gender check
            })
            .map(mate => {
              const match = computeMatch(myPrefs, mate.preferences || {});
              return {
                _id: mate._id,
                name: mate.name,
                registerNumber: mate.registerNumber,
                department: mate.department,
                year: mate.year,
                gender: mate.gender || studentGender,
                preferences: mate.preferences,
                matchData: match
              };
            });
        }
      }

      // Potential matches across same gender ONLY (Strict Male-to-Male / Female-to-Female)
      const peerQuery = {
        _id: { $ne: studentId },
        studentType: 'Hosteller'
      };

      if (studentGender === 'Female') {
        peerQuery.$or = [
          { gender: 'Female' },
          { hostelBlock: 'Gargi Block' }
        ];
      } else {
        peerQuery.$or = [
          { gender: 'Male' },
          { hostelBlock: { $in: ['Aryabhata Block', 'Ramanujan Block'] } }
        ];
      }

      const potentialPeers = await Student.find(peerQuery).limit(12).lean();

      const peerMatches = potentialPeers
        .filter(peer => {
          const pGender = peer.gender || (peer.hostelBlock === 'Gargi Block' ? 'Female' : 'Male');
          return pGender === studentGender; // Discard any cross-gender pairings
        })
        .map(peer => ({
          _id: peer._id,
          name: peer.name,
          registerNumber: peer.registerNumber,
          department: peer.department,
          gender: peer.gender || studentGender,
          hostelBlock: peer.hostelBlock || 'Unallocated',
          matchData: computeMatch(myPrefs, peer.preferences || {})
        })).sort((a, b) => b.matchData.overallMatch - a.matchData.overallMatch);

      return res.status(200).json({
        myPreferences: myPrefs,
        allocatedRoom: currentStudent.room,
        studentGender,
        currentRoommates,
        peerMatches: peerMatches.slice(0, 6)
      });
    } catch (error) {
      console.error('Roommate compatibility error:', error);
      return res.status(500).json({ message: 'Error calculating roommate compatibility radar.' });
    }
  }
};

module.exports = RoomController;
