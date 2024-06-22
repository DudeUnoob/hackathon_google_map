const express = require("express")
const session = require("express-session")
const cors = require("cors")
const bodyParser = require("body-parser")
const app = express()
const mongoose = require("mongoose")
const ejs = require("ejs")
const cookieParser = require("cookie-parser")
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth')
const userdb = require('./models/userdb');
const markersdb = require("./models/markers")
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs')
const { v4: uuidV4 } = require('uuid');
const  checkLogin  = require('./middleware/checklogin')
dotenv.config();

app.use(express.json())
app.set("view engine", "ejs");
//app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret:'helloworld',
    resave: false,
    saveUninitialized: true,
}))
app.use(express.static('public'))

app.set('view engine', 'ejs')


app.get("/", async(req, res) => {
    if(!req.session.userid){
        return res.redirect('/login')
    }

    res.render("index")
})


app.get('/login', checkLogin,(req, res) => {
    if(req.session.userid){
        return res.status(200).send("You're already logged in! Logout <a href/logout>here</a>")
    }
    //res.sendFile('login.html', { root: path.join(__dirname, './views')})
    res.render('login')
})



let finalUsername;

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await userdb.findOne({ username: username });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            const token = jwt.sign(
                { user: username },
                'helloworld',
                { expiresIn: "1h" }
            );

            req.session.token = token;
            req.session.userid = username;

            if (req.session.redirectdocument) {
                return res.redirect(req.session.redirectdocument);
            } else {
                return res.redirect('/');
            }
        } else {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'An error occurred during login' });
    }
});

app.get('/signup', (req, res) => {
    //res.sendFile('signup.html', { root: path.join(__dirname, './views')})
    if(req.session.userid){
        return res.status(200).send("You're already logged in! Logout <a href/logout>here</a>")
    }
    res.render('signup')
})

app.post('/signup', async(req, res) => {

    
    const username = req.body.username;
    const password = req.body.password;

    let testUser = await userdb.findOne({ username: username })

    if(testUser){
        return res.status(400).send("Already a user with this username. <a href=/signup>Go Back</a>")
    } else {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                await userdb.create({
                    username: username,
                    password: hash
                })
                    
                return res.send("successfully signed up. <a href=/>Go Home</a>")
            })
        })
    }

})

app.get('/logout', auth, (req, res) => {
    req.session.destroy()
 
     res.send('<a href=/>Successfully logged out</a>')
 })


 app.get('/api/updateMarkers', checkLogin, async(req, res) => {
    try {

    }

    catch(error) {
        return res.status(500).json({ message: error, code: 500 })
    }
 })

app.listen(process.env.PORT || 3000, () => {
    console.log("Server listening on port 3000")
})