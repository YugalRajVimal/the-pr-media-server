import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNo: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  verified: {
    type: Boolean,
  },
  nameComments: [
    {
      name: {
        type: String,
      },
      comment: {
        type: String,
      },
    },
  ],
  imagesPath: [
    {
      type: String,
    },
  ],
  liveCount: {
    type: Number,
    default: 0,
  },
});

const AdminModel = mongoose.model("Admin", adminSchema);

export default AdminModel;
