const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");


const path = require('path');
const fs = require('fs');


// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // console.log(req);

  if (req.files && req.files.avatar) {
    const file = req.files.avatar;
    let filePath = file.tempFilePath;

    // If tempFilePath is empty, move the file to a temporary location
    if (!filePath) {
      const tempPath = path.join(__dirname, "..", "tmp", file.name);
      await file.mv(tempPath);
      filePath = tempPath;
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    // console.log("result : ",result)

    avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    // Clean up the temporary file
    if (!file.tempFilePath) {
      fs.unlinkSync(filePath);
    }
  }

  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar,
  });

  sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {

  // console.log(req.body)
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHander("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();



  await user.save({ validateBeforeSave: false });



  // console.log(req.get("host"))
  const resetPasswordUrl = `${req.get("referer")}password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHander(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  

  res.status(200).json({
    success: true,
    user,
  });
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {

  // console.log(req)

  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };


  // console.log(req)

  // Check if avatar is provided
  if (req.files && req.files.avatar) {
    const user = await User.findById(req.user.id);

    // Destroy the existing avatar on Cloudinary
    if (user.avatar && user.avatar.public_id) {
      const imageId = user.avatar.public_id;
      await cloudinary.v2.uploader.destroy(imageId);
      // console.log("Existing avatar destroyed:", imageId);
    }

    // Upload the new avatar to Cloudinary
    const file = req.files.avatar;
    let filePath = file.tempFilePath;

    // If tempFilePath is empty, move the file to a temporary location
    if (!filePath) {
      const tempPath = path.join(__dirname, "..", "tmp", file.name);
      await file.mv(tempPath);
      filePath = tempPath;
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "avatars",
      width: 150,
      crop: "scale",  // if hum ye widht or scale hata denge to pic apni origina qualty me update hogi 
    });

    newUserData.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    // Clean up the temporary file
    if (!file.tempFilePath) {
      fs.unlinkSync(filePath);
    }

    // console.log("New avatar uploaded:", newUserData);
  }

  try {
    // Update the user with new data
    const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!user) {
      return next(new ErrorHander('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return next(new ErrorHander('Email is already registered', 400));
    }
    // Other Mongoose validation errors
    return next(new ErrorHander(error.message, 400));
  }
});
// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

 

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  // console.log("reuqest accepted")

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }

  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
