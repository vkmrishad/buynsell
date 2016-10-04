// Require mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

// Define Userlist schema
var UserlistSchema = new Schema({

	_id: { type: String, unique: true, required: true },
	fname: { type: String},
	lname: { type: String},
	username: { type: String,unique:true},
	password: { type: String},
	email: { type: String,unique:true},
	address1: { type: String},
	address2: { type: String},
	address3: { type: String},
	place: { type: String},
	landmark: { type: String},
	district: { type: String},
	state: { type: String},
	country: { type: String},
	pin: { type: String},
	lnumber: { type: String},
	mnumber: { type: String},
	avatar: { type: String},
	status: { type: String},
	role: { type: String}

});

// Export Userlist model
var collectionName = 'user_tbl';
var Userlist = module.exports = mongoose.model('Userlist', UserlistSchema, collectionName);
module.exports = Userlist;


module.exports.getUserByUsername = function(username, callback){
	var query = {$or: [{username: username}, {email: username}],$and: [{role: 'User',status: 'Active'}] };
	Userlist.findOne(query, callback);
}
module.exports.getAdminByUsername = function(username, callback){
	var query = {$or: [{username: username}, {email: username}],$and: [{role: 'Admin',status: 'Active'}] };
	Userlist.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	Userlist.findById(id, callback);
}

module.exports.getAdminById = function(id, callback){
	Userlist.findById(id, callback);
}


module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
