const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const session = require('express-session');
const crypto = require('crypto');
const calculateDistance = require('./haversine');


const app = express();

// Generate a random string of 32 characters
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Secret key:', secretKey);
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
}));
// Middleware function to check if the user is logged in
function requireLogin(req, res, next) {
    if (req.session.user) {
        // User is logged in, proceed to the next middleware
        next();
    } else {
      
        res.redirect("/")
    }
}




// convert data into json 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// use EJS as the view engine
app.set('view engine', 'ejs');

// static file
app.use(express.static("public"));



app.get("/", (req, res) => {
    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.render("login");
})
app.get("/signupt", (req, res) => {
    res.render("signupt");
})
app.get("/signupc", (req, res) => {
    res.render("signupc");
})
// Home page route with authentication check
app.get("/home", requireLogin, async (req, res) => {
    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Render the home page
    res.render("home");
   
});

//To show the technicians based on services
app.get("/technicians", requireLogin, async (req, res) => {
    try {
        // Extract the service from the query parameters
        const service = req.query.service;

        // Query the database for technicians offering the specified service
        const technicians = await collection.find({ service: service });

        // Render the technician list view with the list of technicians and service
        res.render("technician_list", { technicianlist: technicians, service: service });
    } catch (error) {
        console.error("Error retrieving technicians:", error);
        res.status(500).send("Internal server error");
    }
});


//Route to display the technician's profile after signup
app.get("/t_profile/:id", requireLogin, async (req, res) => {
    try {
        // Set cache-control headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        
        const technician = await collection.findById(req.params.id)
        if (technician) {
            res.render("t_profile", { techniciandata: technician })

        } else {
            res.status(404).send("Technician not found")
        }

    } catch (error) {
        console.error("Error fetching technician:", error)
        res.status(500).send("Internal server error")
    }
});

// Route to render the user profile page
app.get("/u_profile", requireLogin, async (req, res) => {
    try {
        // Retrieve the user's data from the session
        const userId = req.session.user._id;

        // Query the database to fetch the user's data
        const userData = await collection.findById(userId);

        // Render the profile page with the user's data
        res.render("u_profile", { usrsdata: userData });
    } catch (error) {
        console.error("Error retrieving user data:", error);
        res.status(500).send("Internal server error");
    }
});




// Register technician
app.post("/signupt", async (req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        // location: req.body.location,
        location: {
            type: "Point",
            coordinates: [parseFloat(req.body.latitude), parseFloat(req.body.longitude)]
        },

        service: req.body.service,
        role: 'technician'
    }
    //Checks if the user already exists in the database
    const existingUser = await collection.findOne({ name: data.name });
    if (existingUser) {
        res.send("User already exists. Choose different username.");
    }
    else {
        //Hash Password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

       


        //Added Code
        const userdata = await collection.insertMany(data);
        console.log(userdata);
        // res.render("home");


        const userId = userdata[0]._id;
        // Set the user session
        req.session.user = {
            _id: userId,
            role: 'technician',
            name: data.name,
            firstName: data.firstName,
            lastName: data.lastName,
            location: data.location
        };



        // Redirect the user to the login page
        return res.redirect("/");
    }

});


// Register client
app.post("/signupc", async (req, res) => {
    const data = {
        name: req.body.contactNo,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        // location: req.body.location,
        location: {
            type: "Point",
            coordinates: [parseFloat(req.body.latitude), parseFloat(req.body.longitude)]
        },

        role: 'client'
    }
    //Checks if the user already exists in the database
    const existingUser = await collection.findOne({ name: data.name });
    if (existingUser) {
        res.send("User already exists. Choose different username.");
    }
    else {
        //Hash Password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        const userdata = await collection.insertMany(data);
        console.log(userdata);
        // res.render("home");


        const userId = userdata[0]._id;
        // Set the user session
        req.session.user = {
            _id: userId,
            role: 'client',
            name: data.name,
            firstName: data.firstName,
            lastName: data.lastName,
            location: data.location
        };

     

        // Redirect the user to the login page
        return res.redirect("/");
    }
});


/*Added code*/
//Login client & technician
app.post("/login", async (req, res) => {
    try {
        // Find user based on username
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            // If user not found, send message with option to go to login page
            return res.send("User name cannot be found. <br><a href='/' style='color: blue; text-decoration: underline; cursor: pointer;'>Go to login page</a>");
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.send("Wrong Password");
        }
        else {


            // Set the user session
            req.session.user = {
                _id: check._id,
                role: check.role,
                name: check.name,
                firstName: check.firstName,
                lastName: check.lastName,
                location: check.location
            };

            
            if (check.role === 'client') {
                return res.redirect("/home");
             

            } else if (check.role === 'technician') {
                return res.redirect(`/t_profile/${check._id}`);
            } else {
                return res.status(400).send("Invalid role");
            }
            // res.render("home");
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send("Login failed due to an unexpected error. Please try again later.");
    }
});

// Logout route
app.post("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Logout failed due to an unexpected error.");
        }
        // Redirect the user to the login page or any other appropriate page
        res.redirect("/");
    });
});

//route to display the filtered list of technicians based on distance
app.get("/filter", requireLogin, async (req, res) => {
    try {
        const userLocation = req.session.user.location.coordinates;
        console.log("User Location:", userLocation);

        const service = req.query.service;
        console.log("Service:", service);

        // Check if service parameter is defined
        if (!service) {
            return res.status(400).send("Missing service parameter");
        }

        // Query the database for technicians offering the specified service
        const technicians = await collection.find({ service: service });
        console.log("Technicians:", technicians);

        // Calculate the distance between the user and each technician
        const techniciansWithDistance = technicians.map(technician => {
            const distance = calculateDistance(userLocation[1], userLocation[0], technician.location.coordinates[1], technician.location.coordinates[0]);
            return { ...technician.toObject(), distance };
        });

        // Sort the technicians based on distance from the user
        techniciansWithDistance.sort((a, b) => a.distance - b.distance);

        console.log("Technicians with Distance:", techniciansWithDistance);

        res.render("filter_technician", { technicianlist: techniciansWithDistance, service: service });
    } catch (error) {
        console.error("Error retrieving technicians:", error);
        res.status(500).send("Internal server error");
    }
});


















// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});