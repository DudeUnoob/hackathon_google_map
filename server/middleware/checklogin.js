const session = require("express-session");
const path = require('path')

function checkLogin (req, res, next) {
    if(req.session.userid){
       // console.log(req.session.userid + ' ' + session.userid)
        return res.sendFile('loggedin.html', { root: path.join(__dirname, '../views/404')})
    }
    else {
        next()
    }
}

module.exports = checkLogin