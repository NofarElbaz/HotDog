// index.js

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
MongoClient.connect("mongodb+srv://HotDog:Hd2022@cluster0.9q7j7.mongodb.net/HotDog?retryWrites=true&w=majority", { useUnifiedTopology: true }).then(client => {
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
				res.render("user_homepage", { details: {"first_name": req.session.user.first_name}, dogs_info: dogs, curr_dog: null })
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
				res.render("profile", { details: allDetails[0] })
			}
		})
	})

	app.get("/my_dogs", authUser, (req, res) => {
		// Connect to db and collection
		db = client.db("dogs")
		db_collection = db.collection("dogs_info")

		if (db_collection) {
			db_collection.find({ "dog_owner_id": req.session.user.id }).toArray(function (err, dogs) {
				res.render("my_dogs", { details: {"first_name": req.session.user.first_name}, dogs_info: dogs })
			})
		}
		
	})

	app.get("/add_dog", authUser, (req, res) => {
		res.render("add_dog")
	})

	app.get("/edit_dog/:dog_id", authUser, (req, res) => {
		console.log('here')
		var dog_id = req.params.dog_id

		var db = client.db("dogs")
		var db_collection = db.collection("dogs_info")
		
		db_collection.find({ "_id": dog_id }).toArray(function (err, allDetails) {
			if (err) {
				console.log(err)
			}
			else {
				res.render("edit_dog", {details: allDetails[0]})

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
				res.render("user_homepage", { details: {"first_name": req.session.user.first_name}, dogs_info: dogs, curr_dog: choosen_dog})
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
		var dog_birthday = req.body.birthday
		var dog_gender = req.body.radio

		var data = {
			"dog_owner_id": req.session.user.id,
			"dog_name": dog_name,
			"dog_breed": dog_breed,
			"dog_color": dog_color,
			"dog_birthday": dog_birthday,
			"dog_gender": dog_gender,
			"dog_temperature": "",
			"dog_location": "",
			"dog_pulse": ""
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