import mongoose from 'mongoose';

const dataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const dataModel = mongoose.model('User', dataSchema);

export default dataModel;
