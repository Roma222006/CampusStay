const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Warden = require('../models/Warden');

const JWT_SECRET = process.env.JWT_SECRET || 'campusstay_super_secret_jwt_token_2026_key';

// Static Admin Details
const STATIC_ADMIN_EMAIL = 'admin@campusstay.com';
const STATIC_ADMIN_PASSWORD_PLAIN = 'Admin@123';

const AuthController = {
  // Login handler for all roles
  login: async (req, res) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      let user = null;
      let isMatch = false;

      // 1. Check Admin
      if (role === 'Admin') {
        if (email.toLowerCase() === STATIC_ADMIN_EMAIL.toLowerCase()) {
          isMatch = (password === STATIC_ADMIN_PASSWORD_PLAIN);
          if (isMatch) {
            user = {
              _id: 'admin_static_id',
              name: 'CampusStay Administrator',
              email: STATIC_ADMIN_EMAIL,
              role: 'Admin'
            };
          }
        }
      } 
      // 2. Check Student
      else if (role === 'Student') {
        const student = await Student.findOne({ email: email.toLowerCase() });
        if (student) {
          isMatch = await bcrypt.compare(password, student.password);
          if (isMatch) user = student;
        }
      } 
      // 3. Check Faculty
      else if (role === 'Faculty') {
        const faculty = await Faculty.findOne({ email: email.toLowerCase() });
        if (faculty) {
          isMatch = await bcrypt.compare(password, faculty.password);
          if (isMatch) user = faculty;
        }
      } 
      // 4. Check Warden
      else if (role === 'Warden') {
        const warden = await Warden.findOne({ email: email.toLowerCase() });
        if (warden) {
          isMatch = await bcrypt.compare(password, warden.password);
          if (isMatch) user = warden;
        }
      }

      if (!user || !isMatch) {
        return res.status(401).json({ message: 'Invalid email, password, or role.' });
      }

      // Track lastLogin for non-Admin roles
      let previousLogin = null;
      if (role !== 'Admin' && user._id) {
        previousLogin = user.lastLogin || null;
        let Model;
        if (role === 'Student') Model = Student;
        else if (role === 'Faculty') Model = Faculty;
        else if (role === 'Warden') Model = Warden;
        if (Model) {
          await Model.findByIdAndUpdate(user._id, { lastLogin: new Date() });
        }
      }

      // Check if user has completed their profile setup
      let isProfileComplete = true;
      if (role === 'Student') {
        isProfileComplete = !!(user.registerNumber && user.department && user.phone);
      } else if (role === 'Faculty') {
        isProfileComplete = !!(user.facultyID && user.department && user.phone);
      } else if (role === 'Warden') {
        isProfileComplete = !!(user.wardenID && user.hostelBlock && user.phone);
      }

      // Generate JWT
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        studentType: user.studentType || null,
        hostelBlock: user.hostelBlock || null
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: role,
          studentType: user.studentType || null,
          isProfileComplete,
          profilePhotoPath: user.profilePhotoPath || null,
          lastLogin: previousLogin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error during login.' });
    }
  },

  // Unified Registration Handler (Student, Faculty, Warden)
  registerUser: async (req, res) => {
    try {
      const { name, email, role, password } = req.body;

      if (!name || !email || !role || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      const validRoles = ['Student', 'Faculty', 'Warden'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid registration role.' });
      }

      // Check email uniqueness across all tables
      const sExist = await Student.findOne({ email: email.toLowerCase() });
      const fExist = await Faculty.findOne({ email: email.toLowerCase() });
      const wExist = await Warden.findOne({ email: email.toLowerCase() });

      if (sExist || fExist || wExist) {
        return res.status(400).json({ message: 'An account with this email address already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (role === 'Student') {
        const newStudent = new Student({ 
          name, 
          email: email.toLowerCase(), 
          password: hashedPassword,
          registerNumber: req.body.rollNo || undefined,
          department: req.body.department || '',
          year: req.body.yearOfStudy || null,
          phone: req.body.phone || '',
          gender: req.body.gender || '',
          studentType: req.body.studentType || 'Hosteller'
        });
        await newStudent.save();
 
        const payload = { 
          id: newStudent._id, 
          name: newStudent.name, 
          email: newStudent.email, 
          role: 'Student',
          studentType: newStudent.studentType
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
          message: 'Student account registered successfully.',
          token,
          user: {
            id: newStudent._id,
            name: newStudent.name,
            email: newStudent.email,
            role: 'Student',
            rollNo: newStudent.registerNumber,
            department: newStudent.department,
            phone: newStudent.phone,
            studentType: newStudent.studentType
          }
        });
      } else if (role === 'Faculty') {
        const newFaculty = new Faculty({ 
          name, 
          email: email.toLowerCase(), 
          password: hashedPassword,
          department: req.body.department || '',
          phone: req.body.phone || ''
        });
        await newFaculty.save();

        const payload = { id: newFaculty._id, name: newFaculty.name, email: newFaculty.email, role: 'Faculty' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
          message: 'Faculty advisor account registered successfully.',
          token,
          user: {
            id: newFaculty._id,
            name: newFaculty.name,
            email: newFaculty.email,
            role: 'Faculty',
            department: newFaculty.department,
            phone: newFaculty.phone
          }
        });
      } else if (role === 'Warden') {
        const newWarden = new Warden({ 
          name, 
          email: email.toLowerCase(), 
          password: hashedPassword,
          phone: req.body.phone || ''
        });
        await newWarden.save();

        const payload = { id: newWarden._id, name: newWarden.name, email: newWarden.email, role: 'Warden' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
          message: 'Warden account registered successfully.',
          token,
          user: {
            id: newWarden._id,
            name: newWarden.name,
            email: newWarden.email,
            role: 'Warden',
            phone: newWarden.phone
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: error.message || 'Server error during registration.' });
    }
  },

  // Complete Student Profile Post-Login
  completeStudentProfile: async (req, res) => {
    try {
      const studentId = req.user.id;
      const {
        registerNumber,
        phone,
        department,
        year,
        section,
        dob,
        gender,
        studentType,
        hostelBlock,
        parentName,
        parentPhone,
        guardianName,
        guardianPhone,
        address,
        bloodGroup,
        emergencyContact
      } = req.body;

      // Basic updates
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found.' });

      // Enforce duplicate register number check if provided
      if (registerNumber) {
        const duplicate = await Student.findOne({ registerNumber: registerNumber.trim(), _id: { $ne: studentId } });
        if (duplicate) {
          return res.status(400).json({ message: 'This Register Number is already associated with another student.' });
        }
        student.registerNumber = registerNumber.trim();
      }

      // Set files conditional on studentType
      let idCardPath = student.idCardPath;
      let profilePhotoPath = student.profilePhotoPath;

      if (studentType === 'Hosteller') {
        if (req.files) {
          if (req.files['idCard']) idCardPath = '/uploads/' + req.files['idCard'][0].filename;
          if (req.files['profilePhoto']) profilePhotoPath = '/uploads/' + req.files['profilePhoto'][0].filename;
        }

        // If files are missing and not set previously
        if (!idCardPath || !profilePhotoPath) {
          return res.status(400).json({ message: 'Hostellers must upload both ID Card document and Profile Photo.' });
        }
      }

      student.phone = phone || student.phone;
      student.department = department || student.department;
      student.year = year ? parseInt(year) : student.year;
      student.section = section || student.section;
      if (dob) student.dob = new Date(dob);
      student.gender = gender || student.gender;
      student.studentType = studentType || student.studentType;
      student.hostelBlock = studentType === 'Hosteller' ? hostelBlock : '';
      student.parentName = parentName || student.parentName;
      student.parentPhone = parentPhone || student.parentPhone;
      student.guardianName = guardianName || student.guardianName;
      student.guardianPhone = guardianPhone || student.guardianPhone;
      student.address = address || student.address;
      student.bloodGroup = bloodGroup || student.bloodGroup;
      student.emergencyContact = emergencyContact || student.emergencyContact;
      student.idCardPath = idCardPath;
      student.profilePhotoPath = profilePhotoPath;

      await student.save();
      return res.status(200).json({ message: 'Profile completed successfully!', student });
    } catch (error) {
      console.error('Profile complete error:', error);
      return res.status(500).json({ message: 'Server error updating student profile.' });
    }
  },

  // Complete Faculty Profile Post-Login
  completeFacultyProfile: async (req, res) => {
    try {
      const facultyId = req.user.id;
      const { facultyID, department, phone } = req.body;

      const faculty = await Faculty.findById(facultyId);
      if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });

      if (facultyID) {
        const duplicate = await Faculty.findOne({ facultyID: facultyID.trim(), _id: { $ne: facultyId } });
        if (duplicate) return res.status(400).json({ message: 'Faculty ID already in use.' });
        faculty.facultyID = facultyID.trim();
      }

      if (req.file) {
        faculty.profilePhotoPath = '/uploads/' + req.file.filename;
      }

      faculty.department = department || faculty.department;
      faculty.phone = phone || faculty.phone;
      await faculty.save();

      return res.status(200).json({ message: 'Faculty profile completed!', faculty });
    } catch (error) {
      return res.status(500).json({ message: 'Server error updating faculty profile.' });
    }
  },

  // Complete Warden Profile Post-Login
  completeWardenProfile: async (req, res) => {
    try {
      const wardenId = req.user.id;
      const { wardenID, hostelBlock, phone } = req.body;

      const warden = await Warden.findById(wardenId);
      if (!warden) return res.status(404).json({ message: 'Warden not found.' });

      if (wardenID) {
        const duplicate = await Warden.findOne({ wardenID: wardenID.trim(), _id: { $ne: wardenId } });
        if (duplicate) return res.status(400).json({ message: 'Warden ID already in use.' });
        warden.wardenID = wardenID.trim();
      }

      if (req.file) {
        warden.profilePhotoPath = '/uploads/' + req.file.filename;
      }

      warden.hostelBlock = hostelBlock || warden.hostelBlock;
      warden.phone = phone || warden.phone;
      await warden.save();

      return res.status(200).json({ message: 'Warden profile completed!', warden });
    } catch (error) {
      return res.status(500).json({ message: 'Server error updating warden profile.' });
    }
  },

  // Get profile information for logged-in user
  getProfile: async (req, res) => {
    try {
      const { id, role } = req.user;

      let user = null;
      if (role === 'Admin') {
        user = {
          name: 'CampusStay Administrator',
          email: STATIC_ADMIN_EMAIL,
          role: 'Admin'
        };
      } else if (role === 'Student') {
        user = await Student.findById(id).populate('room').exec();
      } else if (role === 'Faculty') {
        user = await Faculty.findById(id).exec();
      } else if (role === 'Warden') {
        user = await Warden.findById(id).exec();
      }

      if (!user) {
        return res.status(404).json({ message: 'User profile not found.' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ message: 'Server error fetching profile.' });
    }
  },

  // Update basic profile info (name, phone, address, department)
  updateProfile: async (req, res) => {
    try {
      const { id, role } = req.user;
      const { name, phone, address, department } = req.body;

      const update = {};
      if (name) update.name = name.trim();
      if (phone !== undefined) update.phone = phone;
      if (address !== undefined) update.address = address;
      if (department !== undefined && role !== 'Student') update.department = department;

      let Model;
      if (role === 'Student') Model = Student;
      else if (role === 'Faculty') Model = Faculty;
      else if (role === 'Warden') Model = Warden;
      else return res.status(403).json({ message: 'Admin profile cannot be edited here.' });

      const updated = await Model.findByIdAndUpdate(id, update, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'User not found.' });

      return res.status(200).json({ user: updated, message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Error updating profile.' });
    }
  },

  // Change password (requires current password verification)
  changePassword: async (req, res) => {
    try {
      const { id, role } = req.user;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }

      let Model;
      if (role === 'Student') Model = Student;
      else if (role === 'Faculty') Model = Faculty;
      else if (role === 'Warden') Model = Warden;
      else return res.status(403).json({ message: 'Admin cannot change password via this endpoint.' });

      const user = await Model.findById(id).select('+password');
      if (!user) return res.status(404).json({ message: 'User not found.' });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ message: 'Error changing password.' });
    }
  },

  // Upload / replace avatar photo
  uploadAvatar: async (req, res) => {
    try {
      const { id, role } = req.user;
      if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

      const avatarFilename = req.file.filename;

      let Model;
      if (role === 'Student') Model = Student;
      else if (role === 'Faculty') Model = Faculty;
      else if (role === 'Warden') Model = Warden;
      else return res.status(403).json({ message: 'Admin does not have a profile photo.' });

      const updated = await Model.findByIdAndUpdate(id, { avatar: avatarFilename }, { new: true });
      return res.status(200).json({ user: updated, avatar: avatarFilename, message: 'Avatar updated.' });
    } catch (error) {
      console.error('Avatar upload error:', error);
      return res.status(500).json({ message: 'Error uploading avatar.' });
    }
  },
};

module.exports = AuthController;
