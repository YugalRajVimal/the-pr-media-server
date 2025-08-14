import sendMail from "../../config/nodeMailer.config.js";
import AdminModel from "../../Schema/admin.schema.js";
import CustomerModel from "../../Schema/customer.schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { broadcast } from "../../server.js";


class CustomerAuthController {
  sendNotification(name, comment) {
    broadcast({ name, comment });
  }

  checkAuth = async (req, res) => {
    return res.status(200).json({ message: "Authorized" });
  };

  signup = async (req, res) => {
    const { email, password, name, phoneNo } = req.body;
    if (!email || !password || !name || !phoneNo) {
      return res.status(400).json({ message: "All fields are required" });
    }
    try {
      const existingUserUsingEmail = await CustomerModel.findOne({ email });
      const existingUserUsingPhone = await CustomerModel.findOne({ phoneNo });

      if (
        existingUserUsingEmail &&
        existingUserUsingPhone &&
        existingUserUsingEmail._id.toString() !==
          existingUserUsingPhone._id.toString()
      ) {
        return res.status(409).json({
          message: "User with this email and phone number already exists.",
        });
      }

      if (existingUserUsingEmail) {
        return res
          .status(409)
          .json({ message: "Email already in use. Login." });
      }

      if (existingUserUsingPhone) {
        return res
          .status(409)
          .json({ message: "Phone number already in use." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new CustomerModel({
        email,
        password: hashedPassword,
        name,
        phoneNo,
      });

      await newUser.save();
      // Generate a random 6 digit OTP using crypto
      const otp = Math.floor(Math.random() * 900000) + 100000;
      // Save OTP to the user document
      await CustomerModel.findByIdAndUpdate(newUser.id, { otp }, { new: true });
      // Send OTP to the user's email
      const message = `Your OTP is: ${otp}`;
      await sendMail(email, "Sign Up OTP", message);
      res.status(200).json({
        message: "Sign Up successful. OTP sent to your email. Verify Account",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  verifyAccount = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    try {
      const user = await CustomerModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.otp !== otp) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      user.otp = null;
      user.save();
      // Verify the user and update the verified field to true
      await CustomerModel.findByIdAndUpdate(
        user.id,
        { verified: true },
        { new: true }
      );
      // Generate a JSON Web Token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET
        // { expiresIn: "24h" }
      );
      res.status(200).json({ message: "Account verified successfully", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  signin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    try {
      const user = await CustomerModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.verified) {
        const otp = Math.floor(Math.random() * 900000) + 100000;
        // Save OTP to the user document
        await CustomerModel.findByIdAndUpdate(user.id, { otp }, { new: true });
        const message = `Your OTP is: ${otp}`;
        await sendMail(email, "Sign Up OTP", message);
        return res.status(403).json({
          message: "User not verified. OTP sent to your email. Verify Account",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      // Generate a JSON Web Token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET
        // { expiresIn: "24h" }
      );
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    try {
      const user = await CustomerModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Encrypt the new password
      const encryptedPassword = await bcrypt.hash(newPassword, 10);

      const otp = Math.floor(Math.random() * 900000) + 100000;

      await CustomerModel.findByIdAndUpdate(
        user.id,
        { otp, password: encryptedPassword, verified: false },
        { new: true }
      );
      // Send OTP to the user's email
      const message = `Your OTP is: ${otp}`;
      await sendMail(email, "Reset Password OTP", message);
      return res.status(200).json({
        message: "OTP sent to your Email, Verify youseft to reset Password.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  getAllNameCommentAndImagesCombined = async (req, res) => {
    try {
      const admin = await AdminModel.find({}, "nameComments imagesPath");

      if (!admin || admin.length === 0) {
        return res.status(404).json({ message: "No data found" });
      }

      // Extract all nameComments and images into flat arrays
      const allComments = admin.flatMap((a) => a.nameComments);
      const allImages = admin.flatMap((a) => a.imagesPath);

      if (!allComments || allComments.length === 0) {
        return res.status(404).json({ message: "No name-comments found" });
      }

      // Shuffle the images randomly
      const shuffledImages = allImages.sort(() => 0.5 - Math.random());

      // Attach images to comments (discard extra images if any)
      const combined = allComments.map((commentObj, index) => ({
        ...commentObj.toObject(),
        image: index < shuffledImages.length ? shuffledImages[index] : null,
      }));

      return res.status(200).json({ data: combined });
    } catch (error) {
      console.error("Error while combining data:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  sendSingleNameComment = async () => {
    try {
      console.log("Starting to send a single name comment");
      const admin = await AdminModel.findOne(
        {},
        "nameComments currentNameCommentIndex"
      );

      if (!admin || admin.nameComments.length === 0) {
        console.warn("No name-comments found in DB");
        return;
      }

      let { nameComments, currentNameCommentIndex } = admin;

      if (currentNameCommentIndex >= nameComments.length) {
        console.log("Reshuffling and resetting name comments");
        // reshuffle and reset
        nameComments = nameComments.sort(() => Math.random() - 0.5);
        currentNameCommentIndex = 0;

        await AdminModel.findByIdAndUpdate(admin.id, {
          nameComments,
          currentNameCommentIndex,
        });
      }

      const currentComment = nameComments[currentNameCommentIndex];

      console.log("Sending current comment via WebSocket:", currentComment);
      // Send via WebSocket
      broadcast(currentComment);

      console.log("Updating index after sending comment");
      // Update index
      await AdminModel.findByIdAndUpdate(admin.id, {
        currentNameCommentIndex: currentNameCommentIndex + 1,
      });
    } catch (error) {
      console.error("Error sending comment:", error);
    }
  };

  // Random delay loop
  startRandomBroadcast = () => {
    const getDelayByTime = () => {
      console.log("Calculating delay based on time");
      const now = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const hour = new Date(now).getHours();

      // 01:00 AM - 08:00 AM → 1.5 to 2 minutes
      if (hour >= 1 && hour < 8)
        return Math.floor(Math.random() * 30000) + 90000; // 90s - 120s

      // 08:00 AM - 10:00 AM → 8 to 10 seconds
      if (hour >= 8 && hour < 10)
        return Math.floor(Math.random() * 2000) + 8000; // 8s - 10s

      // 10:00 AM - 09:00 PM → 2 to 4 seconds
      if (hour >= 10 && hour < 21)
        return Math.floor(Math.random() * 2000) + 2000; // 2s - 4s

      // 09:00 PM - 01:00 AM → 15 to 20 seconds
      return Math.floor(Math.random() * 5000) + 15000; // 15s - 20s
    };

    const sendNext = async () => {
      console.log("Sending next comment in sequence");
      const delay = getDelayByTime(); // Pick delay according to IST time
      await this.sendSingleNameComment(); // Send message
      

      console.log("Scheduling next comment after delay:", delay);
      setTimeout(sendNext, delay); // Schedule next
    };

    sendNext();
  };

  // Function to calculate delay based on time
  getDelayBasedOnTime = () => {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const hour = new Date(now).getHours();
    // 01:00 AM - 08:00 AM → 1.5 to 2 minutes
    if (hour >= 1 && hour < 8) return Math.floor(Math.random() * 2000) + 2000;
    // 08:00 AM - 10:00 AM → 8 to 10 seconds
    if (hour >= 8 && hour < 10) return Math.floor(Math.random() * 2000) + 8000;
    // 10:00 AM - 09:00 PM → 2 to 4 seconds
    if (hour >= 10 && hour < 21) return Math.floor(Math.random() * 2000) + 2000;
    // 09:00 PM - 01:00 AM → 15 to 20 seconds
    return Math.floor(Math.random() * 5000) + 15000;
  };

  sendNameCommentUsingWebSockets = async (req, res) => {
    try {
      const admin = await AdminModel.findOne(
        {},
        "nameComments currentNameCommentIndex"
      );

      if (!admin || admin.nameComments.length === 0) {
        return res.status(404).json({ message: "No name-comments found" });
      }

      let { nameComments, currentNameCommentIndex } = admin;

      if (currentNameCommentIndex >= nameComments.length) {
        // reshuffle and reset
        nameComments = nameComments.sort(() => Math.random() - 0.5);
        currentNameCommentIndex = 0;

        await AdminModel.findByIdAndUpdate(admin.id, {
          nameComments,
          currentNameCommentIndex,
        });
      }

      const currentComment = nameComments[currentNameCommentIndex];

      // Send to all connected WebSocket clients
      broadcast(currentComment);

      // Increment index in DB
      await AdminModel.findByIdAndUpdate(admin.id, {
        currentNameCommentIndex: currentNameCommentIndex + 1,
      });

      res
        .status(200)
        .json({ message: "Comment sent successfully", currentComment });
    } catch (error) {
      console.error("Error sending name-comment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  isUserApproved = async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await CustomerModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ approved: user.approved, name: user.name });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  getLivePeopleCount = () => {
    const now = new Date();
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: "Asia/Kolkata",
      }).format(now)
    );

    const getRandomInRange = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const ranges = {
      1: [5000, 7000],
      2: [2000, 3000],
      3: [500, 1000],
      4: [500, 1000],
      5: [500, 1000],
      6: [1000, 2000],
      7: [4000, 6000],
      8: [8000, 12000],
      9: [30000, 50000],
      10: [50000, 70000],
      11: [70000, 90000],
      12: [90000, 110000],
      13: [110000, 130000],
      14: [130000, 150000],
      15: [150000, 165000],
      16: [165000, 180000],
      17: [180000, 200000],
      18: [200000, 220000],
      19: [200000, 220000],
      20: [180000, 200000],
      21: [70000, 80000],
      22: [50000, 60000],
      23: [20000, 10000],
      0: [10000, 12000],
    };

    const [min, max] = ranges[hour] || [10000, 12000];
    return getRandomInRange(min, max);
  };

  getLiveCount = async (req, res) => {
    try {
      const adminDoc = await AdminModel.findOne(); // use filter if needed

      if (!adminDoc) {
        return res.status(404).json({ message: "Admin data not found" });
      }

      return res.status(200).json({ livePeopleCount: adminDoc.liveCount });
    } catch (err) {
      console.error("Failed to fetch live count:", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default CustomerAuthController;
