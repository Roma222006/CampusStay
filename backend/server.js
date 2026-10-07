require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusstay';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve Built React SPA and Uploaded Files
const clientDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(clientDistPath));
app.use('/uploads', express.static(uploadsPath));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const roomRoutes = require('./routes/roomRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import New Innovative Feature Routes
const gatePassRoutes = require('./routes/gatePassRoutes');
const messRoutes = require('./routes/messRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const pollRoutes = require('./routes/pollRoutes');

// API Mounts
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/wardens', wardenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// New Feature API Mounts
app.use('/api/gatepass', gatePassRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/polls', pollRoutes);

// Fallback to React SPA index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 404 API Route Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

// Database connection & seed function
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Database.');
    
    // Seed initial data if collections are empty
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`CampusStay Server is running on port ${PORT}`);
      console.log(`Access the application at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    console.warn('Proceeding with fallback server startup without active DB. Ensure MongoDB is running!');
    
    // Startup anyway to let developer verify structures
    app.listen(PORT, () => {
      console.log(`CampusStay fallback server running on port ${PORT}`);
    });
  });

// Seeding function helper
async function seedInitialData() {
  try {
    const bcrypt = require('bcryptjs');
    const HostelBlock = require('./models/HostelBlock');
    const Room = require('./models/Room');
    const MessMenu = require('./models/MessMenu');
    const CampusPoll = require('./models/CampusPoll');
    const LostFound = require('./models/LostFound');
    const Student = require('./models/Student');
    const Faculty = require('./models/Faculty');
    const Warden = require('./models/Warden');
    const Admin = require('./models/Admin');
    const Leave = require('./models/Leave');
    const Complaint = require('./models/Complaint');
    const GatePass = require('./models/GatePass');
    const EmergencySOS = require('./models/EmergencySOS');
    const Notification = require('./models/Notification');

    // 1. Seed Hostel Blocks
    const blockCount = await HostelBlock.countDocuments();
    if (blockCount === 0) {
      console.log('Seeding default Hostel Blocks...');
      const defaultBlocks = [
        { name: 'Aryabhata Block', totalFloors: 3, description: 'Premium block for Senior Students.' },
        { name: 'Ramanujan Block', totalFloors: 3, description: 'Spacious block for Junior Students.' },
        { name: 'Gargi Block', totalFloors: 3, description: 'Exclusive block for Girls.' }
      ];
      await HostelBlock.insertMany(defaultBlocks);
      console.log('Hostel Blocks seeded successfully.');
    }

    // 2. Seed Rooms
    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      console.log('Seeding initial rooms...');
      const roomsToCreate = [];
      const blocks = ['Aryabhata Block', 'Ramanujan Block', 'Gargi Block'];
      
      blocks.forEach(block => {
        // Floor 0
        roomsToCreate.push({ roomNumber: '101', hostelBlock: block, floor: 0, roomType: 'Single', restroomType: 'Attached', capacity: 1, occupiedBeds: 0, status: 'Available' });
        roomsToCreate.push({ roomNumber: '102', hostelBlock: block, floor: 0, roomType: 'Double', restroomType: 'Common', capacity: 2, occupiedBeds: 0, status: 'Available' });
        roomsToCreate.push({ roomNumber: '103', hostelBlock: block, floor: 0, roomType: 'Triple', restroomType: 'Common', capacity: 3, occupiedBeds: 0, status: 'Available' });

        // Floor 1
        roomsToCreate.push({ roomNumber: '201', hostelBlock: block, floor: 1, roomType: 'Double', restroomType: 'Attached', capacity: 2, occupiedBeds: 0, status: 'Available' });
        roomsToCreate.push({ roomNumber: '202', hostelBlock: block, floor: 1, roomType: 'Four Sharing', restroomType: 'Common', capacity: 4, occupiedBeds: 0, status: 'Available' });
        roomsToCreate.push({ roomNumber: '203', hostelBlock: block, floor: 1, roomType: 'Single', restroomType: 'Attached', capacity: 1, occupiedBeds: 0, status: 'Available' });

        // Floor 2
        roomsToCreate.push({ roomNumber: '301', hostelBlock: block, floor: 2, roomType: 'Triple', restroomType: 'Common', capacity: 3, occupiedBeds: 0, status: 'Available' });
        roomsToCreate.push({ roomNumber: '302', hostelBlock: block, floor: 2, roomType: 'Double', restroomType: 'Attached', capacity: 2, occupiedBeds: 0, status: 'Available' });
      });

      await Room.insertMany(roomsToCreate);
      console.log('Rooms seeded successfully.');
    }

    // 3. Seed Admin account
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      await Admin.create({
        name: 'CampusStay Administrator',
        email: 'admin@campusstay.com',
        password: hashedPassword
      });
      console.log('Admin account seeded.');
    }

    // 4. Seed Warden account
    let demoWarden = await Warden.findOne({ email: 'warden@campusstay.com' });
    if (!demoWarden) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Warden@123', salt);
      demoWarden = await Warden.create({
        name: 'Mr. Robert Wilson',
        wardenID: 'WRD-ARY-01',
        hostelBlock: 'Aryabhata Block',
        email: 'warden@campusstay.com',
        phone: '9876543212',
        password: hashedPassword
      });
      console.log('Demo Warden account seeded.');
    }

    // 5. Seed Faculty account
    let demoFaculty = await Faculty.findOne({ email: 'faculty@campusstay.com' });
    if (!demoFaculty) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Faculty@123', salt);
      demoFaculty = await Faculty.create({
        name: 'Dr. Sarah Johnson',
        facultyID: 'FAC-CS-101',
        department: 'Computer Science',
        email: 'faculty@campusstay.com',
        phone: '9876543211',
        password: hashedPassword
      });
      console.log('Demo Faculty account seeded.');
    }

    // 6. Seed Student accounts & allocate rooms
    let demoStudent = await Student.findOne({ email: 'student@campusstay.com' });
    const aryaRoom = await Room.findOne({ hostelBlock: 'Aryabhata Block', roomNumber: '101' });

    if (!demoStudent) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Student@123', salt);
      demoStudent = await Student.create({
        name: 'Alex Morgan',
        registerNumber: 'CS2026001',
        email: 'student@campusstay.com',
        phone: '9876543210',
        department: 'Computer Science',
        year: 3,
        section: 'A',
        dob: new Date('2004-05-15'),
        gender: 'Male',
        studentType: 'Hosteller',
        hostelBlock: 'Aryabhata Block',
        room: aryaRoom ? aryaRoom._id : null,
        parentName: 'David Morgan',
        parentPhone: '9876543200',
        guardianName: 'David Morgan',
        guardianPhone: '9876543200',
        address: '124 Tech Park Avenue, Innovation City',
        bloodGroup: 'O+',
        emergencyContact: '9876543200',
        password: hashedPassword,
        preferences: {
          sleepingTime: '10 PM–12 AM',
          wakeUpTime: '6–8 AM',
          studyEnvironment: 'Silent',
          cleanliness: 'Very Clean',
          visitorPreference: 'Occasional Visitors',
          preferredLanguage: 'English',
          roomSharing: 'Single',
          restroomPreference: 'Attached Restroom',
          preferredFloor: 'Ground'
        },
        allocatedAt: new Date()
      });

      if (aryaRoom) {
        aryaRoom.currentStudents = [demoStudent._id];
        aryaRoom.occupiedBeds = 1;
        aryaRoom.status = 'Full';
        await aryaRoom.save();
      }
      console.log('Demo Student (Alex Morgan) seeded.');
    }

    // Secondary demo student (Jane Smith)
    let demoStudent2 = await Student.findOne({ email: 'jane@campusstay.com' });
    const gargiRoom = await Room.findOne({ hostelBlock: 'Gargi Block', roomNumber: '101' });

    if (!demoStudent2) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Student@123', salt);
      demoStudent2 = await Student.create({
        name: 'Jane Smith',
        registerNumber: 'CS2026002',
        email: 'jane@campusstay.com',
        phone: '9876543220',
        department: 'Computer Science',
        year: 2,
        section: 'B',
        dob: new Date('2005-08-20'),
        gender: 'Female',
        studentType: 'Hosteller',
        hostelBlock: 'Gargi Block',
        room: gargiRoom ? gargiRoom._id : null,
        parentName: 'Robert Smith',
        parentPhone: '9876543221',
        address: '45 Lake View Residency, Green Park',
        bloodGroup: 'B+',
        emergencyContact: '9876543221',
        password: hashedPassword,
        preferences: {
          sleepingTime: '10 PM–12 AM',
          wakeUpTime: '6–8 AM',
          studyEnvironment: 'Silent',
          cleanliness: 'Very Clean',
          visitorPreference: 'No Visitors',
          preferredLanguage: 'English',
          roomSharing: 'Single',
          restroomPreference: 'Attached Restroom',
          preferredFloor: 'Ground'
        },
        allocatedAt: new Date()
      });

      if (gargiRoom) {
        gargiRoom.currentStudents = [demoStudent2._id];
        gargiRoom.occupiedBeds = 1;
        gargiRoom.status = 'Full';
        await gargiRoom.save();
      }
      console.log('Demo Student (Jane Smith) seeded.');
    }

    // 7. Seed Leaves
    const leaveCount = await Leave.countDocuments();
    if (leaveCount === 0 && demoStudent) {
      const now = new Date();
      const nextWeek = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await Leave.insertMany([
        {
          student: demoStudent._id,
          leaveType: 'Home Visit',
          fromDate: now,
          toDate: nextWeek,
          durationDays: 3,
          reason: 'Attending family function in hometown.',
          priority: 'Medium',
          status: 'Approved Warden',
          approvedByFaculty: demoFaculty ? demoFaculty._id : null,
          approvedByWarden: demoWarden ? demoWarden._id : null,
          facultyRemarks: 'Approved for family visit.',
          wardenRemarks: 'Gate pass verified and granted.'
        },
        {
          student: demoStudent._id,
          leaveType: 'On Duty',
          fromDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          toDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          durationDays: 2,
          reason: 'National Level Hackathon participation at IIT Madras.',
          priority: 'High/Emergency',
          status: 'Pending Faculty'
        }
      ]);
      console.log('Sample leaves seeded.');
    }

    // 8. Seed Complaints
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0 && demoStudent) {
      await Complaint.insertMany([
        {
          student: demoStudent._id,
          title: 'Ceiling Fan Regulator Issue',
          complaintType: 'Hostel',
          category: 'Electrical',
          description: 'Ceiling fan regulator not working smoothly on speed 3.',
          status: 'Ongoing',
          assignedStaff: 'Maintenance Dept',
          remarks: 'Technician assigned for inspection.'
        },
        {
          student: demoStudent._id,
          title: 'Corridor High Latency Optimization',
          complaintType: 'Hostel',
          category: 'Internet',
          description: 'High ping on 5GHz band during evening peak hours.',
          status: 'Rectified',
          remarks: 'New router access point installed and tested.'
        }
      ]);
      console.log('Sample complaints seeded.');
    }

    // 9. Seed Gate Pass
    const gatePassCount = await GatePass.countDocuments();
    if (gatePassCount === 0 && demoStudent) {
      await GatePass.create({
        student: demoStudent._id,
        passCode: 'GP-2605-8812',
        passType: 'Day Outing',
        qrPayload: `CAMPUSSTAY_PASS_GP-2605-8812_${demoStudent.registerNumber}_${Date.now()}`,
        purpose: 'Library Study & Project Material Purchase',
        destination: 'Central City Library & Tech Market',
        departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expectedReturnTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        parentContact: '9876543200',
        status: 'Active/Out',
        actualDepartureTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
      });
      console.log('Sample Gate Pass seeded.');
    }

    // 10. Seed Lost & Found
    const lfCount = await LostFound.countDocuments();
    if (lfCount === 0 && demoStudent) {
      await LostFound.insertMany([
        {
          title: 'Casio Scientific Calculator fx-991CW',
          category: 'Electronics',
          itemType: 'Found',
          description: 'Found on desk row 3 in Central Library 2nd floor.',
          location: 'Central Library, 2nd Floor Study Hall',
          contactNumber: '9876543212',
          reportedBy: demoWarden ? demoWarden._id : demoStudent._id,
          reporterModel: 'Warden',
          reporterName: 'Mr. Robert Wilson',
          status: 'Open'
        },
        {
          title: 'Matte Blue Steel Water Bottle',
          category: 'Other',
          itemType: 'Lost',
          description: 'Lost Milton 1L thermo bottle with a sticker on the side.',
          location: 'Dining Mess Hall, Aryabhata Block',
          contactNumber: '9876543210',
          reportedBy: demoStudent._id,
          reporterModel: 'Student',
          reporterName: 'Alex Morgan',
          status: 'Open'
        }
      ]);
      console.log('Sample Lost & Found items seeded.');
    }

    // 11. Seed Emergency SOS
    const sosCount = await EmergencySOS.countDocuments();
    if (sosCount === 0 && demoStudent) {
      await EmergencySOS.create({
        student: demoStudent._id,
        studentName: 'Alex Morgan',
        registerNumber: 'CS2026001',
        hostelBlock: 'Aryabhata Block',
        roomNumber: '101',
        emergencyType: 'Medical',
        severity: 'Moderate',
        locationDetails: 'Aryabhata Block, Room 101',
        contactPhone: '9876543210',
        notes: 'First aid assistance needed for minor sprain.',
        status: 'Resolved',
        resolvedAt: new Date(),
        resolvedBy: 'Mr. Robert Wilson (Warden)',
        actionLog: [
          { action: 'Distress Beacon Triggered by Resident', byUser: 'Alex Morgan', byRole: 'Student', timestamp: new Date(Date.now() - 86400000) },
          { action: 'Medical assistance provided and resident is resting comfortably.', byUser: 'Mr. Robert Wilson', byRole: 'Warden', timestamp: new Date(Date.now() - 82800000) }
        ]
      });
      console.log('Sample Emergency SOS seeded.');
    }

    // 12. Seed weekly mess menu if empty
    const messCount = await MessMenu.countDocuments();
    if (messCount === 0) {
      console.log('Seeding initial 7-day Mess Menus...');
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const messSeeds = [];

      days.forEach(day => {
        messSeeds.push(
          {
            dayOfWeek: day,
            mealType: 'Breakfast',
            timing: '07:30 AM – 09:30 AM',
            menuItems: ['Idli / Dosa', 'Sambar & Coconut Chutney', 'Boiled Eggs', 'Fresh Fruits', 'Tea & Filter Coffee'],
            specialItem: day === 'Sunday' ? 'Poori Masala & Kesari' : (day === 'Wednesday' ? 'Medu Vada & Pongal' : 'Cornflakes & Milk'),
            dietaryTags: ['Vegetarian Option Available', 'High Protein'],
            calories: 480
          },
          {
            dayOfWeek: day,
            mealType: 'Lunch',
            timing: '12:30 PM – 02:30 PM',
            menuItems: ['Steamed Rice', 'Dal Tadka', 'Paneer Butter Masala', 'Phulka Roti', 'Curd & Pickle', 'Papad'],
            specialItem: day === 'Wednesday' ? 'Chicken / Paneer Biryani' : (day === 'Sunday' ? 'Special Feast Meal' : 'Gulab Jamun'),
            dietaryTags: ['Full Nutrition', 'Chef Special'],
            calories: 720
          },
          {
            dayOfWeek: day,
            mealType: 'Snacks',
            timing: '04:45 PM – 06:00 PM',
            menuItems: ['Samosa / Veg Cutlet', 'Mint Chutney', 'Cardamom Tea', 'Filter Coffee'],
            specialItem: 'Fresh Banana Cake',
            dietaryTags: ['Snack'],
            calories: 260
          },
          {
            dayOfWeek: day,
            mealType: 'Dinner',
            timing: '07:30 PM – 09:45 PM',
            menuItems: ['Chapati', 'Mixed Veg Curry', 'Jeera Rice', 'Rasam', 'Fruit Custard'],
            specialItem: day === 'Saturday' ? 'Pasta & Garlic Bread' : 'Warm Badam Milk',
            dietaryTags: ['Light Dinner', 'Low Sodium'],
            calories: 540
          }
        );
      });

      await MessMenu.insertMany(messSeeds);
      console.log('Mess Menu seeded successfully.');
    }

    // 13. Seed Campus Polls if empty
    const pollCount = await CampusPoll.countDocuments();
    if (pollCount === 0) {
      console.log('Seeding initial Campus Polls...');
      await CampusPoll.insertMany([
        {
          title: 'Night Canteen Timings Extension to 2:00 AM',
          description: 'Would you like the campus night study canteen to remain operational until 2 AM during exam weeks?',
          category: 'Mess & Dining',
          targetAudience: 'All',
          options: [
            { optionId: 'opt_1', text: 'Yes, absolutely needed for late studies! (2:00 AM)', votesCount: 38, voters: [] },
            { optionId: 'opt_2', text: 'Current 12:30 AM is sufficient', votesCount: 9, voters: [] },
            { optionId: 'opt_3', text: 'Extend on weekends only', votesCount: 14, voters: [] }
          ],
          creatorName: 'Student Welfare Council',
          status: 'Active'
        },
        {
          title: 'New High-Speed Wi-Fi AP Upgrade in Aryabhata Block',
          description: 'Select your preferred installation time slot for the fiber-optic mesh router upgrade in your block.',
          category: 'Hostel Amenities',
          targetAudience: 'Hostellers',
          options: [
            { optionId: 'opt_a', text: 'Saturday Morning (9 AM – 1 PM)', votesCount: 29, voters: [] },
            { optionId: 'opt_b', text: 'Sunday Afternoon (2 PM – 6 PM)', votesCount: 42, voters: [] },
            { optionId: 'opt_c', text: 'Weekday Evenings (6 PM – 9 PM)', votesCount: 16, voters: [] }
          ],
          creatorName: 'IT Infrastructure Dept',
          status: 'Active'
        }
      ]);
      console.log('Campus Polls seeded successfully.');
    }

    // 14. Seed Notifications & Notices
    const notifCount = await Notification.countDocuments({ type: 'notice' });
    if (notifCount === 0) {
      console.log('Seeding official notices...');
      await Notification.insertMany([
        {
          recipientId: 'All',
          recipientRole: 'Student',
          title: 'Notice: Mid-Term Examination Quiet Hours Policy',
          message: 'Quiet hours will be observed across all hostel blocks between 10:00 PM and 6:00 AM starting from next Monday.',
          type: 'notice'
        },
        {
          recipientId: 'Aryabhata Block',
          recipientRole: 'Student',
          title: 'Notice: Solar Water Heater Maintenance Schedule',
          message: 'Hot water line cleaning is scheduled between 2:00 PM and 4:00 PM this Thursday for Aryabhata Block.',
          type: 'notice'
        },
        {
          recipientId: 'All',
          recipientRole: 'Faculty',
          title: 'Notice: Student Leave Verification Protocol',
          message: 'Faculty advisors are kindly requested to verify hackathon and internship leave requests within 24 hours of submission.',
          type: 'notice'
        },
        {
          recipientId: 'All',
          recipientRole: 'Warden',
          title: 'Notice: Weekly Campus Security & Gate Pass Audit',
          message: 'Monthly gate pass summary reports must be generated and submitted to the Chief Warden office by Friday.',
          type: 'notice'
        }
      ]);
      console.log('Official notices seeded successfully.');
    }

  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
