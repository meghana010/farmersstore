const mongoose = require("mongoose");


const regSchema = new mongoose.Schema({
   firstname : { type: String  },
   lastname :{ type: String },
   mail:{ type: String},
   number:{ type: String},
   registeras: {type: String, choices: ['farmer','buyer']},
   pass :{ type: String},
   password_two:{ type: String}
    
 });
 
 const regTable=mongoose.model('registrations',regSchema,'registrations');
 module.exports ={regTable}