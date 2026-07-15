require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB ডেটাবেসের সাথে সফলভাবে কানেক্ট হয়েছে!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

/* =========================================================================
   📦 EXTENDED ORDER SCHEMA DEFINITION
   ========================================================================= */
const orderSchema = new mongoose.Schema({

    orderId: {
        type: String,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    shippingCost: {
        type: Number,
        default: 60
    },

    discount: {
        type: Number,
        default: 0
    },

    totalAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: 'Pending',
        enum: [
            'Pending',
            'Confirmed',
            'On Hold',
            'Ready to Ship',
            'Shipped',
            'Delivered',
            'Returned',
            'Cancelled'
        ]
    },

    // 🔖 Steadfast Tracking Code
    trackingCode: {
        type: String,
        default: ''
    },

    // 📦 Steadfast Consignment ID
    consignmentId: {
        type: String,
        default: ''
    },

    // ✅ Already Sent Flag
    courierSent: {
        type: Boolean,
        default: false
    },

    notes: {
        type: String,
        default: ''
    }

}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);


const abandonedLeadSchema = new mongoose.Schema({

    name: String,
    phone: String,
    address: String,

    quantity: Number,

    status: {
        type: String,
        default: 'pending'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const AbandonedLead =
    mongoose.model('AbandonedLead', abandonedLeadSchema);



/* =========================================================================
   🔐 SECURITY & AUTHENTICATION API
   ========================================================================= */

app.post('/api/admin/login', (req, res) => {

    const { pin } = req.body;

    const serverPin = process.env.ADMIN_PIN;

    if (pin === serverPin) {

        const token = jwt.sign(
            { admin: true },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            token
        });

    } else {

        res.status(401).json({
            success: false,
            message: "Wrong PIN"
        });

    }

});


app.post('/save-lead', async (req, res) => {

    try {

        const {
            name,
            phone,
            address,
            quantity,
            total
        } = req.body;

        const existing =
            await AbandonedLead.findOne({ phone });

        if (existing) {
            return res.json({
                success: true
            });
        }

        await AbandonedLead.create({
            name,
            phone,
            address,
            quantity
        });

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });
    }

});


app.get('/api/abandoned-orders', async (req, res) => {

    try {

        const leads =
            await AbandonedLead
            .find()
            .sort({ createdAt: -1 });

        res.json(leads);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

});

app.post('/api/mark-converted', async (req, res) => {
    try {

        const { phone } = req.body;

        await AbandonedLead.updateOne(
            { phone },
            {
                $set: { status: 'converted' }
            }
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

/* =========================
   GET ALL LEADS
========================= */
app.get('/api/leads', async (req, res) => {
    try {

        const leads = await AbandonedLead.find()
            .sort({ createdAt: -1 });

        res.json(leads);

    } catch (err) {
        res.status(500).json([]);
    }
});

/* =========================
   ADD NOTE
========================= */
app.post('/api/lead-note', async (req, res) => {
    try {

        const { phone, note } = req.body;

        await AbandonedLead.updateOne(
            { phone },
            {
                $set: { note }
            }
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false });
    }
});

/* =========================
   DELETE LEAD
========================= */
app.post('/api/delete-lead', async (req, res) => {
    try {

        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone required"
            });
        }

        // optional safety normalize (recommended even if frontend not using cleanPhone)
        const cleanPhone = phone.replace(/\D/g, '');

        const result = await AbandonedLead.deleteOne({
            phone: cleanPhone
        });

        return res.json({
            success: true,
            deleted: result.deletedCount
        });

    } catch (err) {

        console.log("DELETE LEAD ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


const crypto = require('crypto');

// =====================
// HASH FUNCTION
// =====================
function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

// =====================
// IN-MEMORY DEDUP STORE (FIXED)
// =====================
const eventCache = new Set();

// =====================
// ROUTE
// =====================
app.post("/track-purchase", async (req, res) => {
    try {

        const {
            value,
            quantity,
            eventId,
            fbp,
            fbc,
            phone,
            name
        } = req.body;

        // =====================
        // VALIDATION
        // =====================
        if (!value || !quantity || !eventId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // =====================
        // DUPLICATE PREVENT
        // =====================
        if (eventCache.has(eventId)) {
            return res.json({
                success: true,
                message: "Duplicate ignored"
            });
        }

        eventCache.add(eventId);

        setTimeout(() => {
            eventCache.delete(eventId);
        }, 60 * 60 * 1000);

        // =====================
        // IP + UA
        // =====================
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.ip;

        const userAgent = req.headers["user-agent"];

        // =====================
        // META PAYLOAD
        // =====================
        const payload = {
            data: [
                {
                    event_name: "Purchase",
                    event_id: eventId,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: "website",

                    user_data: {
                        client_ip_address: ip,
                        client_user_agent: userAgent,

                        // IMPORTANT MATCH SIGNALS
                        fbp: fbp,
                        fbc: fbc,

                        // HASHED IDENTIFIERS
                        ph: phone ? sha256(phone) : undefined,
                        fn: name ? sha256(name.split(' ')[0]) : undefined,

                        // HIGH VALUE FOR MATCHING
                        external_id: phone ? sha256(phone) : undefined
                    },

                    custom_data: {
                        currency: "BDT",
                        value: Number(value || 0),
                        num_items: Number(quantity || 1),
                        content_name: "mini-shaver",
                        content_type: "product",
                        content_ids: ["mini-shaver"]
                    }
                }
            ],

            access_token: process.env.META_ACCESS_TOKEN
            
        };

        // =====================
        // SEND TO META
        // =====================
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${process.env.META_PIXEL_ID}/events`,
            payload
        );

        // =====================
        // SUCCESS LOG
        // =====================
        console.log("✅ META SUCCESS:");
        console.log(JSON.stringify(response.data, null, 2));

        return res.json({
            success: true,
            meta: response.data
        });

    } catch (err) {

        // =====================
        // ERROR DEBUG
        // =====================
        console.log("❌ META ERROR:");

        if (err.response) {
            console.log("STATUS:", err.response.status);
            console.log("DATA:", JSON.stringify(err.response.data, null, 2));
        } else if (err.request) {
            console.log("NO RESPONSE FROM META API");
        } else {
            console.log("ERROR:", err.message);
        }

        return res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
});

// ======================================================
// 📦 CREATE ORDER
// ======================================================

app.post(
    '/api/orders',

    async (req, res) => {

        try {

            const {

                name,

                phone,

                address,

                quantity,

                shippingCost,

                totalAmount

            } = req.body;

            // ==================================
            // BASIC VALIDATION
            // ==================================

            if (
                !name ||
                !phone ||
                !address
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'সব তথ্য পূরণ করুন'

                });

            }

            // ==================================
            // 5 MINUTE DUPLICATE PROTECTION
            // ==================================

            const fiveMinutesAgo =
                new Date(
                    Date.now() -
                    5 * 60 * 1000
                );

            const existingOrder =
                await Order.findOne({

                    phone: phone,

                    createdAt: {
                        $gte:
                            fiveMinutesAgo
                    }

                });

            if (existingOrder) {

                return res.status(400).json({

                    success: false,

                    message:
                        'আপনি ইতোমধ্যে একটি অর্ডার করেছেন 😊 ৫ মিনিট পরে আবার চেষ্টা করুন।'

                });

            }

            // ==================================
            // GENERATE ORDER ID
            // ==================================

            const orderId =

                'ORD-' +

                Math.floor(
                    10000 +
                    Math.random() * 90000
                );

            // ==================================
            // SAVE ORDER
            // ==================================

            const newOrder =
                new Order({

                    orderId,

                    name,

                    phone,

                    address,

                    quantity,

                    shippingCost,

                    totalAmount

                });

            await newOrder.save();

            console.log(
                "NEW ORDER:",
                orderId
            );

            // ==================================
            // SUCCESS RESPONSE
            // ==================================

            res.status(201).json({

                success: true,

                message:
                    'অর্ডার সফলভাবে গ্রহণ করা হয়েছে!',

                order: newOrder

            });

        } catch (error) {

            console.error(
                "ORDER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'সার্ভার ত্রুটি! আবার চেষ্টা করুন।'

            });

        }

    }
);

// ২. সব অর্ডার দেখা (অ্যাডমিন প্যানেলের জন্য ফ্রড ট্র্যাকিং মেটা-ডেটা সহ)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'ডেটা লোড করতে সমস্যা হচ্ছে।' });
    }
});

// ৩. অর্ডারের স্ট্যাটাস আপডেট করা (Quick Status Select & Bulk Action)
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await Order.findByIdAndUpdate(id, { status });
        res.json({ success: true, message: `স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে!` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।' });
    }
});

// ৪. সম্পূর্ণ অর্ডার ডাটা এডিট ও আপডেট করা (Advanced Modal Form সহ নতুন মেটা ফিল্ডস)
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, quantity, shippingCost, discount, totalAmount, trackingCode, notes } = req.body;

        await Order.findByIdAndUpdate(id, { 
            name, phone, address, quantity, shippingCost, discount, totalAmount, trackingCode, notes 
        });

        res.json({ success: true, message: 'অর্ডার সফলভাবে আপডেট করা হয়েছে।' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'অর্ডার এডিট আপডেট ব্যর্থ হয়েছে।' });
    }
});

// ৫. অর্ডার ডিলিট করা
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Order.findByIdAndDelete(id);
        res.json({ success: true, message: 'অর্ডারটি ডেটাবেস থেকে মুছে ফেলা হয়েছে।' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'মুছে ফেলতে সমস্যা হয়েছে।' });
    }
});


/* =========================================================================
   🚚 STEADFAST COURIER INTEGRATION API
   ========================================================================= */

// ৬. স্ট্যাডফাস্ট কুরিয়ারে পার্সেল বুকিং পাঠানো
app.post('/api/courier/steadfast/send', async (req, res) => {

    try {

        const { orderId } = req.body;

        // ✅ Find Order
        const order = await Order.findById(orderId);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
            });

        }

        /* =========================================
           🚫 DUPLICATE PROTECTION
           ========================================= */

        if (
            order.courierSent === true ||
            (order.consignmentId && order.consignmentId !== '')
        ) {

            return res.status(400).json({

                success: false,

                duplicate: true,

                message:
                    'এই পার্সেল ইতোমধ্যে Steadfast এ পাঠানো হয়েছে!',

                consignment_id:
                    order.consignmentId

            });

        }

        /* =========================================
           🚚 STEADFAST API REQUEST
           ========================================= */

        const response = await fetch(
            'https://portal.packzy.com/api/v1/create_order',
            {

                method: 'POST',

                headers: {

                    'Api-Key': process.env.STEADFAST_API_KEY,

                    'Secret-Key': process.env.STEADFAST_SECRET_KEY,

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    invoice: order.orderId,

                    recipient_name: order.name,

                    recipient_phone: order.phone,

                    recipient_address: order.address,

                    cod_amount: order.totalAmount,

                    note:
                        order.notes || 'Modhuzira Order',

                    item_description:
                        `মধু Quantity ${order.quantity}`,

                    delivery_type: 0

                })

            }
        );

        const data = await response.json();

        console.log(data);

        /* =========================================
           ❌ API ERROR
           ========================================= */

        if (
            data.status !== 200 ||
            !data.consignment
        ) {

            return res.status(400).json({

                success: false,

                message:
                    data.message ||
                    'Steadfast booking failed'

            });

        }

        /* =========================================
           ✅ SAVE DATABASE
           ========================================= */

        // Steadfast Tracking Code
        order.trackingCode =
            data.consignment.tracking_code;

        // Steadfast Consignment ID
        order.consignmentId =
            String(data.consignment.consignment_id);

        order.courierSent = true;

        order.status = 'Ready to Ship';

        await order.save();

        /* =========================================
           ✅ SUCCESS RESPONSE
           ========================================= */

        res.json({

            success: true,

            message:
                'Parcel Send Successful!',

            tracking_code:
                data.consignment.tracking_code,

            consignment_id:
                data.consignment.consignment_id

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                'Courier API Connection Failed'

        });

    }

});

// ৭. কুরিয়ার ফ্রড চেক এক্সটেনশন (Mock Courier Analytics Router)
app.get('/api/courier/fraud-check/:phone', async (req, res) => {

    try {

        let phone = req.params.phone;

        // ✅ normalize number
        if (phone.startsWith('0')) {
            phone = '+88' + phone;
        }

        // ✅ API REQUEST
        const response = await fetch(
            'https://easybill.zatiq.tech/api/v1/receipts/fraud_check',
            {
                method: 'POST',

                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    'application-type': 'Merchant',
                    'device-type': 'Web',

                    // ✅ YOUR TOKEN
                    'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiODViOTMxMGEwNWM5YjY4YjJiZjkzZjJmYThkMjQ5YTEzN2NlZWFhOTRmM2E5YjMzNzVhZGM3MDRjODU2MjUzZmM4NzJmNzc4ZTUxY2YwMGQiLCJpYXQiOjE3ODAwNTI0OTUuOTQ1MjY4LCJuYmYiOjE3ODAwNTI0OTUuOTQ1MjcxLCJleHAiOjE4MTE1ODg0OTUuOTIyNjkzLCJzdWIiOiIyMDg3MDgiLCJzY29wZXMiOltdfQ.hW4sS4bghIglwIg9MyoU7K-Dhly2wJMcIX6S7_dFpipZ6hR_D3Ye-I639uJCkQ1xQ_rHQeWmOrYCpglubNsP9vh7Ngc5sJfAJIfYk8KAq1aUy-D8RlIIClfiqTh_MkX7kgUX5vsZfmL6mF4Iz2DymIxO2WT1do1UN5W9swzsPDPaXnIzsfBzH0SZwfJP4k22HAokpcEuMCF4YrkBb3WzYDPzvQNbi9WoHMppPYgdJZ_KWizanYUEnaFK6k0ss0KifQEnA-Uhjn8oRn9-e5TWtRJpXYeGEfQju4FDyOLA3hBi47Rs8ZRUeXlP1Z-eGpPPgz56Lnx-K_zhaz_6WIthenoGxTomytWaLx5ZnLpPlmRQkPIX0FTpz4EBB7Djxgdn1YIk87AvVPliv2ZJARvM7L0PajEfH-2BcQOed8SBZcLYgcLG8QYu-0rOg3Rovnm9fvR-wP9uU7sRuEuD3QYoabdaU2HQ0_q_YDIAAJqrjXlrrV84V12z196J_TgzvhA_XgR8LTygd2CfsHQL8oisFnQyBFh-r3lCJnshibXNKHykN_tQr7pzzXL3UHrMNYIUbAQYtQmr_da4XHMcazgw80DDeOWBtJv_gZqgvaiHB-NywW6mJE2qOwncP5Qv_xgWanNb4rnqckt1iftTagvZLfPphE2rx8TCMxfq-kSt02I',

                    'origin': 'https://merchant.zatiqeasy.com',
                    'referer': 'https://merchant.zatiqeasy.com/',

                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
                },

                body: JSON.stringify({
                    number: phone
                })
            }
        );

        // ✅ RAW RESPONSE
        const data = await response.json();

        console.log("FRAUD API RESPONSE:", data);

        // ❌ FAIL CHECK
        if (!data.success || !data.data) {

            return res.json({
                success: false,
                message: 'Fraud API failed',
                data: null
            });
        }

        // ✅ INTERNAL DATA
        const internal =
            data.data.internal_system || {};

        // ✅ PROVIDERS
        const providers =
            data.data.external_source?.delivery_providers || [];

        // ✅ SUMMARY
        const summary =
            providers.find(
                p => p.courier === 'summary'
            ) || {};

        // ✅ VALUES
        const totalOrders =
            summary.total_delivery_summary || 0;

        const successOrders =
            summary.successful_delivery_summary || 0;

        const cancelledOrders =
            summary.cancel_delivery_summary || 0;

        const successRate =
            summary.success_ratio_summary || 0;

        // ✅ RETURN RATE
        const returnRate =
            totalOrders > 0
                ? (cancelledOrders / totalOrders) * 100
                : 0;

        // ✅ RISK LOGIC
        let risk = 'SAFE';

        if (returnRate >= 50) {
            risk = 'HIGH';
        }
        else if (returnRate >= 30) {
            risk = 'MEDIUM';
        }

        // ✅ COURIER BREAKDOWN
        const couriers = providers
            .filter(p => p.courier !== 'summary')
            .map(p => {

                const courier = p.courier;

                return {
                    name: courier,

                    success:
                        p['successful_delivery_' + courier] || 0,

                    cancelled:
                        p['cancel_delivery_' + courier] || 0,

                    total:
                        p['total_delivery_' + courier] || 0
                };
            });

        // ✅ FINAL RESPONSE
        return res.json({

            success: true,

            message: 'Fraud status checked successfully',

            data: {

                phone,

                risk,

                returnRate:
                    Number(returnRate.toFixed(2)),

                internal: {
                    fraudOrders:
                        internal.total_fraud_orders || 0,

                    totalOrders:
                        internal.total_orders || 0,

                    completed:
                        internal.total_delivered_or_completed || 0
                },

                summary: {
                    success: successOrders,
                    cancelled: cancelledOrders,
                    total: totalOrders,
                    successRate
                },

                couriers
            }
        });

    } catch (err) {

        console.log("FRAUD API ERROR:", err);

        return res.json({

            success: false,

            message: err.message,

            data: null
        });
    }
});


// Fallback to client layout
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server Listening
app.listen(PORT, () => {
    console.log(`🚀 ব্যাকএন্ড এন্টারপ্রাইজ সার্ভার চালু হয়েছে: http://localhost:${PORT}`);
});