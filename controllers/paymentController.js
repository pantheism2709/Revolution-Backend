const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.processPayment = catchAsyncErrors(async (req, res, next) => {

  // console.log("req: "+req)


 

  const myPayment = await stripe.paymentIntents.create({
    description: 'Software development services',
    shipping: {
      name: req.body.user.name,
      address: {
        line1: req.body.shippingInfo.address,
        city: req.body.shippingInfo.city,
        state: req.body.shippingInfo.state,
        postal_code: req.body.shippingInfo.pinCode,
        country: req.body.shippingInfo.country,
      },
    },
    amount: req.body.paymentData.amount,
    currency: "inr",
    metadata: {
      company: "Revolution",
    },
    // payment_method_types: ['card'], 

    automatic_payment_methods: {
      enabled: true,
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
});

exports.sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {

  // console.log("sending stripe api key")
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});
