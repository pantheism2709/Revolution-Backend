# Revolution Backend

The Revolution backend is built using the following technologies:

- **Node.js**:
  - A runtime environment for executing JavaScript on the server.
  - Used for handling backend logic and API routes.
  
- **Express.js**:
  - A web application framework.
  - Used for creating RESTful APIs and handling requests.
  
- **MongoDB**:
  - A NoSQL database.
  - Used for storing data related to product management.
  
- **Cloudinary**:
  - Used for image and video management (as mentioned in the frontend).
  
- **Stripe**:
  - Payment processing integration.

## Features

- **Authentication**:
  - JWT-based authentication for secure user sessions.
  
- **Product Management**:
  - Admins can add products and edit the users role.
  
- **Payment**:
  - Stripe integration for handling payments.

## Getting Started

1. **Clone the repository:**
   git clone https://github.com/your-username/revolution-backend.git

2. **Set environment variables:**
- Create a `.env` file in the config directory inside the backend code .
- Add the following variables:
  ```
  PORT=
 
  DB_URI=

  STRIPE_API_KEY=
  
  STRIPE_SECRET_KEY=
  
  JWT_SECRET=
  
  JWT_EXPIRE=
  
  COOKIE_EXPIRE=
  
  SMTP_SERVICE=
  
  SMTP_EMAIL=
  
  SMTP_PASSWORD=
  
  SMTP_HOST=
  
  SMTP_PORT=
  
  CLOUDINARY_NAME=
  
  CLOUDINARY_API_KEY=
  
  CLOUDINARY_API_SECRET=
  ```

3. **Install dependencies and start the server:**
   npm install
    npm start


4. **Access the server:**
- The backend will run on [http://localhost:9000](http://localhost:9000).




