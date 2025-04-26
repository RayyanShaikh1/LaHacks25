import mongoose from "mongoose";

//TODO: include school, bio (hidden mmr)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "https://www.gravatar.com/avatar/?d=mp",
    },
    biography: {
      type: String,
      default: "Tell us about yourself...",
    },
    courses: [{
      type: String,
      default: []
    }],
    // friends: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
