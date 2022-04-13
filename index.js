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
 const { authUser, authRole } = require("./simpleAuth")
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
	  });

	app.post("/auth", (req, res) => {
		// Get login data
		var user_name = req.body.Email_Address
		var passwordd = req.body.pass
		// Connect to db and collection
		db = client.db("human-resources-workers")
		db_collection = db.collection("humanResourcsesWorkersLogin")
		
		if (db_collection) {
			db_collection.find({ "user": user_name, "password": passwordd }).toArray(function (err, users) {
				if (users.length == 1) {
					req.session.user = {
						"id": users[0].id,
						// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
						"fullname":users[0].full_name
					}
					// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					res.redirect("/" + homepage_name)
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
			db_collection.find({"email": email}).count().then(function (numItems) {
				if (numItems) {
					console.log("User already exists")
					res.redirect("/Login")
				}
				data = {
					"id": id,
					"first_name": first_name,
					"last_name": last_name,
					"gender": gender,
					"email": email,
					"phone_number": phone_number,
					"company_name": company_name,
					"user": username,
					"password": password,
					"hiring": [],
					"job_requests": [],
					"work_history": [],
					"canceled_jobs": []
				}
				// Add a new employee to "employersWorkers" collection with all of his information
				db_collection.insertOne(data, function (err, collection) {
					if (err) {
						throw err
					}
					console.log("Record inserted Successfully" + collection.insertedCount)

					// Send an email to the new employee with his username and password
					var message = "Welcome " + first_name + " " + last_name + "!\nWe are happy that you chose to work with our company."
					message = message + "\nYour login information is:\nUsername: " + username + "\nPassword: " + password + "\n\nHope you will enjoy our site!"
					send_an_email(email, "Welcome to SCE Contractor!", message)
				})

			})
		}
		var db_collection_login = db.collection("employersWorkersLogin")
		data = {
			"user": username,
			"full_name": first_name + " " + last_name,
			"password": password
		}
		db_collection_login.insertOne(data, function (err, collection) {
			if (err) {
				throw err
			}
			console.log("Record inserted Successfully" + collection.insertedCount)
		})
		res.redirect("/Login")
	})

})

/**
 * Server Activation
 */
 app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
  });