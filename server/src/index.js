const express = require('express');
const path = require('path');
const sandboxRoutes = require('./routes/sandboxRoutes');
const db = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '../client/dist')));
//app.get('/', (req,res) => {
//  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
//});

app.use('/api', sandboxRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});
