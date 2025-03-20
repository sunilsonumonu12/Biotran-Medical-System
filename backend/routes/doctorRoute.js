import express from 'express';
import multer from 'multer';
import { signup, login, getCurrentDoctor, getAllDoctors } from '../controllers/doctorController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const doctorRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Use upload.none() to parse multipart form data when no files are expected
doctorRouter.get('/all', getAllDoctors);
doctorRouter.post('/signup', upload.none(), signup);
doctorRouter.post('/login', login);
doctorRouter.get('/me', verifyToken, getCurrentDoctor);

export default doctorRouter;
