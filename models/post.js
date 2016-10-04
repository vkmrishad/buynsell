// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// Define product schema
var PostSchema = new Schema({
  _id: { type: String, unique: true ,required: true },
  name: { type: String , required: true},
  category: { type: String, required: true},
  status: { type: String},
  date: { type: Date, default: Date.now },
  price:{ type: String},
  description: { type: String},
  seller_id:{ type: String},
  seller_state:{ type: String},
  seller_location:{ type: String},

  image: [ {img: {type: String} }]

});

// Export postmodel
var collectionName = 'post_tbl';
var Post = mongoose.model('Post', PostSchema, collectionName);
module.exports = Post;
