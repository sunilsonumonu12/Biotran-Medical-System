import express from 'express';
import multer from 'multer';
import { login,getUsers,signup , updateUser, updateAddress, getUserDocument, updateUserDocuments,getCurrentUser} from '../controllers/userController.js';
import upload from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const userRouter = express.Router();

const storage = multer.memoryStorage();
const uploads = multer({ storage: storage });

userRouter.get('/me', verifyToken, getCurrentUser); 
userRouter.post('/signup', upload.single('image'), signup);
userRouter.post('/login', login);
userRouter.get('/get-users', verifyToken, getUsers);
userRouter.put('/update', verifyToken, upload.single('prescriptionImage'), updateUser);
userRouter.put('/update-address', verifyToken,updateAddress);
userRouter.put('/update-documents', verifyToken, 
    uploads.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'prescription', maxCount: 1 },
        { name: 'medicalReport', maxCount: 1 },
        { name: 'insurance', maxCount: 1 }
    ]),
    updateUserDocuments
);

userRouter.get('/document/:documentType', getUserDocument);


export default userRouter;