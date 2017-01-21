var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var multer  = require('multer');
var rimraf = require('rimraf');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var changeCase = require('change-case');

var format = 'hhhhhhhhhh';
var zen_id = require('zen-id').create(format);

var Post = require('../models/post');
var Category = require('../models/category');
var Place = require('../models/place');
var Userlist = require('../models/user');

function ensureAdmin(req, res, next){
	if(req.isAuthenticated()){
	  if (req.user.role == 'Admin')
	  {	
		return next();
	  }
	  else {

	  	req.logout();
		res.redirect('/admin');
	   }

	} 
	else {
		res.redirect('/admin');
	}
}

/***********************************************************************************

Index Start

************************************************************************************/


// Register
router.get('/admin/register', function(req, res){

	if(!req.isAuthenticated()){
	
       res.render('admin/register');
      }

      else
      {
      	res.redirect('/admin/dashboard');
      }


});

// Login
router.get('/admin/', function(req, res){


      if(!req.isAuthenticated()){
	
       res.render('admin/login');
      }

      else
      {
      	res.redirect('/admin/dashboard');
      }

});

// 404 Page
router.get('/admin/404', function(req, res){
	res.render('admin/404');
});

// Dashboard Page
router.get('/admin/dashboard', ensureAdmin, function(req, res){
	res.render('admin/dashboard');
});

// Register Userlist
router.post('/admin/register', function(req, res){
	
	var id = zen_id.generate().toUpperCase();
	var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(req.body.cpassword, salt);
	var fname = req.body.fname;
	var lname = req.body.lname;
	var email = req.body.email;
	var username = req.body.username;
    var mnumber = req.body.mnumber;
	var password = hash;
    var country = "India";
	var role = "Admin";
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

		newUser.save(function(err){
			if (err)
				{
				req.flash('error_msg', 'Something went Wrong!');
				res.redirect('/admin');
				console.log(err);
				}
				else
				{
                req.flash('success_msg', 'You are Successfully Registered!');
			    res.redirect('/admin');
				}
		});		

});

passport.use('authAdminWeb', new LocalStrategy(
  function(username,password, done) {
   Userlist.getAdminByUsername(username, function(err, admin){
   	if(err) throw err;
   	if(!admin){
   		return done(null, false, {message: 'Invalid Username or Email'});
   	}

   	Userlist.comparePassword(password, admin.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, admin);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
 }));

passport.serializeUser(function(admin, done) {
  done(null, admin._id);
});

passport.deserializeUser(function(id, done) {
  Userlist.getAdminById(id, function(err, admin) {
    done(err, admin);
  });
});


router.post('/admin',
  passport.authenticate('authAdminWeb', {successRedirect:'/admin/dashboard', failureRedirect:'/admin',failureFlash: true}),
  function(req, res) {
    res.redirect('/admin/dashboard');
  });

router.get('/admin/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/admin');
});


/***********************************************************************************

Account Start

************************************************************************************/

router.get('/admin/account',ensureAdmin,function(req,res){

  res.render('admin/account');


});


// Edit Profile

router.post('/admin/account/edit', ensureAdmin, function(req, res){

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
              res.redirect('/admin/account');
            }

            else
            {
              req.flash('success_msg', 'Profile Updated Succesfully!');
              res.redirect('/admin/account');

            }

              
          });


        });

    });


// Change Password

router.post('/admin/account/change-password', ensureAdmin, function(req, res){

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
              res.redirect('/admin/account');

            }
            else
            {

              password.save(function(err){

              if (err)
              {
                req.flash('error_msg', 'Something went Wrong!');
                res.redirect('/admin/account');
              } 
              else
              {
                
                req.flash('success_msg', 'Password Changed Successfully!');
                req.logout();
                res.redirect('/admin');
                
              } 

              });

            }
            

            });

        }
        else
        {
          req.flash('error_msg', 'Wrong Current Password');
              res.redirect('/admin/account');        }

       });
            
    });   

  });

/***********************************************************************************

Posts Start

************************************************************************************/

// Posts Page
router.get('/admin/posts',ensureAdmin, function(req, res){


	Post.find({}, function(err, posts) {

         if (err) throw err;

         

        res.render('admin/posts',{"posts":posts});

      });

});

// Posts Page
router.get('/admin/post/edit/:id',ensureAdmin, function(req, res){


	Post.findOne({_id:req.params.id}, function(err, post) {

         if (err) throw err;         

        res.render('admin/post-edit',{"post":post});

      });

});

// Edit Post

router.post('/admin/post/edit/:id', ensureAdmin, function(req, res){

  Post.findOne({_id : req.params.id}, function (err, post){

          
                post.status = req.body.status;
        

      post.save(function(err) {

      if (err)
            {
              req.flash('error_msg', 'Something went Wrong !');
              res.redirect('/admin/post/edit/'+req.params.id);
            }

            else
            {
              req.flash('success_msg', 'Post Updated Succesfully!');
              res.redirect('/admin/post/edit/'+req.params.id);

            }

              
          });


        });

    });


/***********************************************************************************

Users Start

************************************************************************************/

// Users Page
router.get('/admin/users',ensureAdmin, function(req, res){

	Userlist.find({}, function(err, users) {

         if (err) throw err;

        res.render('admin/users',{"users":users});

      });

});

// User Add Page
router.get('/admin/user/add',ensureAdmin, function(req, res){

        res.render('admin/user-add');

});

// User View Page
router.get('/admin/user/view/:id',ensureAdmin, function(req, res){

	Userlist.findOne({_id:req.params.id}, function(err, userlist) {

         if (err) throw err;

         if(userlist != null)
         {
           res.render('admin/user-view',{"userlist":userlist});
         }
         else {
           res.redirect('/admin');
         }

      });

});


// User Edit Page
router.get('/admin/user/edit/:id',ensureAdmin, function(req, res){

	Userlist.findOne({_id:req.params.id}, function(err, userlist) {

         if (err) throw err;

         if(userlist != null)
         {
           res.render('admin/user-edit',{"userlist":userlist});
         }
         else {
           res.redirect('/admin');
         }

        

      });

});

// Userlist Delete Page
router.get('/admin/user/delete/:id', ensureAdmin, function(req, res){

      Userlist.findOne({_id : req.params.id}, function(err,avatar){

        var img = avatar.avatar;

        Userlist.findOne({_id : req.params.id}).remove(function(){

          //rimraf('./public/uploads/posts/'+img, function(err) {

          //});

        });

        req.flash('success_msg', 'User Deleted Successfully!');
        res.redirect('/admin/users');
      });

});


// Add Userlist
router.post('/admin/user/add', ensureAdmin, function(req, res){

				  var id = zen_id.generate().toUpperCase();
	              var salt = bcrypt.genSaltSync(10);
				  var hash = bcrypt.hashSync(req.body.cfmpassword, salt);
				  var fname = req.body.fname;
				  var lname = req.body.lname;
                  var username = req.body.username;
                  var email = req.body.email;
                  var password = hash;
                  var address1 = req.body.address1;
                  var address2 = req.body.address2;
                  var address3 = req.body.address3;
                  var place = req.body.place;
                  var landmark = req.body.landmark;
                  var district = req.body.district;
                  var state = req.body.state;
                  var country = "India";
                  var pin = req.body.pin;
                  var lnumber = req.body.lnumber;
                  var mnumber = req.body.mnumber;
                  var status = req.body.status;
                  var role = req.body.role;


           				var newUserlist = new Userlist ({
           					    _id:id,
								fname:fname,
								lname:lname,
								username:username,
								email:email,
								password:password,
								address1:address1,
								address2:address2,
								address3:address3,
								place:place,
								landmark:landmark,
								district:district,
								state:state,
								country:country,
								pin:pin,
								lnumber:lnumber,
								mnumber:mnumber,
								status:status,
								role:role,

			                    });

			newUserlist.save(function(err) {

			if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/admin/user/add');
            }

            else
            {
              req.flash('success_msg', 'User Added Succesfully!');
              res.redirect('/admin/user/edit/'+id);

            }

							
			});





    });


// Edit Profile

router.post('/admin/user/edit/:id', ensureAdmin, function(req, res){

  Userlist.findOne({_id : req.params.id}, function (err, userlist){

          
                userlist.fname = req.body.fname;
                userlist.lname = req.body.lname;
                userlist.status = req.body.status;
                userlist.role = req.body.role;
                userlist.username = req.body.username;
                userlist.email = req.body.email;
                userlist.mnumber = req.body.mnumber;
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
              res.redirect('/admin/user/edit/'+req.params.id);
            }

            else
            {
              req.flash('success_msg', 'Details Updated Succesfully!');
              res.redirect('/admin/user/edit/'+req.params.id);

            }

              
          });


        });

    });


// Change Password

router.post('/admin/user/change-password/:id', ensureAdmin, function(req, res){

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.cfmpassword, salt);

    Userlist.findOne({_id : req.params.id}, function(err,password){

            password.password = hash;

       bcrypt.compare(req.body.curpassword,req.user.password,function(err, isMatch) {

        if(isMatch)
        {
          bcrypt.compare(req.body.cfmpassword,req.user.password,function(err, isSame) {

            if(isSame)
            {

              req.flash('error_msg', 'Old and New Passwords are Same!');
              res.redirect('/admin/user/edit/'+req.params.id);

            }
            else
            {

              password.save(function(err){

              if (err)
              {
                req.flash('error_msg', 'Something went Wrong!');
                res.redirect('/admin/user/edit/'+req.params.id);
              } 
              else
              {
                
                req.flash('success_msg', 'Password Changed Successfully!');
                req.logout();
                res.redirect('/admin');
                
              } 

              });

            }
            

            });

        }
        else
        {
          req.flash('error_msg', 'Wrong Current Password');
              res.redirect('/admin/user/edit/'+req.params.id);  
        }

       });
            
    });   

  });

/***********************************************************************************

Category Start

************************************************************************************/


// Category's Page
router.get('/admin/categories', ensureAdmin, function(req, res){

      Category.find({}, function(err, categories) {

         if (err) throw err;

  // object of all the categories
        res.render('admin/categories',{"categories":categories});
      });

});

// Category Add Page
router.get('/admin/category/add', ensureAdmin, function(req, res){

        res.render('admin/category-add');

    });


// Category Edit Page
router.get('/admin/category/edit/:id', ensureAdmin, function(req, res){

	async.parallel({
			category: function(cb){
				Category.findOne({_id: req.params.id}, cb);
			 }
			},
			function(err, results){

				 if(results.category != null)
				 {
			     res.render('admin/category-edit',results);
		     }
				 else {
				 	 res.redirect('/admin');
				 }

		 });

 });


// Category Delete Page
router.get('/admin/category/delete/:id', ensureAdmin, function(req, res){

      Category.findOne({_id : req.params.id}).remove(function(){

				req.flash('success_msg', 'Category Deleted Succesfully!');
				res.redirect('/admin/categories');});

  });

// Add Category
router.post('/admin/category/add', ensureAdmin, function(req, res){

									var id = zen_id.generate().toUpperCase();
                                    var category_name = req.body.category_name;
                                    var category_slug = req.body.category_slug;



								var newCategory = new Category ({
									_id:id,
			                        category_name: category_name,
			                        category_slug: category_slug,

			                    });


								newCategory.save(function(err){

			                    if (err)
									{
										req.flash('error_msg', 'Category already Exists!');
				                    	res.redirect('/admin/category/add');
									}
									else
									{
										req.flash('success_msg', 'Category Added Succesfully!');
				                    	res.redirect('/admin/category/edit/'+id);
									}

			                });


    });

// Edit Category
router.post('/admin/category/edit/:id', ensureAdmin, function(req, res){

        	   var id = req.params.id;

  					Category.findOne({_id : req.params.id}, function (err, category){


					 // Update found category
					category.category_name = req.body.category_name;
					category.category_slug = req.body.category_slug;


					category.save(function(err) {

						if (err)
						{
							req.flash('error_msg', 'Category or Slug already Exists!');
							res.redirect('/admin/category/edit/'+id);
							
						}
						else
						{
							req.flash('success_msg', 'Category Updated Succesfully!');
							res.redirect('/admin/category/edit/'+id);
         			    }

		    	});

       });
  });

/***********************************************************************************

Place Start

************************************************************************************/


// Places Page
router.get('/admin/places', ensureAdmin, function(req, res){

      Place.find({}, function(err, places) {

         if (err) throw err;

  // object of all the places
        res.render('admin/places',{"places":places});
      });

});

// Place Add Page
router.get('/admin/place/add', ensureAdmin, function(req, res){

        res.render('admin/place-add');

    });


// Place Edit Page
router.get('/admin/place/edit/:id', ensureAdmin, function(req, res){

	async.parallel({
			place: function(cb){
				Place.findOne({_id: req.params.id}, cb);
			 }
			},
			function(err, results){

				 if(results.place != null)
				 {
			     res.render('admin/place-edit',results);
		     }
				 else {
				 	 res.redirect('/admin');
				 }

		 });

 });


// Place Delete Page
router.get('/admin/place/delete/:id', ensureAdmin, function(req, res){

      Place.findOne({_id : req.params.id}).remove(function(){

				req.flash('success_msg', 'Place Deleted Succesfully!');
				res.redirect('/admin/places');});

  });

// Add Place
router.post('/admin/place/add', ensureAdmin, function(req, res){

									var id = zen_id.generate().toUpperCase();
                                    var place_name = req.body.place_name;
                                    var place_slug = req.body.place_slug;



								var newPlace = new Place ({
									_id:id,
			                        place_name: place_name,
			                        place_slug: place_slug,

			                    });


								newPlace.save(function(err){

			                    if (err)
									{
										req.flash('error_msg', 'Place already Exists!');
				                    	res.redirect('/admin/place/add');
									}
									else
									{
										req.flash('success_msg', 'Place Added Succesfully!');
				                    	res.redirect('/admin/place/edit/'+id);
									}

			                });


    });

// Edit Place
router.post('/admin/place/edit/:id', ensureAdmin, function(req, res){

        	   var id = req.params.id;

  					Place.findOne({_id : req.params.id}, function (err, place){


					 // Update found place
				    place.place_name = req.body.place_name;
					place.place_slug = req.body.place_slug;


					place.save(function(err) {

						if (err)
						{
							req.flash('error_msg', 'Place or Slug already Exists!');
							res.redirect('/admin/place/edit/'+id);
							
						}
						else
						{
							req.flash('success_msg', 'Place Updated Succesfully!');
							res.redirect('/admin/place/edit/'+id);
         			    }

		    	});

       });
  });



module.exports = router;
