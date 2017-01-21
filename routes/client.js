'use strict';
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var bcrypt = require('bcryptjs');
var _ = require('underscore');
var changeCase = require('change-case');

var multer  = require('multer');
var rimraf = require('rimraf');
var fs = require('fs');

var format = 'hhhhhhhhhh';
var zen_id = require('zen-id').create(format);

var Userlist = require('../models/user');
var Place = require('../models/place');
var Post = require('../models/post');
var Category = require('../models/category');


function ensureUser(req, res, next){
	if(req.isAuthenticated()){
    if (req.user.role == 'User')
	  {
		return next();
	  }
	  else 
    {
	  req.logout();
		res.redirect('/');
	  }

	} else {
    req.logout();
		res.redirect('/');
	}
}


// Register
router.get('/register', function(req, res){

	if(!req.isAuthenticated()){

       res.render('client/register');
      }

      else
      {
      	res.redirect('/');
      }


});

// Login
router.get('/login', function(req, res){


      if(!req.isAuthenticated()){

       res.render('client/login');
      }

      else
      {
      	res.redirect('/');
      }

});


// Homepage
router.get('/', function(req, res){

Post.find({$and:[{status:"Published"}]}, function(err,posts) {

  res.render('client/index',{posts:posts});

}).limit(10).sort({date:-1});
       
});


// Register
router.get('/register', function(req, res){
    res.render('client/register');
});

// Login
router.get('/login', function(req, res){
    res.render('client/login');
});

// User Page
router.get('/dashboard', ensureUser, function(req, res){
	res.render('client/dashboard');
});



// Register Userlist
router.post('/register', function(req, res){
	var id = zen_id.generate().toUpperCase();
	var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(req.body.password, salt);
	var fname = req.body.fname;
	var lname = req.body.lname;
	var email = req.body.email;
	var username = req.body.username;
  var mnumber = req.body.mnumber;
	var password = hash;
  var country = "India";
	var role = "User";
	var status = "Active";


		var newUser = new Userlist({
			_id:id,
			fname: fname,
			lname: lname,
			email:email,
			username: username,
      mnumber: mnumber,
      country: country,
			password: password,
			status: status,
			role: role
		});

		newUser.save(function(err) {

			if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/register');
            }

            else
            {
              req.flash('success_msg', 'You accountcreated Succesfully!');
              res.redirect('/login');

            }


			});
});

passport.use('customer', new LocalStrategy(
  function(username,password, done) {
   Userlist.getUserByUsername(username, function(err, userauth){
   	if(err) throw err;
   	if(!userauth){
   		return done(null, false, {message: 'Invalid Username or Email'});
   	}

   Userlist.comparePassword(password, userauth.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, userauth);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
 }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Userlist.getUserById(id, function(err, user) {
    done(err, user);
  });
});


router.post('/login',
  passport.authenticate('customer', {successRedirect:'/', failureRedirect:'/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out Successfully!');

	res.redirect('/login');
});


/***********************************************************************************

Account Start

************************************************************************************/

router.get('/account',ensureUser,function(req,res){

  res.render('client/account');


});


// Edit Profile

router.post('/account/edit', ensureUser, function(req, res){

  Userlist.findOne({_id : req.user._id}, function (err, userlist){

          
                userlist.fname = req.body.fname;
                userlist.lname = req.body.lname;
                userlist.address1 = req.body.address1;
                userlist.address2 = req.body.address2;
                userlist.address3 = req.body.address3;
                userlist.place = req.body.place;
                userlist.landmark = req.body.landmark;
                userlist.district = req.body.district;
                userlist.state = req.body.state;
                userlist.pin = req.body.pin;



      userlist.save(function(err) {

      if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/account');
            }

            else
            {
              req.flash('success_msg', 'Profile Updated Succesfully!');
              res.redirect('/account');

            }

              
          });


        });

    });


// Change Password

router.post('/account/change-password', ensureUser, function(req, res){

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.cfmpassword, salt);

    Userlist.findOne({_id : req.user._id}, function(err,password){

            password.password = hash;

       bcrypt.compare(req.body.curpassword,req.user.password,function(err, isMatch) {

        if(isMatch)
        {
          bcrypt.compare(req.body.cfmpassword,req.user.password,function(err, isSame) {

            if(isSame)
            {

              req.flash('error_msg', 'Old and New Passwords are Same!');
              res.redirect('/account');

            }
            else
            {

              password.save(function(err){

              if (err)
              {
                req.flash('error_msg', 'Something went Wrong!');
                res.redirect('/account');
              } 
              else
              {
                
                req.flash('success_msg', 'Password Changed Successfully!');
                req.logout();
                res.redirect('/login');
                
              } 

              });

            }
            

            });

        }
        else
        {
          req.flash('error_msg', 'Wrong Current Password');
              res.redirect('/account');        }

       });
            
    });   

  });

/***********************************************************************************

Place Start

************************************************************************************/

// Place Page
router.get('/kerala/:place',function(req, res){


     Place.findOne({place_slug:req.params.place}, function(err, place) {
  

         if(place != null)
         {

           Post.find({seller_location:place._id}, function(err, posts) {

           Category.find({}, function(err, categories) {
           Place.find({}, function(err, places) { 

           if (err) throw err;
          
           res.render('client/place',{"posts":posts,categories:categories,place:place,places:places});

           })
           })
           })

         }
         else {
           res.redirect('/');
         }
      

      });

      

});

/***********************************************************************************

Category Start

************************************************************************************/

// Category Page
router.get('/kerala/:place/:cat',function(req, res){


     Place.findOne({place_slug:req.params.place}, function(err, place) {
     Category.findOne({category_slug:req.params.cat}, function(err, cat) {
  

         if(place != null && cat != null)
         {

           Post.find({$and:[{seller_location:place._id,category:cat._id}]}, function(err, posts) {

           Category.find({}, function(err, categories) {
           Place.find({}, function(err, places) { 

           if (err) throw err;
          
           res.render('client/category',{"posts":posts,categories:categories,place:place,places:places,cat:cat});

           })
           })
           })

         }
         else {
           res.redirect('/');
         }
      
      })
      });

      

});


/***********************************************************************************

Account My Ads Start

************************************************************************************/

// My Ads Page
router.get('/account/my-ads', ensureUser, function(req, res){

      Post.find({seller_id:req.user._id}, function(err, ads) {

         if (err) throw err;

        res.render('client/account-my-ads',{"ads":ads});

      });

});


router.get('/account/post-ad',ensureUser,function(req,res){

  async.parallel({
      categories: function(cb){
        Category.find({}, cb);
       },
      places: function(cb){
        Place.find({}, cb);
       }
      },
      function(err, results){

            res.render('client/post-ad',results);

     });

});


// Edit 
router.get('/account/post-ad/edit/:id', ensureUser, function(req,res){


   Post.findOne({_id:req.params.id}, function(err, post) {

      if(post != null)
         {

         if (err) throw err;
         Category.findOne({_id:post.category}, function(err, postCategory) {

         Category.find({}, function(err, categories) {

         Userlist.findOne({_id:post.seller_id}, function(err, userlist) {

         Place.find({}, function(err, places) {

         Place.findOne({_id:post.seller_location}, function(err, place) { 

         res.render('client/post-ad-edit',{"post":post,"postCategory":postCategory,
          "categories":categories,"userlist":userlist,places:places,place:place});

         }) 

         }) 

         })

         }) 

         }) 
      }    
      else   
      {

        res.redirect('/account/my-ads');

      }   
         
      });

          
});


// Add Post
router.post('/account/post-ad', ensureUser, function(req, res){

          var id = zen_id.generate().toUpperCase();
          var name = req.body.name;
          var description = req.body.description;
          var status = "Published";
          var category = req.body.category;
          var price = req.body.price;
          var seller_id = req.user._id;
          var seller_state = "Kerala";
          var seller_location = req.body.seller_location;
          

          var newPost = new Post ({

                              _id: id,
                              name: name,
                              category: category,
                              description:description,
                              status:status,
                              price:price,
                              seller_id:seller_id,
                              seller_state:seller_state,
                              seller_location:seller_location,

                             
          });


                      newPost.save(function(err){
                        if (err)
                        {
                          req.flash('error_msg', 'Something went Wrong!');
                          res.redirect('/account/post-ad');
                        }
                        else
                        {
                          req.flash('success_msg', 'Post Created Successfully!');
                          res.redirect('/account/post-ad/edit/'+id);
                        }

                      });
                



    });


// Edit Post

router.post('/account/post-ad/edit/:id', ensureUser, function(req, res){

  Post.findOne({_id : req.params.id}, function (err, post){
        
          post.name = req.body.name;
          post.description = req.body.description;
          post.category = req.body.category;
          post.price = req.body.price;
          post.seller_location = req.body.seller_location;


      post.save(function(err) {

      if (err)
            {
              req.flash('error_msg', 'Something went Wrong!');
              res.redirect('/account/post-ad/edit/'+req.params.id);
            }

            else
            {
              req.flash('success_msg', 'Ad Post Added Succesfully!');
              res.redirect('/account/my-ads');

            }

              
          });

        });

  });

// Post Delete Page
router.get('/account/post-ad/delete/:id', ensureUser, function(req, res){

      var pid = req.params.id;

      Post.findOne({_id : req.params.id}).remove(function(){

        rimraf('./public/uploads/posts/'+pid, function(err) {

        });

        req.flash('success_msg', 'Product Deleted Successfully!');
        res.redirect('/account/my-ads');
      });


});


// Add Post Image

router.post('/account/post-ad/upload/:id', ensureUser, function(req, res){

  var id = req.params.id;
  var dir = './public/uploads/posts/'+id;
  var date = Date.now();

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, dir);
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + date + '.jpg');
    }
  });
  var upload = multer({ storage : storage}).single('post_image');

  var image = "post_image-"+ date +".jpg";


        upload(req, res, function (err) {
             if (err) {
               console.log(err)
               return
             }
             else{}

                // Everything went fine
              });

        Post.findByIdAndUpdate({_id:id},
        {$push: {"image": {"img": image}}},
        {safe: true, upsert: true, new : true},
        function(err, model) {
  
          if (err)
          {
            // Redirect back 
            res.redirect('/error');
          }
          else
          {
            // Redirect back to edit post
            req.flash('success_msg', 'Post Image Added Successfully!');
            res.redirect('/account/post-ad/edit/'+id);
          }
        });

         
  });


// Delete Post Image
router.get('/account/post-ad/deleteimage/:id/:pimg', ensureUser, function(req, res){

    var id = req.params.id;
    var pimg = req.params.pimg;


    Post.findByIdAndUpdate({_id:id},
        {$pull: {"image": {img: pimg}}},
        {safe: true, upsert: true, new : true},
        function(err, model) {

       fs.unlink('./public/uploads/posts/'+id+"/"+pimg, function(err) {
  
          if (err)
          {
            // Redirect back to edit post
            res.redirect('/error');
          }
          else
          {
            // Redirect back to edit product
            req.flash('success_msg', 'Post Image Deleted Successfully!');
            res.redirect('/account/post-ad/next/'+id);
          }

        });

    });


  });


/***********************************************************************************

Ad Page Start

************************************************************************************/


// Edit 
router.get('/item/:id', function(req,res){


   Post.findOne({_id:req.params.id}, function(err, post) {

        if(post != null){

         if (err) throw err;
         Category.findOne({_id:post.category}, function(err, postCategory) {

         Category.find({}, function(err, categories) {

         Userlist.findOne({_id:post.seller_id}, function(err, userlist) {

         Place.find({}, function(err, places) {

         Place.findOne({_id:post.seller_location}, function(err, place) { 

         res.render('client/ad-details',{"post":post,"postCategory":postCategory,
          "categories":categories,"userlist":userlist,places:places,place:place});

         }) 

         }) 

         })

         }) 

         }) 
        }
        else
        {
          res.redirect('/');
        } 
         
      });

          
});


/***********************************************************************************

Searchs Start

************************************************************************************/






module.exports = router;
