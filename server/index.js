require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/schema');

const app = express();
app.use(cors());
app.use(express.json());

getDb(); // init DB schema on startup

app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`FitnessIQ server running on port ${PORT}`));
