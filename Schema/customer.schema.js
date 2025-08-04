import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  verified: {
    type: Boolean,
  },
  approved: {
    type: Boolean,
    default: false,
  },
});

const CustomerModel = mongoose.model("Customer", customerSchema);

export default CustomerModel;
