const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    reason: {
        type: String,
        required: true
    },
    terms: {
        type: Boolean,
        default: true
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pet: {
        type: Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    status: {
        type: String,
        enum: ['Accepted', 'Pending', 'Denied'],
        default: 'Pending'
    },
    message:{
        type:String,
    },
    ContactInfo:{
        type:Number,
    }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
