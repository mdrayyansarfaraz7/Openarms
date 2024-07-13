const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const petSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    species: {
        type: String,
        enum: ['dog', 'cat', 'rabbit', 'hamster', 'guineapig', 'bird', 'fish', 'turtle','lizard','spider'],
        required: true
    },
    breed: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    image: {
        url: {
            type: String,
            required: true
        }
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Adopted'],
        default: 'Available'
    },
    price: {
        type: Number
    },
    listingType: {
        type: String,
        enum: ['Sale', 'Adopt'],
        required: true
    },
    Owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt 
});

module.exports = mongoose.model("Pet", petSchema);
