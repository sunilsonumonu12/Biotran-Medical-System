import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';

export const getAllDoctors = async (req, res) => {
  try {
    // Fetch only name, email, and password fields for all doctors
    const doctors = await doctorModel.find({}, 'name email password');
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

export const getCurrentDoctor = async (req, res) => {
  try {
    // The verifyToken middleware should have added req.user
    const doctor = await doctorModel.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
