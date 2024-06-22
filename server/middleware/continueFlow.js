const session = require("express-session");
const path = require('path')

function continueFlow (req, res, next) {
    if(req.session.userid){
       // console.log(req.session.userid + ' ' + session.userid)
       next()

    }
    else {
        return res.status(400).json({ status:"You're not logged in"})
    }
}

module.exports = continueFlow