const express = require('express');
const path = require('path');
const app = express();

// Serve static files from visualization directory
app.use(express.static(path.join(__dirname, 'visualization')));

// Serve the dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'visualization', 'dashboard.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`ValueEx dashboard running at http://localhost:${PORT}`);
});
