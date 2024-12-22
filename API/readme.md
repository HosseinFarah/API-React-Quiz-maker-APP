# Flask Authentication and E-commerce Application

This project is a Flask-based web application that provides user authentication, product management, ticketing system, and e-commerce functionalities. The application supports multiple languages and includes features for both regular users and administrators.

## Project Overview

**Helmi Shop** was created with the aim of offering our customers the best and highest quality products. The Helmi Shop cosmetics store offers a wide selection of famous brands for beauty lovers. In this online store, you can find all kinds of cosmetic products, including creams, cosmetics, perfumes, and skin and hair care products. You can safely buy your beauty products and benefit from high-quality products and services.

## Features

- User Authentication (Login, Registration, Password Reset)
- User Profile Management
- Product Management (Create, Update, Delete, View)
- Category and Brand Management
- Shopping Basket and Checkout with Stripe Payment Gateway
- Ticketing System for User Support
- Multi-language Support
- Admin Dashboard for Managing Users, Products, Orders, and Tickets
- **New Features:**
  - Video support for brands and products
  - Discount management for products
  - Enhanced validation for user input
  - Dynamic city and brand selection
  - Rating system for products

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Flask-Authentication-Ecommerce.git
   cd Flask-Authentication-Ecommerce
   ```

2. **Create a virtual environment and activate it:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:** Create a `.env` file in the root directory and add the following variables:
   ```plaintext
   FLASK_APP=run.py
   FLASK_ENV=development
   SECRET_KEY=your_secret_key
   SQLALCHEMY_DATABASE_URI=sqlite:///site.db
   MAIL_SERVER=smtp.googlemail.com
   MAIL_PORT=587
   MAIL_USE_TLS=1
   MAIL_USERNAME=your_email@example.com
   MAIL_PASSWORD=your_email_password
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_ENDPOINT_SECRET=your_stripe_endpoint_secret
   ```

5. **Initialize the database:**
   ```bash
   flask db init
   flask db migrate -m "Initial migration."
   flask db upgrade
   ```

6. **Run the application:**
   ```bash
   flask run
   ```
## Usage

### User Authentication
- **Register:** Users can register by providing their details including a profile picture.
  ![Register](app/static/uploads/demo/12-registeration.gif)
- **Login:** Registered users can log in using their email and password.
  ![Login](app/static/uploads/demo/07-payment.gif)
- **Profile Management:** Users can update their profile information and change their password.
  ![Profile Management](app/static/uploads/demo/09-update%20profile.gif)
- **Password Reset:** Users can request a password reset link via email.
  ![Password Reset](app/static/uploads/demo/15-resetpassword.gif)

### Product Management
- **Create Product:** Admins can create new products by providing details such as name, price, description, images, etc.
  ![Create Product](app/static/uploads/demo/16-Admin-products.gif)
- **Update Product:** Admins can update existing product details including discounts.
- **Delete Product:** Admins can delete products from the database.
  ![Delete Product](app/static/uploads/demo/16-Admin-other%20sections.gif)
- **View Products:** Users can view all products, filter by categories and brands, and search for specific products. The product categories include skincare products, scents, hair products, and other related products.
  ![View Products](app/static/uploads/demo/1-intro.gif)
- **Product details:** Users can view all product details, including the product description, instructions, ingredients, pictures displayed as a slideshow, and other related product information.
- **Categories:** Users can filter products based on their categories, view related products for each category, and see brand logos displayed for each category that includes the selected products.
- **Brands:** Users can filter products based on their brands, view related products for each brand, and access detailed brand information, including the brand logo, a short announcement, and a description of the brand. Additionally, a complete list of brands is displayed, sorted alphabetically.
- **Discounted products:** Users can filter products that have discounts, with discounted products sorted in ascending order, meaning from the highest discount to the lowest.

### Shopping Basket and Checkout
- **Basket:** Users can easily add their chosen products to the basket. If a selected product has already been added, its quantity is increased, and a related message is displayed. Users can view all selected products in the basket, with options to increase, decrease, or remove products. Pricing is calculated based on whether products have discounts, and the total price reflects the discounted prices where applicable.
  ![Add to Basket](app/static/uploads/demo/06-basket.gif)
- **Checkout with Stripe:** Users can proceed to checkout and make payments using Stripe.
  ![Checkout](app/static/uploads/demo/07-payment.gif)
- **My-orders:** After successfully completing a payment, users can view all their orders in the profile section. Each order history includes the transaction date, details of purchased products (such as product name, quantity, and price), savings for discounted products, and the total price. Additionally, users can access links to each purchased product for further details.

### Ticketing System
- **Create Ticket:** Users can create support tickets by providing a title, description, and optional image.
  ![Create Ticket](app/static/uploads/demo/11-create%20ticket.gif)
- **View Tickets:** Users can view their tickets and admins can view all tickets.
- **Update Ticket:** Users and admins can update ticket details.
- **Answer Ticket:** Users and admins can add messages to tickets for communication.
  ![Answer Ticket](app/static/uploads/demo/11-live%20msg%20system.gif)

### Rating System
- **Add Rating:** Users can rate products and leave reviews after purchasing the products.
- **Update Rating:** Users can update their existing ratings and reviews.
- **View Ratings:** Users, including registered users and guest users, can view all reviews for each product.
  ![View Ratings](app/static/uploads/demo/view_ratings.gif)

### Admin Dashboard
- **Manage Users:** Admins can view, update, and delete user accounts.
  ![Manage Users](app/static/uploads/demo/16-Admin-all%20users.gif)
- **Manage Orders:** Admins can view all orders and their details.
  ![Manage Orders](app/static/uploads/demo/16-Admin-orders.gif)
- **Manage Tickets:** Admins can view and manage all support tickets.
  ![Manage Tickets](app/static/uploads/demo/16-Admin-tickets.gif)

### Multi-language Support
The application supports multiple languages. Users can select their preferred language from the dropdown menu.
  ![Multi-language Support](app/static/uploads/demo/10-multilangual.gif)

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- Flask
- Bootstrap
- Stripe
- Flask-Babel
- Font Awesome for icons
- js libraries for form validation, image preview, dynamic city and brand selection, video support, discount management

This documentation provides an overview of the project's features, installation steps, usage instructions, and other relevant information. For more details, please refer to the project's source code and documentation.
