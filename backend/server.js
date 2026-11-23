const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const studentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        id: { type: String, required: true, trim: true, unique: true },
        phone: { type: String, required: true, trim: true },
        zip: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);

app.get('/students', async (req, res, next) => {
    try {
        const students = await Student.find().sort({ name: 1, id: 1 });
        res.json(students);
    } catch (error) {
        next(error);
    }
});

app.post('/find-student', async (req, res, next) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            return res.status(400).json({ error: 'Student name is required' });
        }

        const students = await Student.find({ name: { $regex: name, $options: 'i' } }).sort({ name: 1 });
        if (!students.length) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(students);
    } catch (error) {
        next(error);
    }
});

app.post('/add-student', async (req, res, next) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const id = req.body.id !== undefined ? String(req.body.id).trim() : '';
        const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
        const zip = typeof req.body.zip === 'string' ? String(req.body.zip).trim() : '';

        if (!name || !id || !phone || !zip) {
            return res.status(400).json({ error: 'All fields (name, id, phone, zip) are required' });
        }

        const student = await Student.create({ name, id, phone, zip });
        res.status(201).json({ message: 'Student added successfully', student });
    } catch (error) {
        next(error);
    }
});

app.post('/delete-student', async (req, res, next) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const id = req.body.id !== undefined ? String(req.body.id).trim() : '';

        if (!name && !id) {
            return res.status(400).json({ error: 'Student name or ID is required' });
        }

        const query = id ? { id } : { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } };
        const student = await Student.findOneAndDelete(query);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully', student });
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (error?.code === 11000) {
        return res.status(409).json({ error: 'A student with this ID already exists' });
    }
    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cis3339_homework1';

async function start() {
    try {
        await mongoose.connect(MONGODB_URI);
        await Student.init();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error.message);
        process.exit(1);
    }
}

start();
