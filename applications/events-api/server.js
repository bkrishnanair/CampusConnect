const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory event store (for demo purposes)
let events = [
  { id: 1, title: 'Welcome Event', description: 'Welcome to CampusConnect', date: new Date().toISOString() }
];
let eventId = 2;

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Events API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'events-api' });
});

// GET all events
app.get('/api/events', (req, res) => {
  res.status(200).json({ events });
});

// GET a single event by ID
app.get('/api/events/:id', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.status(200).json(event);
});

// POST a new event
app.post('/api/events', (req, res) => {
  const { title, description, date } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  
  const newEvent = {
    id: eventId++,
    title,
    description: description || '',
    date: date || new Date().toISOString()
  };
  
  events.push(newEvent);
  res.status(201).json(newEvent);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Events API listening on port ${PORT}`);
});
