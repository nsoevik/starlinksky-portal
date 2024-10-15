const express = require('express');
const path = require('path');
const sandboxRoutes = require('./routes/sandboxRoutes');
const db = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();
const HOSTNAME = process.env.HOSTNAME || "2605:59c8:97e:5610:9a3e:1b54:62b9:b282";
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '../client/dist')));
//app.get('/', (req,res) => {
//  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
//});

app.use('/api', sandboxRoutes);

app.listen(PORT, HOSTNAME, () => {
    console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
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
