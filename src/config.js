const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/Login");


// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
    .catch(() => {
        console.log("Database cannot be Connected");
    })




// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    // location: {
    //     type: String, 
    //     required: true
    // },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // Array of numbers: [longitude, latitude]
            required: true,
            index: '2dsphere' // Indicates it's a geospatial index
        }
    },
    
    

    service: {
        type: String,
        required: function () {
            // Check if the 'services' field has any data
            // return this.services ? true : false;
            return this.role === 'technician';
        }
    },

    role: {
        type: String,
        enum: ['client', 'technician'], //possible value for role
        required: true
    }
});



// collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;
