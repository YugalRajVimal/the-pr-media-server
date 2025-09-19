// import mongoose from "mongoose";
// const messageSchema = new mongoose.Schema(
//   {
//     sender: {
//       type: String,
//       enum: ["admin", "customer"],
//       required: true,
//     },
//     text: {
//       type: String,
//       required: true,
//     },
//     timestamp: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { _id: false }
// );

// const customerSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, required: true, unique: true },
//   verified: Boolean,
//   approved: { type: Boolean, default: false },

//   privateChats: [messageSchema], // embedded messages
// });

// const CustomerModel = mongoose.model("Customer", customerSchema);

// export default CustomerModel;
// models/Customer.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sender: { type: String, enum: ["admin", "customer"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  verified: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },

  privateChats: [messageSchema],
});

const CustomerModel = mongoose.model("Customer", customerSchema);

export default CustomerModel;
