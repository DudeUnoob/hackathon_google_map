const session = require('express-session');
const jwt = require('jsonwebtoken');
const path = require('path')

function auth (req, res, next) {
    let token = req.body.token || req.session.token

    if(!token){

        return res.sendFile('notloggedin.html', { root: path.join(__dirname, '../views/404')})
    } else {
        try{
            let decrypt = jwt.verify(token, 'helloworld')
            
        req.user = decrypt;

        
        }
        catch(e) {
            req.session.destroy()
            return res.status(400).send('session has expired <a href=/login>Login Again</a>')
        }
        
        return next();
    }
    
}

module.exports = auth;