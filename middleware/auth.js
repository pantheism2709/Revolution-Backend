const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {

  // console.log(req)
  const { token } = req.cookies;

  // console.log("token"+token)

  // console.log("hello authenticated")

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }


  

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);






  next();
});

exports.authorizeRoles = (...roles) => {





  return (req, res, next) => {

  // console.log(req.role)
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};
