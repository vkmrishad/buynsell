// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define category schema
var PlaceSchema = new Schema({
  _id: { type: String, unique: true, required: true },
  place_name: { type: String, unique: true, required: true},
  place_slug: { type: String, unique: true, required: true},

});

// Export category model
var collectionName = 'place_tbl';
var Place = mongoose.model('Place', PlaceSchema, collectionName);
module.exports = Place;
