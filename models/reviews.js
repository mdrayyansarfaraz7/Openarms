const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const reviewsSchema=new Schema({
    review:{
        type:String,
        required:true
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
});

module.exports=mongoose.model('Review',reviewsSchema);