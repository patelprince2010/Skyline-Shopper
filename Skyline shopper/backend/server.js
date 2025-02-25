const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoURI = "mongodb://localhost:27017/skyline_shopper";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB (Skyline Shopper)"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Order Schema
const orderSchema = new mongoose.Schema({
    orderID: { type: String, required: true, unique: true },
    userID: { type: String, required: true },
    items: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String }
    }],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'Pending' },
    orderStatus: { type: String, default: 'Ordered' },
    orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// 📌 API: Save Order
app.post('/saveOrder', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        io.emit('newOrder', order); // Notify clients about new orders
        res.status(201).json({ success: true, message: '✅ Order saved successfully.', order });
    } catch (err) {
        console.error("❌ Error saving order:", err);
        res.status(500).json({ success: false, message: '❌ Error saving order.', error: err.message });
    }
});

// 📌 API: Get All Orders (For Admin Panel)
app.get('/getOrders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        console.error("❌ Error retrieving orders:", err);
        res.status(500).json({ success: false, message: '❌ Error retrieving orders.', error: err.message });
    }
});

// 📌 API: Get Single Order Details (For Order Tracking)
app.get('/getOrder/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderID: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: '❌ Order not found.' });
        }

        res.json({ success: true, order });
    } catch (err) {
        console.error("❌ Error retrieving order:", err);
        res.status(500).json({ success: false, message: '❌ Error retrieving order.', error: err.message });
    }
});

// 📌 API: Update Order Status
app.post('/updateOrderStatus', async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        const order = await Order.findOneAndUpdate(
            { orderID: orderId },
            { orderStatus: newStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "❌ Order not found." });
        }

        io.emit('orderStatusUpdated', { orderID: orderId, newStatus }); // Notify clients
        res.json({ success: true, message: "✅ Order status updated successfully.", order });
    } catch (err) {
        console.error("❌ Error updating order status:", err);
        res.status(500).json({ success: false, message: "❌ Error updating order status.", error: err.message });
    }
});

// 📌 WebSocket Connection
io.on('connection', (socket) => {
    console.log("⚡ A user connected to WebSocket");

    socket.on('disconnect', () => {
        console.log("🔌 A user disconnected from WebSocket");
    });
});

// 📌 Start Server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
