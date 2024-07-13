const mongoose = require('mongoose');
const Schema=mongoose.Schema;

const passportLocalMongoose=require('passport-local-mongoose');

let userSchema= new Schema({
    email:{
        type:String,
        required:true,
        lowercase:true
    },
    ContactInfo:{
        type:String,
    },
    Country:{
        type:String,
    },
    City:{
        type:String,
    },
    Address:{
        type:String,
    },
    Pets: [{ 
        type: Schema.Types.ObjectId,
         ref: 'Pet' 
        }],
    requestsForYou: [{
        type: Schema.Types.ObjectId,
        ref: 'Request'
    }],
    yourRequests: [{
        type: Schema.Types.ObjectId,
        ref: 'Request'
    }]
},{
    timestamps: true  // Adds createdAt and updatedAt 
});

userSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model('User',userSchema);