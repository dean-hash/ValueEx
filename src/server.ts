import express from 'express';
import path from 'path';

const app = express();
const port = 3002; // Changed to 3002

// Serve static files from the visualization directory
app.use(express.static(path.join(__dirname, 'visualization')));

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'visualization', 'dashboard.html'));
});

app.listen(port, () => {
    console.log(`Dashboard running at http://localhost:${port}`);
});
