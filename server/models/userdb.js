const { databaseConnectionString } = require("../config/config");
const mongoose = require('mongoose');

mongoose.connect(databaseConnectionString).then(() => {
    console.log('connected to database')
})

const Schema = new mongoose.Schema({
    username:String,
    password: String,
    picture: String,
    name: String
})

module.exports = mongoose.model('Hackathon_Users', Schema)