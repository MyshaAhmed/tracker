const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  speed: {
    type: Number,
    default: 0
  },
  battery: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Auto-delete old location records after 7 days
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Location', locationSchema);
