const express = require('express');
const app = express();
const path = require('path');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const { connectToDatabase, getClient } = require('./db');
const bodyParser = require('body-parser'); // Add body-parser middlewarei
const { MongoClient } = require('mongodb'); 
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');

app.set('view engine', 'ejs');

// Connect to MongoDB
connectToDatabase();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON data in requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
    const db = getClient().db('Black_lion_store');
    const collection = db.collection('products');

    try {
        const products = await collection.find().toArray();
        // Render the 'index' view and pass the products as a variable
	    res.render('index', { products, popperVersion: '2.11.6' });
    } catch (error) {
        console.error('Error fetching products from MongoDB:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/', (req, res) => {
  // Retrieve image data from MongoDB (replace this with your own MongoDB logic)
  const imageData = retrieveImageDataFromMongoDB();

  // Render the HTML page and pass image data
  res.render('welcome', { imageData });
});

// Create a register page (GET request)
app.get('/register', (req, res) => {
  res.render('register'); // Assuming you have a 'register' view
});

app.get('/login', (req, res) => {
  // Handle the login page route
  res.render('login');
});

// Define the User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Your hashPassword function
const hashPassword = async (password) => {
  // Generate a salt and hash the password
  const saltRounds = 10; // You can adjust this value based on your security requirements
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

app.post('/api/login', async (req, res) => {
  const username = req.body.username;
	const password = req.body.password;

	console.log('Username:', username);
console.log('Password:', password);
	let client;
  try {
	  // Connect to MongoDB
	  const client = new MongoClient(process.env.MONGODB_URI);
  // Connect to MongoDBawait client.connect();
	  await client.connect();

    // Access the users collection
    const collection = client.db().collection('user');

console.log('Successfully accessed the users collection');
	  // Hash the provided password
    const hashedPassword = await hashPassword(password);


    // Perform authentication logic against MongoDB
    const user = await collection.findOne({ username, password });

	  console.log('Found user:', JSON.stringify(user));

if (user) {
      // Redirect to home page with user profile
      res.render('profile', { user }); // You can pass additional data in the URL or use sessions for more advanced scenarios
    } else {
      // If authentication fails, render the login page again with an error message
      res.render('login', { error: 'Invalid username or password' });
    }

  } catch (error) {
        console.error('Error connecting to MongoDB:', error);
	    res.render('login', { error: 'Internal Server Error' });
        res.status(500).send('Internal Server Error');
  } finally {
	  if (client) {
    // Close the MongoDB connection
    await client.close();
  }
  }
});

// Handle registration form submission (POST request)
app.post('/api/register', async (req, res) => {
        console.log('Request body:', req.body);
  try {
    const { firstName, lastName, email, password, address, phoneNumber } = req.body;

    const db = getClient().db('Black_lion_store');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      address,
      phoneNumber,
    };

    await usersCollection.insertOne(newUser);

    res.status(200).send('Registration successful!');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

	app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
