// passport.js
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import CustomerModel from "../Schema/customer.schema.js";

console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Google Secret:", process.env.GOOGLE_CLIENT_SECRET);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.FRONTEND_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await CustomerModel.findOne({ email });

        if (!user) {
          // Create new user with verified = true
          user = await CustomerModel.create({
            email,
            name,
            verified: true,
            // No password or phone number in this case
          });
        }

        return done(null, user); // pass user to session
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
