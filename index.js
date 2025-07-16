// index.js
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory database for simplicity
let users = [];
let exercises = [];
let nextUserId = 1;
let nextExerciseId = 1;

// Main route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// API Routes

// 1. Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  const newUser = {
    username: username,
    _id: nextUserId.toString()
  };
  
  users.push(newUser);
  nextUserId++;
  
  res.json(newUser);
});

// 2. Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. Add exercise to user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  
  // Check if user exists
  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Validate data
  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }
  
  // Handle date
  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
  } else {
    exerciseDate = new Date();
  }
  
  const exercise = {
    _id: nextExerciseId.toString(),
    userId: userId,
    description: description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString()
  };
  
  exercises.push(exercise);
  nextExerciseId++;
  
  // Response with user object + exercise
  const response = {
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  };
  
  res.json(response);
});

// 4. Get user exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  
  // Check if user exists
  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Get user exercises
  let userExercises = exercises.filter(ex => ex.userId === userId);
  
  // Filter by date if specified
  if (from || to) {
    userExercises = userExercises.filter(ex => {
      const exerciseDate = new Date(ex.date);
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      
      if (fromDate && exerciseDate < fromDate) return false;
      if (toDate && exerciseDate > toDate) return false;
      
      return true;
    });
  }
  
  // Limit number of results
  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }
  
  // Format exercises for response
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date
  }));
  
  const response = {
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log
  };
  
  res.json(response);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app;