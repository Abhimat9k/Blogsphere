const { validateToken } = require("../services/authentication");
const User = require("../models/user");

function checkAuthenticationForCookie(cookieName) {
  return async (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) {
      // No token found, move to next middleware
      return next();
    }

    try {
      // Validate the token
      const userPayload = validateToken(tokenCookieValue);
      const user = await User.findById(userPayload._id);
      
      if (user) {
        req.user = user;
        res.locals.user = user;
      }
    } catch (error) {
      
    }
    next();
  };
}

module.exports = {
  checkAuthenticationForCookie,
};
