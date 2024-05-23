// models/tweet.model.js
import mongoose, { Schema } from 'mongoose';

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true,
        maxlength: 280
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    retweets: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'Tweet'
    }],
    media:{
        public_id: {
          type: String,
          required: false,
        },
        url: {
          type: String,
          required: false,
        },
      },
    hashtags: [{
        type: String,
        required: false
    }]
}, { timestamps: true });

export const Tweet = mongoose.model('Tweet', tweetSchema);
