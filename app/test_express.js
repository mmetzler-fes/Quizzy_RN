const express = require('express');
const path = require('path');
const serverApp = express();
const distPath = path.join(__dirname, 'dist');
serverApp.use(express.static(distPath));
serverApp.get('*', (req, res) => {
res.sendFile(path.join(distPath, 'index.html'));
});
serverApp.listen(3000, '0.0.0.0', () => {
console.log('Local Server running on port 3000');
});
