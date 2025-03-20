import userModel from '../models/userModel.js';
import validator from 'validator';
import upload from '../middlewares/multer.js';
import jwt from 'jsonwebtoken';
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const imageFile = req.file;

    if (!name || !email || !password || !imageFile) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Convert image to base64
    const base64Image = imageFile.buffer.toString('base64');
    const mimeType = imageFile.mimetype;

    const userData = {
      name,
      email,
      password,
      image: {
        base64: base64Image,
        mimeType: mimeType,
      }
    };

    const newUser = new userModel(userData);
    await newUser.save();
    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return the token along with success message
    res.json({ success: true, message: 'Signup successful', token });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during signup"
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { email, ...updatedData } = req.body;

    console.log("Request body:", req.body);
    if (req.file) {
      console.log("File details:", req.file);
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: "Images Only!"
        });
      }
      updatedData.prescriptionPdf = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      updatedData,
      { new: true }
    );

    if (!updatedUser) {
      console.log("Current logged-in user details:", { email });
      console.log("Data trying to match with:", updatedData);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { email, ...addressData } = req.body;

    // Validate required fields
    const requiredFields = ['permanentAddress', 'city', 'country', 'postalCode', 'contactNumber'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      {
        $set: {
          permanentAddress: addressData.permanentAddress,
          correspondenceAddress: addressData.correspondenceAddress,
          lane: addressData.lane,
          city: addressData.city,
          state: addressData.state,
          country: addressData.country,
          postalCode: addressData.postalCode,
          landmark: addressData.landmark,
          contactNumber: addressData.contactNumber,
          alternativeContact: addressData.alternativeContact,
          emergencyContact: addressData.emergencyContact,
          addressType: addressData.addressType,
          additionalNotes: addressData.additionalNotes
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Address updated successfully",
      address: {
        permanentAddress: updatedUser.permanentAddress,
        city: updatedUser.city,
        country: updatedUser.country
        // ... other address fields as needed
      }
    });

  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({
      success: false,
      message: "Error updating address",
      error: error.message
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id)
      .select('-password -documents.prescription.data -documents.medicalReport.data -documents.insurance.data');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return only necessary user data
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        gender: user.gender,
        dob: user.dob,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        age: user.age,
        emergencyContact: user.emergencyContact,
        allergies: user.allergies,
        vaccinationHistory: user.vaccinationHistory,
        healthInsurancePolicy: user.healthInsurancePolicy,
        doctorAssigned: user.doctorAssigned,
        permanentAddress: user.permanentAddress,
        city: user.city,
        state: user.state,
        country: user.country
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
export const updateUserDocuments = async (req, res) => {
  try {
      const { email } = req.body;
      if (!email) {
          return res.status(400).json({
              success: false,
              message: 'Email is required'
          });
      }

      const files = req.files;
      if (!files || Object.keys(files).length === 0) {
          return res.status(400).json({
              success: false,
              message: 'No files were uploaded'
          });
      }

      const documentUpdates = {};

      // Process each file
      for (const [key, file] of Object.entries(files)) {
          if (file && file[0]) {
              documentUpdates[`documents.${key}`] = {
                  data: file[0].buffer,
                  contentType: file[0].mimetype,
                  fileName: file[0].originalname
              };
          }
      }

      const updatedUser = await userModel.findOneAndUpdate(
          { email },
          { $set: documentUpdates },
          { new: true }
      );

      if (!updatedUser) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      res.status(200).json({
          success: true,
          message: 'Documents updated successfully'
      });

  } catch (error) {
      console.error('Error in updateUserDocuments:', error);
      res.status(500).json({
          success: false,
          message: 'Error updating documents',
          error: error.message
      });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

// Generate JWT token
const token = jwt.sign(
  {
    id: user._id,
    name: user.name,
    email: user.email
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Return token, user details, and success message
res.json({
  success: true,
  message: "Login successful",
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    image: user.image
  }
});;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getUserDocument = async (req, res) => {
  try {
      const userId = req.user.id;
      const { documentType } = req.params;

      const user = await User.findById(userId);
      if (!user || !user.documents[documentType]) {
          return res.status(404).json({
              success: false,
              message: 'Document not found'
          });
      }

      const document = user.documents[documentType];
      res.set('Content-Type', document.contentType);
      res.send(document.data);

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Error retrieving document',
          error: error.message
      });
  }
};

export { signup, login , getUsers, updateUser,updateAddress,getCurrentUser};