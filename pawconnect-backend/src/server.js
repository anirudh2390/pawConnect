require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = async () => {
    // Safe imports to support dynamic testing
    const connect = require('./config/db');
    await connect();
};
const initSocket = require('./socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Connect database
    await connectDB();

    // Create HTTP Server
    const server = http.createServer(app);

    // Install Socket.IO and store instance on app for controller access
    const io = initSocket(server);
    app.set('io', io);

    server.listen(PORT, () => {
        console.log(`Server executing in workspace. Port: ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error(`Failed to initialize backend: ${error.message}`);
    process.exit(1);
});
