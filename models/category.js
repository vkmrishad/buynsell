// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define category schema
var CategorySchema = new Schema({
  _id: { type: String, unique: true, required: true },
  category_name: { type: String, unique: true, required: true},
  category_slug: { type: String, unique: true, required: true},

});

// Export category model
var collectionName = 'category_tbl';
var Category = mongoose.model('Category', CategorySchema, collectionName);
module.exports = Category;
