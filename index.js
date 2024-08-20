const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const userModel = require('./models/user')
const postModel = require('./models/post')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
const PORT = 8000

app.set('view engine', 'ejs')
app.set("views", path.resolve('views'))

//Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: 'false' }))
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser())

//routes
app.get('/', (req, res) => {
    res.cookie("token", "")
    res.render("home")
})

app.get('/signup', (req, res) => {
    res.render("signup")
})

app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.redirect("/")
})

app.post('/createuser', (req, res) => {
    const { name, email, password } = req.body
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                name,
                email,
                password: hash
            })
            let token = jwt.sign({ email: email, userid: user._id }, process.env.SECRETKEY)
            res.cookie("token", token)
            res.redirect("/profile")
        });
    });
})

app.post('/deletepost/:id', isloggedin, async (req, res) => {
    let deletepost = await postModel.findOneAndDelete({ _id: req.params.id })
    let user = await userModel.findOne({ _id: deletepost.user })
    if (user) {
        user.posts = user.posts.filter(postID => postID.toString() !== req.params.id)
        await user.save()
    }
    res.redirect('/profile')
})

app.get('/editpost/:id', isloggedin, async (req, res) => {
    let editpost = await postModel.findOne({ _id: req.params.id })
    res.render('edit', { editpost })
})

app.post('/updatepost/:id', isloggedin, async (req, res) => {
    let { title, text } = req.body
    let updatepost = await postModel.findOneAndUpdate({ _id: req.params.id }, { title, text }, { new: true })
    res.redirect('/profile')
})

app.post('/createpost', isloggedin, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email })
        if (!user) {
            return res.status(404).send('User not found')
        }
        let { text, title } = req.body
        let post = await postModel.create({
            user: user._id,
            text,
            title
        })
        user.posts.push(post._id)
        await user.save()
        res.redirect('/profile')
    } catch (err) {
        console.error(err)
        res.status(500).send('Error creating post')
    }
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/profile', isloggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate('posts')
    console.log(req.user)
    res.render('profile', { user })
})

app.post('/login', async (req, res) => {
    let user = await userModel.findOne({ email: req.body.email })
    if (!user) { res.send("Email or password is incorrect") }
    if (user) {
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            if (result) {
                let token = jwt.sign({ email: user.email, userid: user._id }, process.env.SECRETKEY)
                res.cookie("token", token)
                res.redirect("/profile")
            }
            else res.send("Email or password is incorrect")
        });
    }
})
function isloggedin(req, res, next) {
    if (!req.cookies.token) {
        res.redirect('/login')
    } else {
        let data = jwt.verify(req.cookies.token, process.env.SECRETKEY)
        req.user = data
        next()
    }
}

app.listen(PORT, () => { console.log("server connected", PORT) })