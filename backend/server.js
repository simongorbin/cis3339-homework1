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

const courseSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true, unique: true },
        name: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

const enrollmentSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
    },
    { timestamps: true }
);
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

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
        if (!name) return res.status(400).json({ error: 'Student name is required' });

        const students = await Student.find({ name: { $regex: name, $options: 'i' } }).sort({ name: 1 });
        if (!students.length) return res.status(404).json({ error: 'Student not found' });
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
        if (!name && !id) return res.status(400).json({ error: 'Student name or ID is required' });

        const query = id
            ? { id }
            : { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } };
        const student = await Student.findOneAndDelete(query);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        await Enrollment.deleteMany({ student: student._id });
        res.json({ message: 'Student deleted successfully', student });
    } catch (error) {
        next(error);
    }
});

app.get('/courses', async (req, res, next) => {
    try {
        const courses = await Course.find().sort({ id: 1, name: 1 });
        res.json(courses);
    } catch (error) {
        next(error);
    }
});

app.post('/courses', async (req, res, next) => {
    try {
        const id = req.body.id !== undefined ? String(req.body.id).trim() : '';
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!id || !name) return res.status(400).json({ error: 'Course ID and course name are required' });

        const course = await Course.create({ id, name });
        res.status(201).json({ message: 'Course added successfully', course });
    } catch (error) {
        next(error);
    }
});

app.delete('/courses/:id', async (req, res, next) => {
    try {
        const course = await Course.findOneAndDelete({ id: req.params.id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        await Enrollment.deleteMany({ course: course._id });
        res.json({ message: 'Course deleted successfully', course });
    } catch (error) {
        next(error);
    }
});

app.post('/enrollments', async (req, res, next) => {
    try {
        const studentId = req.body.studentId !== undefined ? String(req.body.studentId).trim() : '';
        const courseId = req.body.courseId !== undefined ? String(req.body.courseId).trim() : '';
        if (!studentId || !courseId) {
            return res.status(400).json({ error: 'Student and course are required' });
        }

        const [student, course] = await Promise.all([
            Student.findOne({ id: studentId }),
            Course.findOne({ id: courseId })
        ]);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const existing = await Enrollment.findOne({ student: student._id, course: course._id });
        if (existing) return res.status(409).json({ error: 'Student is already enrolled in this course' });

        const enrollment = await Enrollment.create({ student: student._id, course: course._id });
        res.status(201).json({ message: 'Enrollment added successfully', enrollment });
    } catch (error) {
        next(error);
    }
});

app.get('/courses/:id/students', async (req, res, next) => {
    try {
        const course = await Course.findOne({ id: req.params.id });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const enrollments = await Enrollment.find({ course: course._id })
            .populate('student', 'name id phone zip')
            .sort({ createdAt: 1 });
        const students = enrollments
            .map((enrollment) => enrollment.student)
            .filter((student) => student !== null);

        res.json(students);
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        if (field === 'id') return res.status(409).json({ error: 'A record with this ID already exists' });
        return res.status(409).json({ error: 'Duplicate record is not allowed' });
    }
    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cis3339_homework1';

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.accepts('html')) {
        return res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
            if (error) next(error);
        });
    }
    next();
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

async function start() {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });
        await Promise.all([Student.init(), Course.init(), Enrollment.init()]);

        app.listen(PORT, () => {
            console.log(`MongoDB connected: ${MONGODB_URI}`);
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to MongoDB.');
        console.error(`Check MONGODB_URI in backend/.env and confirm MongoDB is running.`);
        console.error(error.message);
        process.exit(1);
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
});

process.on('SIGINT', async () => {
    await mongoose.disconnect();
    process.exit(0);
});

start();
