// index.js
const moment = require('moment')
const today = moment().startOf('day')

/**
 * Required External Modules
 */
 const express = require("express");
 const path = require("path");

/**
 * App Variables
 */
 const app = express();
 const port = process.env.PORT || "8000";
 app.set("view engine", "ejs")
 app.use(express.static("public"))
 const session = require("express-session")
 const { authUser } = require("./simpleAuth")
 // initialize express-session to allow us track the logged-in user across sessions.
 app.use(
	 session({
		 key: "user_sid",
		 secret: "somerandonstuffs",
		 resave: false,
		 saveUninitialized: false,
		 cookie: {
			 expires: 600000,
		 },
	 })
 )

 // Connect to mongo
 
const MongoClient = require("mongodb").MongoClient
const bodyParser = require("body-parser")
MongoClient.connect("mongodb+srv://HotDog:HotDog@cluster0.9q7j7.mongodb.net/HotDog?retryWrites=true&w=majority", { useUnifiedTopology: true }).then(client => {
	console.log("Connected to Database")
	app.use(bodyParser.urlencoded({ extended: true }))

	/**
 	* Routes Definitions
 	*/
	// GET functions
	app.get("/", (req, res) => {
		res.render("homepage")
		res.status(200)
	})

	app.get("/Login", (req, res) => {
		res.render("Login")
	})

	app.get("/Register", (req, res) => {
		res.render("Register")
	})

	app.get("/forgot_my_password", (req, res) => {
		res.render("forgot_my_password")
	})

	app.get("/user_homepage", authUser, (req, res) => {
		// Connect to db and collection
		db = client.db("dogs")
		db_collection = db.collection("dogs_info")

		if (db_collection) {
			db_collection.find({ "dog_owner_id": req.session.user.id }).toArray(function (err, dogs) {
				res.render("user_homepage", { user_first_name: req.session.user.first_name, dogs_info: dogs, curr_dog: null })
			})
		}

	})

	app.get("/profile", authUser, (req, res) => {
		var db = client.db("users")
		var db_collection = db.collection("users_info")

		db_collection.find({ "id": req.session.user.id }).toArray(function (err, allDetails) {
			if (err) {
				console.log(err)
			}
			else {
				res.render("profile", { user_first_name: req.session.user.first_name, details: allDetails[0] })
			}
		})
	})

	app.get("/my_dogs", authUser, (req, res) => {
		// Connect to db and collection
		db = client.db("dogs")
		db_collection = db.collection("dogs_info")

		if (db_collection) {
			db_collection.find({ "dog_owner_id": req.session.user.id }).toArray(function (err, dogs) {
				res.render("my_dogs", { user_first_name: req.session.user.first_name, dogs_info: dogs })
			})
		}
		
	})

	app.get("/add_dog", authUser, (req, res) => {
		res.render("add_dog")
	})

	app.get("/hourly_distance/:dog_id", authUser, (req, res) => {

		/*
		console.log(req.params.dog_id)
		res.render("hourly_distance",{ user_first_name: req.session.user.first_name})
		*/
		var db = client.db("dogs")
		var db_collection_dist_hourly = db.collection("dog_AGG_avg_hourly")
		var ObjectId = require('mongodb').ObjectID;
		db_collection_dist_hourly.find({ "dog_id": new ObjectId(req.params.dog_id), date_created: {
			$gte: today.toDate(), 
			$lt: moment(today).endOf('day').toDate()
			}}).toArray(function (err, dist_info) {
				datasets_dists = new Array(24).fill(0);
				dist_info.forEach(element => {
					hour = element.date_created.toString()
					hour = (((hour.split(' '))[4]).split(':'))[0]
					hour = Number(hour) - 3
					datasets_dists[hour] = element.walking_met_sum
					
				});
				console.log(req.params.dog_id)
				res.render("hourly_distance", { user_first_name: req.session.user.first_name,curr_dog: req.params.dog_id, distance_hourly: datasets_dists})
			})
	})

	app.get("/hourly_temp/:dog_id", authUser, (req, res) => {

		var db = client.db("dogs")
		var db_collection_dist_hourly = db.collection("dog_AGG_avg_hourly")
		var ObjectId = require('mongodb').ObjectID;
		db_collection_dist_hourly.find({ "dog_id": new ObjectId(req.params.dog_id), date_created: {
			$gte: today.toDate(), 
			$lt: moment(today).endOf('day').toDate()
			}}).toArray(function (err, dist_info) {
				datasets_dists = new Array(24).fill(0);
				dist_info.forEach(element => {
					hour = element.date_created.toString()
					hour = (((hour.split(' '))[4]).split(':'))[0]
					hour = Number(hour) - 3
					datasets_dists[hour] = element.temp_hourly_avg
				});
				console.log(req.params.dog_id)
				res.render("hourly_temp", { user_first_name: req.session.user.first_name,curr_dog: req.params.dog_id, distance_hourly: datasets_dists})
			})
	})


	app.get("/daily_distance/:dog_id", authUser, (req, res) => {

		var db = client.db("dogs")
		var db_collection_dist_hourly = db.collection("dog_AGG_avg_daily")
		var ObjectId = require('mongodb').ObjectID;
		db_collection_dist_hourly.find({ "dog_id": new ObjectId(req.params.dog_id), date_created: {
			$gte: moment().day(-7).toDate(),
			$lt: today.toDate()
			}}).toArray(function (err, dist_info) {
				datasets_dists = new Array(7).fill(0);
				dist_info.forEach(element => {
					day = element.date_created.toString()
					day = ((day.split(' '))[0])
					switch(day){
						case "Sun" :
							datasets_dists[0] = element.walking_hours
							return;
						case "Mon" :
							datasets_dists[1] = element.walking_hours
							return;
						case "Tue" :
							datasets_dists[2] = element.walking_hours
							return;
						case "Wed" :
							datasets_dists[3] = element.walking_hours
							return;							
						case "Thu" :
							datasets_dists[4] = element.walking_hours
							return;	
						case "Fri" :
							datasets_dists[5] = element.walking_hours
							return;							
						case "Sat" :
							datasets_dists[6] = element.walking_hours
							return;									
					}
				});
				console.log(req.params.dog_id)
				res.render("daily_distance", { user_first_name: req.session.user.first_name,curr_dog: req.params.dog_id, distance_daily: datasets_dists})
			})
	})

	app.get("/daily_pulse/:dog_id", authUser, (req, res) => {

		var db = client.db("dogs")
		var db_collection_dist_hourly = db.collection("dog_AGG_avg_daily")
		var ObjectId = require('mongodb').ObjectID;
		db_collection_dist_hourly.find({ "dog_id": new ObjectId(req.params.dog_id), date_created: {
			$gte: moment().day(-7).toDate(),
			$lt: today.toDate()
			}}).toArray(function (err, dist_info) {
				datasets_dists = new Array(7).fill(0);
				dist_info.forEach(element => {
					day = element.date_created.toString()
					day = ((day.split(' '))[0])
					switch(day){
						case "Sun" :
							datasets_dists[0] = element.pulse_hourly_avg
							return;
						case "Mon" :
							datasets_dists[1] = element.pulse_hourly_avg
							return;
						case "Tue" :
							datasets_dists[2] = element.pulse_hourly_avg
							return;
						case "Wed" :
							datasets_dists[3] = element.pulse_hourly_avg
							return;							
						case "Thu" :
							datasets_dists[4] = element.pulse_hourly_avg
							return;	
						case "Fri" :
							datasets_dists[5] = element.pulse_hourly_avg
							return;							
						case "Sat" :
							datasets_dists[6] = element.pulse_hourly_avg
							return;									
					}
				});
				res.render("daily_pulse", { user_first_name: req.session.user.first_name,curr_dog: req.params.dog_id, pulse_daily: datasets_dists})
			})
	})

	app.get("/daily_temp/:dog_id", authUser, (req, res) => {

		var db = client.db("dogs")
		var db_collection_dist_hourly = db.collection("dog_AGG_avg_daily")
		var ObjectId = require('mongodb').ObjectID;
		db_collection_dist_hourly.find({ "dog_id": new ObjectId(req.params.dog_id), date_created: {
			$gte: moment().day(-7).toDate(),
			$lt: today.toDate()
			}}).toArray(function (err, dist_info) {
				datasets_dists = new Array(7).fill(0);
				dist_info.forEach(element => {
					day = element.date_created.toString()
					day = ((day.split(' '))[0])
					switch(day){
						case "Sun" :
							datasets_dists[0] = element.temp_daily_avg
							return;
						case "Mon" :
							datasets_dists[1] = element.temp_daily_avg
							return;
						case "Tue" :
							datasets_dists[2] = element.temp_daily_avg
							return;
						case "Wed" :
							datasets_dists[3] = element.temp_daily_avg
							return;							
						case "Thu" :
							datasets_dists[4] = element.temp_daily_avg
							return;	
						case "Fri" :
							datasets_dists[5] = element.temp_daily_avg
							return;							
						case "Sat" :
							datasets_dists[6] = element.temp_daily_avg
							return;									
					}
				});
				res.render("daily_temp", { user_first_name: req.session.user.first_name,curr_dog: req.params.dog_id, temp_daily: datasets_dists})
			})
	})


	app.get("/hourly_pulse/:dog_id", authUser, (req, res) => {

		var db = client.db("dogs")
		var db_collection_dist_hourly = db.collection("dog_AGG_avg_hourly")
		var ObjectId = require('mongodb').ObjectID;
		db_collection_dist_hourly.find({ "dog_id": new ObjectId(req.params.dog_id), date_created: {
			$gte: today.toDate(), 
			$lt: moment(today).endOf('day').toDate()
			}}).toArray(function (err, dist_info) {
				datasets_dists = new Array(24).fill(0);
				dist_info.forEach(element => {
					hour = element.date_created.toString()
					hour = (((hour.split(' '))[4]).split(':'))[0]
					hour = Number(hour) - 3
					datasets_dists[hour] = element.pulse_hourly_avg
				});
				console.log(req.params.dog_id)
				res.render("hourly_pulse", { user_first_name: req.session.user.first_name,curr_dog: req.params.dog_id, distance_hourly: datasets_dists})
			})
	})


	app.get("/delete_dog/:dog_id", authUser, (req, res) => {
		// Connect to the dogs db and collection
		var db = client.db("dogs")
		var db_collection = db.collection("dogs_info")

		var ObjectId = require('mongodb').ObjectID;
		var myquery = { _id: new ObjectId(req.params.dog_id) }

		if (db_collection) {
			// Deleting dog from collection dogs_info
			db_collection.deleteOne(myquery, function (err, obj) {
				if (err) throw err
				return obj
			})
			res.redirect("/my_dogs")
		}

	})

	app.get("/edit_dog/:dog_id", authUser, (req, res) => {
		var dog_id = req.params.dog_id
		var ObjectId = require('mongodb').ObjectID;

		var db = client.db("dogs")
		var db_collection = db.collection("dogs_info")
		
		db_collection.find({ "_id": new ObjectId(dog_id) }).toArray(function (err, allDetails) {
			if (err) {
				console.log(err)
			}
			else {
				console.log(allDetails[0])
				res.render("edit_dog", {user_first_name: req.session.user.first_name, details: allDetails[0]})

			}
		})
	})



	app.post("/logout", (req, res) => {
		req.session.user = null
		res.render("Login")
	})

	app.post("/auth", (req, res) => {
		// Get login data
		var user_id = req.body.id
		var password = req.body.pass
		// Connect to db and collection
		db = client.db("users")
		db_collection = db.collection("users_login")
		
		if (db_collection) {
			db_collection.find({ "id": user_id, "password": password }).toArray(function (err, users) {
				if (users.length == 1) {
					db_collection_info = db.collection("users_info")
					db_collection_info.find({ "id": user_id}).toArray(function (err, users) {
						req.session.user = {
							"id": users[0].id,
							"first_name":users[0].first_name
						}
						res.redirect("/user_homepage")
					})
				}

				else {
					console.log("User Not Exist! \n")
					res.redirect("/Login")
				}
			})
		}
		else { res.redirect("/Login") }
	})

	app.post("/dog_info", authUser, (req, res) => {
		// Connect to the collection
		var db = client.db("dogs")
		var db_collection = db.collection("dogs_info")

		if (db_collection) {
			db_collection.find({ "dog_owner_id": req.session.user.id}).toArray(function (err, dogs) {
				// req.body.selected_dog
				choosen_dog = null
				dogs.forEach(element => {
					if (element.dog_name == req.body.selected_dog){
						choosen_dog = element
					}
				});
				var db_collection_dist_hourly = db.collection("dog_AGG_avg_hourly")
				db_collection_dist_hourly.find({ "dog_id": choosen_dog._id, date_created: {
					$gte: today.toDate(), 
					$lt: moment(today).endOf('day').toDate()
					}}).toArray(function (err, dist_info) {
						datasets_dists = new Array(24).fill(0);
						
						dist_info.forEach(element => {
							hour = element.date_created.toString()
							hour = (((hour.split(' '))[4]).split(':'))[0]
							hour = Number(hour) - 3
							datasets_dists[hour] = element.walking_met_sum
							
						});
						res.render("user_homepage", { user_first_name: req.session.user.first_name, dogs_info: dogs, curr_dog: choosen_dog, distance_hourly: datasets_dists})

				});
				
			})
		}
	})

	app.post("/add_new_dog", authUser, (req, res) => {
		// Connect to the collection
		var db = client.db("dogs")
		var db_collection = db.collection("dogs_info")

		// Get all the data the user enter
		var dog_name = req.body.name
		var dog_breed = req.body.breed
		var dog_color = req.body.color
		var dog_size = req.body.selected_size
		var dog_birthday = req.body.birthday
		var dog_gender = req.body.radio

		var data = {
			"dog_owner_id": req.session.user.id,
			"dog_name": dog_name,
			"dog_breed": dog_breed,
			"dog_color": dog_color,
			"dog_birthday": dog_birthday,
			"dog_gender": dog_gender,
			"dog_size": dog_size
		}
		// Check if the user name is already taken
		if (db_collection) {
			db_collection.insertOne(data, function (err, collection) {
				if (err) {
					throw err
				}
				console.log("Adding Dog Successfully")
				res.redirect("/my_dogs")

			})
		}
		else {
			console.log("Adding Dog Failed")
		}
	})


	app.post("/Register", (req, res) => {
		var db = client.db("users")
		var db_collection = db.collection("users_info")
		
		// Get all the data the user enter
		var id = req.body.id
		var first_name = req.body.first_name
		var last_name = req.body.last_name
		var gender = req.body.radio
		var email = req.body.email
		var phone_number = req.body.phone
		var password = req.body.password

		var data = null
		// Check if the user name is already taken
		if (db_collection) {
			db_collection.findOne({"id": id}).then(user => {
				if (user) {
					console.log("User already exists")
					// ADD POP UP WINDOW!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
					return res.redirect("/Login")
				}
				else {
					data = {
						"id": id,
						"first_name": first_name,
						"last_name": last_name,
						"gender": gender,
						"email": email,
						"phone_number": phone_number,
						"password": password,
						"dogs": []
					}
					// Add a new user to "users_info" collection with all of his information
					db_collection.insertOne(data, function (err, collection) {
						if (err) {
							throw err
						}
						console.log("Record inserted Successfully" + collection.insertedCount)
					})

					// Add a new user to "users_login" collection with all of his information
					var db_collection_login = db.collection("users_login")
					data = {
						"id": id,
						//"email": email,
						"password": password
					}
					db_collection_login.insertOne(data, function (err, collection) {
						if (err) {
							throw err
						}
						console.log("Record inserted Successfully" + collection.insertedCount)
					})
					res.redirect("/Login")
				}
				
			})
		}
	})

	app.post("/get_my_password", (req, res) => {
		// Get the email
		var email = req.body.email
		
		// Check if it's exsits in our db
		var db = client.db("users")
		var db_collection = db.collection("users_info")
		db_collection.find({ "email": email }).toArray(function (err, allDetails) {
			if(allDetails.length > 0) {
				var full_name = allDetails[0].first_name + " " + allDetails[0].last_name
				var password = allDetails[0].password
				var msg = "Hey " + full_name + ",\nWe got a request for retriving your password.\nYour password is: " + password + "\n\nHave a nice day!\nHotDog"
				send_an_email(email, "Forgot Password - HotDog", msg)
			}
		})

		res.redirect("/Login")
	})

	
	app.post("/update_profile", (req, res) => {
		var db = client.db("users")
		var db_collection = db.collection("users_info")
		
		// Get all the data the user enter
		//var id = req.body.id
		var first_name = req.body.first_name
		var last_name = req.body.last_name
		var email = req.body.email
		var phone_number = req.body.phone
		var new_password = req.body.password

		
		
		var data = null
		// Check if the user name is already taken
		if (db_collection) {
			db_collection.findOne({"id": req.session.user.id}).then(user => {
				if (user) {
					new_data = {
					}
					if(first_name) {
						new_data['first_name'] = first_name
					}
					if(last_name) {
						new_data['last_name'] = last_name
					}
					if(email) {
						new_data['email'] = email
					}
					if(phone_number != undefined) {
						new_data['phone_number'] = phone_number
					}
					// Check if the user enterd a new password
					if(new_password == user.password){
						// Didn't change
						// If the user didn't change any detail
						if(!first_name && !last_name && !email && phone_number == undefined){
							res.redirect("/user_homepage")
						}
						else{
							var newvalues = { $set: new_data };
							db_collection.updateOne({"id": req.session.user.id}, newvalues, function(err, data) {
    						if (err) throw err;
   							console.log("1 document updated");
							res.redirect("/user_homepage")
  						});
						}						
					}
					// Changed the password
					else {
						new_data['password'] = new_password
						// Update the data for 'users_info' collection
						var newvalues = { $set: new_data };
						db_collection.updateOne({"id": req.session.user.id}, newvalues, function(err, data) {
    						if (err) throw err;
   							console.log("1 document updated");
  						});
						// Update the data for 'users_login' collection
						db_collection = db.collection("users_login")
						new_data = {'password' : new_password}
						newvalues = { $set: new_data };
						db_collection.updateOne({"id": req.session.user.id}, newvalues, function(err, data) {
    						if (err) throw err;
   							console.log("1 document updated");
							res.redirect("/user_homepage")
  						});
					}
					
				}
				else {
					res.redirect("/user_homepage")
				}
				
			})
		}

	})

	app.post("/update_dog_info", (req, res) => {
		var db = client.db("dogs")
		var db_collection = db.collection("dogs_info")
		var ObjectId = require('mongodb').ObjectID;

		// Get the dog ObjectID
		var id = req.body.dog_id
		// Get all the data the user enter
		var name = req.body.name
		var breed = req.body.breed
		var color = req.body.color
		var gender = req.body.radio
		
		var data = null
		// Check if the user name is already taken
		if (db_collection) {
			db_collection.findOne({"_id": new ObjectId(id)}).then(user => {
				if (user) {
					new_data = {}
					
					if(name) {
						new_data['dog_name'] = name
					}
					if(breed) {
						new_data['dog_breed'] = breed
					}
					if(color) {
						new_data['dog_color'] = color
					}
					if(gender != user.dog_gender) {
						new_data['dog_gender'] = gender
					}
					
					// Update the data for 'dogs_info' collection
					var newvalues = { $set: new_data };
					db_collection.updateOne({"_id": new ObjectId(id)}, newvalues, function(err, data) {
    					if (err) throw err;
   						console.log("1 document updated");
						res.redirect("/my_dogs")
  					});					
				}
				else {
					res.redirect("/my_dogs")
				}
				
			})
		}
	})

})

function send_an_email(receiver_email, subject, message) {
	var nodemailer = require("nodemailer")
	var transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "hotdogsce@gmail.com",
			pass: "Hd123456"
		}
	})

	var mailOptions = {
		from: "hotdogsce@gmail.com",
		to: receiver_email,
		subject: subject,
		text: message
	}

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error)
		} else {
			console.log("Email sent: " + info.response)
		}
	})
}

/**
 * Server Activation
 */
 app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
  });