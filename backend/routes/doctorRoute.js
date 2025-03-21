import express from 'express';
import multer from 'multer';
import { signup, login, getCurrentDoctor, getAllDoctors ,searchDoctor} from '../controllers/doctorController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
const doctorRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
doctorRouter.get('/search', searchDoctor);
// Use upload.none() to parse multipart form data when no files are expected
doctorRouter.get('/all', getAllDoctors);
doctorRouter.post('/signup', upload.none(), signup);
doctorRouter.post('/login', login);
doctorRouter.get('/me', verifyToken, getCurrentDoctor);
doctorRouter.post('/assign', async (req, res) => {
  try {
    const { userEmail, doctorEmail } = req.body;

    // Find user and doctor by email
    const user = await userModel.findOne({ email: userEmail });
    const doctor = await doctorModel.findOne({ email: doctorEmail });

    console.log("Found user:", !!user, "Found doctor:", !!doctor);

    if (!user || !doctor) {
      return res.status(404).json({
        success: false,
        message: "User or doctor not found"
      });
    }

    // ✅ Update user's assigned doctor and ensure it persists
    user.doctorAssigned = {
      name: doctor.name,
      email: doctor.email
    };
    await user.save(); // ✅ Persist changes

    // ✅ Check if user already exists in doctor's patients list
    const patientExists = doctor.patients.some(patient => patient.email === userEmail);

    // ✅ Add user to doctor's patients array if not exists
    if (!patientExists) {
      doctor.patients.push({
        email: userEmail,
        assignedDate: new Date(),
        status: 'active'
      });
      await doctor.save(); // ✅ Persist changes
    }
    console.log(" User  ka detail",user);

    console.log("Doctor assigned successfully", {
      doctor: doctor.name,
      doctorEmail: doctor.email,
      patientCount: doctor.patients.length
    });

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
