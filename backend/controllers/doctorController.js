import jwt from 'jsonwebtoken';
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
export const getAllDoctors = async (req, res) => {
  try {
    // Fetch only name, email, and password fields for all doctors
    const doctors = await doctorModel.find({}, 'name email password patients');
    console.log("Doctors fetched successfully:", doctors);

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      doctors
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


export const getDoctorPatientEmails = async (req, res) => {
  try {
    // Use the doctor email from the verified token
    const doctorEmail = req.user.email;
    console.log("getDoctorPatientEmails called with user:", req.user);
    const doctor = await doctorModel.findOne({ email: doctorEmail });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    console.log("hi");

    // Map over the patients array to return only the email field for each patient
    const patientEmails = doctor.patients.map(patient => ({
      email: patient.email
    }));

    console.log("Patient emails fetched successfully:", patientEmails);

    return res.status(200).json({
      success: true,
      patients: patientEmails
    });
  } catch (error) {
    console.error("Error fetching patient emails:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
export const searchDoctor = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Doctor name is required"
      });
    }

    // Case-insensitive search for doctor name
    const doctor = await doctorModel.findOne({
      name: { $regex: new RegExp(name, 'i') }
    }).populate('patients', 'name email phone age bloodGroup');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        speciality: doctor.speciality,
        patients: doctor.patients || [],
        degree: doctor.degree,
        experience: doctor.experience
      }
    });
  } catch (error) {
    console.error("Error searching doctor:", error);
    res.status(500).json({
      success: false,
      message: "Error searching doctor",
      error: error.message
    });
  }
};

export const getCurrentDoctor = async (req, res) => {
  try {
    const doctorId = req.user.id; // Assuming doctor is authenticated and req.user contains doctor info

    const doctor = await doctorModel.findById(doctorId).populate("patients", "name email age phone");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.json({ 
      success: true, 
      doctor: {
        name: doctor.name,
        email: doctor.email,
        speciality: doctor.speciality,
        patients: doctor.patients // List of patients assigned to this doctor
      } 
    });
  } catch (error) {
    console.error("Error fetching doctor data:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const doctor = await doctorModel.findOne({ email });
      if (!doctor) {
        return res.status(401).json({
          success: false,
          message: "Doctor not found"
        });
      }
  
      // Simple password check (for demonstration purposes only; consider hashing for production)
      if (doctor.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }
  
      // Generate JWT token (expires in 1 hour for login)
      const token = jwt.sign(
        {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          speciality: doctor.speciality
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({
        success: true,
        message: "Login successful",
        token,
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          speciality: doctor.speciality,
          degree: doctor.degree,
          experience: doctor.experience,
          about: doctor.about,
          fees: doctor.fees,
          address: doctor.address,
          available: doctor.available,
          image: doctor.image
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  };

export const signup = async (req, res) => {
  try {
    // Destructure required fields and additional doctor-specific fields from req.body
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      available
    } = req.body;

    // Ensure mandatory fields for signup are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Build doctor data with default values for missing fields (using non-empty defaults)
    const doctorData = {
      name,
      email,
      password,
      speciality: speciality || "General",
      degree: degree || "N/A",
      experience: experience || "N/A",
      about: about || "N/A",
      fees: fees ? Number(fees) : 0,
      address: address || "N/A",
      // Since no image is expected, we assign empty strings
      image: {
        base64: "",
        mimeType: ""
      },
      // Default value for available if not provided
      available: available !== undefined ? available : false
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    // Generate JWT token (expires in 7 days for signup)
    const token = jwt.sign(
      {
        id: newDoctor._id,
        name: newDoctor.name,
        email: newDoctor.email,
        speciality: newDoctor.speciality
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, message: "Signup successful", token });
  } catch (error) {
    console.error("Doctor signup error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during signup"
    });
  }
};

