const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");


const path=require('path')
const fs=require('fs')


// Create Product -- Admin
// exports.createProduct = catchAsyncErrors(async (req, res, next) => {
//   let images ;
  



//   // console.log(req)
  
//   // if (typeof req.body.images === "string") {
//   //   images.push(req.body.images);
//   // } else {
//   //   images = req.body.images;

//   // }

 
// console.log(req)
 

// images=req.files.images;

// // console.log(images)

//   const imagesLinks = [];

//   for (let i = 0; i < images.length; i++) {

//     // console.log(images[i])
//     // const result = await cloudinary.v2.uploader.upload(images[i], {
//     //   folder: "products",
//     // });

    

    

//     const file=req.files.images[i];

//     console.log(file)
    
//     let filePath = file.tempFilePath;

//     // If tempFilePath is empty, move the file to a temporary location
//     if (!filePath) {
//       const tempPath = path.join(__dirname, "..", "tmp", file.name);
//       await file.mv(tempPath);
//       filePath = tempPath;
//     }

//     console.log("filePath"+filePath)

//     // Upload the file to Cloudinaryy
//     const result = await cloudinary.v2.uploader.upload(filePath, {
//       folder: "products",
//       resresource_type: 'image'
//     });

  

//     imagesLinks.push({
//       public_id: result.public_id,
//       url: result.secure_url,
//     });

//     console.log(imagesLinks)


//      // Clean up the temporary file
//      if (!file.tempFilePath) {
//       fs.unlinkSync(filePath);
//     }







//   }

//   console.log(imagesLinks)

//   req.body.images = imagesLinks;
//   req.body.user = req.user.id;

//   const product = await Product.create(req.body);

//   res.status(201).json({
//     success: true,
//     product,
//   });
// });



exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];

  // console.log(req);

  // Ensure images is an array
  if (req.files && req.files.images) {
    if (Array.isArray(req.files.images)) {
      images = req.files.images;
    } else {
      images = [req.files.images];
    }
  }

  // console.log(images);

  if (images.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded',
    });
  }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const file = images[i];

    // console.log(file);

    let filePath = file.tempFilePath;

    // If tempFilePath is empty, move the file to a temporary location
    if (!filePath) {
      const tempPath = path.join(__dirname, "..", "tmp", file.name);
      await file.mv(tempPath);
      filePath = tempPath;
    }

    // console.log("filePath: " + filePath);

    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: "products",
        resource_type: 'image'
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      // console.log(imagesLinks);

      // Clean up the temporary file
      if (!file.tempFilePath) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Cloudinary upload error: ", error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image to Cloudinary',
      });
    }
  }

  // console.log(imagesLinks);

  req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});


// Get All Product
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {

 
  const resultPerPage = 8;
  const productsCount = await Product.countDocuments();

  // console.log(req.query)

  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeature.query;

  let filteredProductsCount = products.length;

  apiFeature.pagination(resultPerPage);

  products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  // console.log(req)

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Images Start Here
  let images = [];

  if(req.files && req.files.images)
    {
      if(Array.isArray(req.files.images))
        {
          images=req.files.images;

        }
        else{
          images=[req.files.images];
        }
    }
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
      });
    }
    
    
 

  
    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
    const file = images[i];

    // console.log(file);

    let filePath = file.tempFilePath;

    // If tempFilePath is empty, move the file to a temporary location
    if (!filePath) {
      const tempPath = path.join(__dirname, "..", "tmp", file.name);
      await file.mv(tempPath);
      filePath = tempPath;
    }

    // console.log("filePath: " + filePath);

    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: "products",
        resource_type: 'image'
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      // console.log(imagesLinks);

      // Clean up the temporary file
      if (!file.tempFilePath) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Cloudinary upload error: ", error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image to Cloudinary',
      });
    }
  }

    req.body.images = imagesLinks;
  

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);



  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Delete Successfully",
  });
});

// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  // console.log(req);
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
