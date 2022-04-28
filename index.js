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
 //const { authUser, authRole } = require("./simpleAuth")
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
		res.render("Login")
		res.status(200)
	})

	app.get("/Login", (req, res) => {
		res.render("Login")
	})

	app.get("/Register", (req, res) => {
		res.render("Register")
	})

	app.get("/user_homepage", authUser, (req, res) => {
		res.render("user_homepage")
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

	app.get("/add_dog", authUser, (req, res) => {
		res.render("add_dog")
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
					req.session.user = {
						"id": users[0].id,
						// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
						"fullname":users[0].full_name
					}
					// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					res.redirect("/user_homepage")
				}

				else {
					console.log("User Not Exist! \n")
					res.redirect("/Login")
				}
			})
		}
		else { res.redirect("/Login") }
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

/**
 * Server Activation
 */
 app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
  });