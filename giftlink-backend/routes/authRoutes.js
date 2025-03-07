const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');

const logger = pino();
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `giftsdb` in MongoDB through `connectToDatabase` in `db.js`
        const db = await connectToDatabase();
        // Task 2: Access MongoDB collection
        const Users = db.collection('users');
        //Task 3: Check for existing email
        const existingEmail = await Users.findOne({ email: req.body.email});
        if (existingEmail) {
            return res.json({ message: "Email already in use"});
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        const email = req.body.email;
        // {{insert code here}} //Task 4: Save user details in database

        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

         // {{insert code here}} //Task 5: Create JWT authentication with user._id as payload
        logger.info('User registered successfully');
        res.json({authtoken,email});
    } catch (e) {
         return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    console.log("\n\n Inside login")
    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const user = await collection.findOne({ email: req.body.email });

        if (user) {
            let result = await bcryptjs.compare(req.body.password, user.password)
            if(!result) {
                logger.error('Passwords do not match');
                return res.status(404).json({ error: 'Wrong pasword' });
            }

            let payload = {
                user: {
                    id: user._id.toString(),
                },
            };

            const userName = user.firstName;
            const userEmail = user.email;
            
            const authtoken = jwt.sign(payload, JWT_SECRET);
            logger.info('User logged in successfully');
            return res.status(200).json({ authtoken, userName, userEmail });
        } else {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        logger.error(e);
        return res.status(500).json({ error: 'Internal server error', details: e.message });
      }
});

router.put('/update', async (req, res) => {
    // Task 2: Validate the input using `validationResult` and return approiate message if there is an error.
    const errors = validationResult(req);
    // Task 3: Check if `email` is present in the header and throw an appropriate error message if not present.
    if (!errors.isEmpty()) {
        logger.error('Validation errors in update request', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const email = req.headers.email;
        if (!email) {
            logger.error('Email not found in the request headers');
            return res.status(400).json({ error: "Email not found in the request headers" });
        }
        //Task 4: Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection("users");
        //Task 5: Find user credentials
        const existingUser = await collection.findOne({ email });
        if (!existingUser) {
            logger.error('User not found');
            return res.status(404).json({ error: "User not found" });
        }
        existingUser.firstName = req.body.name;
        existingUser.updatedAt = new Date();
        //Task 6: Update user credentials in DB
        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );
        //Task 7: Create JWT authentication with user._id as payload using secret key from .env file
        const payload = {
            user: {
                id: updatedUser._id.toString(),
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User updated successfully');
        res.json({ authtoken });
    } catch (error) {
        logger.error(error);
        return res.status(500).send("Internal Server Error");
    }
});

module.exports = router;