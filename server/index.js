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
const continueFlow = require("./middleware/continueFlow")
dotenv.config();

app.use(express.json())
app.set("view engine", "ejs");
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
    res.render('login')
})

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





app.post('/api/updateMarkers', continueFlow, async(req, res) => {
    try {
        const { lat, lng, username } = req.body.markers[0];
        
        // Check if a marker with these coordinates already exists for the user
        const existingMarker = await markersdb.findOne({ 
            username: req.session.userid,
            lat: { $ne: lat }, // Not equal to the new latitude
            lng: { $ne: lng }  // Not equal to the new longitude
        });

        if (existingMarker) {
            // If exists, update the existing marker
            existingMarker.lat = lat;
            existingMarker.lng = lng;
            await existingMarker.save();
            return res.status(200).json({ message: "Successfully updated the marker position", marker: existingMarker });
        } else {
            // If not exists, create a new marker
            const newMarker = await markersdb.create({ 
                username: req.session.userid, 
                lat: lat, 
                lng: lng 
            });
            return res.status(201).json({ message: "Successfully created a new marker entry", marker: newMarker });
        }
    } catch(error) {
        console.error('Error updating/creating marker:', error);
        return res.status(500).json({ message: error.message, code: 500 });
    }
});




app.get('/api/getMarkers', continueFlow, async(req, res) => {
    try {
        const returnData = await markersdb.find({ })
        return res.status(200).json({ data: returnData })
    }
    catch(error) {
        return res.status(500).json({ message: error, code: 500 })
    }
})

app.delete('/api/removeMarker', continueFlow, async (req, res) => {
  try {
    const username = req.session.userid;
    if (!username) {
      return res.status(401).json({ error: 'User not logged in' });
    }

    // Find and remove the last marker for the current user
    const removedMarker = await markersdb.findOneAndDelete(
      { username: username },
      { sort: { _id: -1 } }  // Sort by _id in descending order to get the last inserted marker
    );

    if (removedMarker) {
      res.json({ removed: { lat: removedMarker.lat, lng: removedMarker.lng } });
    } else {
      res.json({ removed: null });
    }
  } catch (error) {
    console.error('Error removing marker:', error);
    res.status(500).json({ error: 'An error occurred while removing the marker' });
  }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server listening on port 3000")
})