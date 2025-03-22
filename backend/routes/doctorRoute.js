import express from 'express';
import multer from 'multer';
import { signup, login, getCurrentDoctor, getAllDoctors ,searchDoctor, getDoctorPatientEmails} from '../controllers/doctorController.js';
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
doctorRouter.get('/patients/emails', verifyToken, getDoctorPatientEmails);
doctorRouter.post('/login', login);
doctorRouter.get('/me', verifyToken, getCurrentDoctor);
doctorRouter.post('/assign', async (req, res) => {
  try {
    const { userEmail, doctorEmail } = req.body;

    if (!userEmail || !doctorEmail) {
      return res.status(400).json({
        success: false,
        message: "Both userEmail and doctorEmail are required."
      });
    }

    // Fetch user and doctor by email
    const user = await userModel.findOne({ email: userEmail });
    const doctor = await doctorModel.findOne({ email: doctorEmail });

    if (!user || !doctor) {
      return res.status(404).json({
        success: false,
        message: "User or doctor not found."
      });
    }

    // Assign doctor to the user
    user.doctorAssigned.name = doctor.name;
    user.doctorAssigned.email = doctor.email;

    await user.save(); // Persist user changes

    // Check if patient already exists in the doctor's patients list
    const isAlreadyAssigned = doctor.patients.some(patient => patient.email === user.email);

    if (!isAlreadyAssigned) {
      doctor.patients.push({
        email: user.email,
        assignedDate: new Date(),
        status: 'active'
      });

      await doctor.save(); // Persist doctor changes
    }
    console.log("doctor ka data ",doctor);
    console.log("user ka data ",user);


    res.json({
      success: true,
      message: "Doctor assigned successfully.",
      assignedDoctor: doctor,
      updatedUser: user
    });

  } catch (error) {
    console.error("Error in assigning doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign doctor.",
      error: error.message
    });
  }
});

export default doctorRouter;
