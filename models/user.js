const mongoose = require('mongoose')
require('dotenv').config();

mongoose
    .connect(process.env.USER_DATABASE_URL)
    .then(() => { console.log("mongo connected") })
    .catch(() => { console.log("Connection error") })


//schema

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    posts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"post"
    }]
})


// model
const userModel = new mongoose.model("user", userSchema)


module.exports = userModel