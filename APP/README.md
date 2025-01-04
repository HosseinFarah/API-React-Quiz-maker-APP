# Quiz Maker

Quiz Maker is a web application built with Flask and React that allows users to create, manage, and take quizzes. It includes features for user authentication, quiz creation, question management, and result tracking.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication and authorization
- Admin panel for managing quizzes and users
- Create, edit, and delete quizzes
- Add, edit, and delete questions and answers
- Track quiz attempts and results
- CSRF protection for secure requests
- Email confirmation and password reset functionality
- Display quiz status based on start and end dates
- Result graph visualization
- Calendar.js integration for scheduling quizzes

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm 6+

### Backend Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/quiz-maker.git
    cd quiz-maker
    ```

2. Create a virtual environment and activate it:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required Python packages:

    ```bash
    pip install -r requirements.txt
    ```

4. Set up the database:

    ```bash
    flask db upgrade
    ```

5. Run the Flask application:

    ```bash
    flask run
    ```

### Frontend Setup

1. Navigate to the frontend directory:

    ```bash
    cd APP
    ```

2. Install the required npm packages:

    ```bash
    npm install
    ```

3. Install additional npm packages:

    ```bash
    npm install react-calendar chart.js
    ```

4. Start the React development server:

    ```bash
    npm start
    ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your_secret_key
SQLALCHEMY_DATABASE_URI=sqlite:///app.db
MAIL_SERVER=smtp.yourmailserver.com
MAIL_PORT=587
MAIL_USE_TLS=1
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
DEFAULT_ORIGIN=http://localhost:5173