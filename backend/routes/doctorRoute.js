import express from 'express';
import multer from 'multer';
import { signup, login, getCurrentDoctor, getAllDoctors } from '../controllers/doctorController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
const doctorRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Use upload.none() to parse multipart form data when no files are expected
doctorRouter.get('/all', getAllDoctors);
doctorRouter.post('/signup', upload.none(), signup);
doctorRouter.post('/login', login);
doctorRouter.get('/me', verifyToken, getCurrentDoctor);
doctorRouter.post('/assign', verifyToken, async (req, res) => {
  try {
    const { userEmail, doctorEmail } = req.body;
    
    // Find user and doctor by email
    const user = await userModel.findOne({ email: userEmail });
    const doctor = await doctorModel.findOne({ email: doctorEmail });
    
    if (!user || !doctor) {
      return res.status(404).json({
        success: false,
        message: "User or doctor not found"
      });
    }

    // Update user's assigned doctor
    user.doctorAssigned = doctor.name; // Store doctor's name as per your schema
    await user.save();

    // Add user to doctor's patients list if not already present
    if (!doctor.patients.includes(userEmail)) {
      doctor.patients.push(userEmail);
      await doctor.save();
    }

    res.json({
      success: true,
      message: "Doctor assigned successfully",
      updatedPatient: user
    });
  } catch (error) {
    console.error("Error assigning doctor:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning doctor",
      error: error.message
    });
  }
});
export default doctorRouter;
