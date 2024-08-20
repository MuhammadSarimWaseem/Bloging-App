const mongoose = require('mongoose')

//schema

const postSchema = new mongoose.Schema({
    user: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    date: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    }
})

const postModel = new mongoose.model("post", postSchema)

module.exports = postModel