from . import api
from flask import jsonify, request, current_app, redirect, url_for, session, render_template, make_response, flash
from app import db  # Ensure this import is correct
from flask_wtf.csrf import generate_csrf, validate_csrf, CSRFError
from flask_login import login_user, current_user, logout_user
from app.models import User, Quizzes, Questions, Answers, Options, QuestionType
from wtforms import ValidationError
from app.email import send_email
from flask_login import login_required
from ..forms import LoginForm, PasswordResetRequestForm, ChangePasswordForm
from ..forms import RegistrationForm
from ..Quiz.forms import QuizForm, QuestionForm, OptionForm
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from pytz import timezone
from flask_babel import _

@api.errorhandler(400)
def bad_request_error(e):
    response = jsonify({'message': 'Bad Request', 'error': str(e)})
    response.status_code = 400
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.error(f'400 Error: {response.get_data(as_text=True)}')
    return response

@api.errorhandler(500)
def internal_server_error(e):
    response = jsonify({'message': 'Internal Server Error', 'error': str(e)})
    response.status_code = 500
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.error(f'500 Error: {response.get_data(as_text=True)}')
    return response

def create_response(message, status_code=200):
    default_origin = 'http://localhost:5173'
    default_origin = current_app.config.get('DEFAULT_ORIGIN', default_origin)
    origin = request.headers.get('Origin', default_origin)
    response = make_response(jsonify(message))
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.status_code = status_code
    return response

@api.app_errorhandler(401)
def page_not_allowed(e):
    app = current_app._get_current_object()
    app.logger.debug('api.app_errorhandler 401, endpoint %s', request.endpoint)
    app.logger.debug('api.app_errorhandler 401, path %s', request.path)
    if request.endpoint == 'api.confirm':
        redirect_url = app.config['REACT_LOGIN'] + "?next=" + request.path
        return redirect(redirect_url)
    message = {'error': 'Authentication required.'}
    response = create_response(message, status_code=401)
    response.headers.set('Content-Type', 'application/json')
    app.logger.error(f'401 Error: {response.get_data(as_text=True)}')
    return response

@api.app_errorhandler(CSRFError)
def handle_csrf_error(e):
    message = {'error': f'CSRF token missing ({e.description}), headers: {str(request.headers)}'}
    current_app.logger.error(f"CSRFError, headers: {str(request.headers)}")
    response = create_response(message, status_code=400)
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.error(f'CSRF Error: {response.get_data(as_text=True)}')
    return response

# ...existing code...
@api.route('/login', methods=['POST'])
def login():
    try:
        csrf_token = request.headers.get('X-CSRFToken')
        current_app.logger.info(f'CSRF Token received: {csrf_token}')
        if not csrf_token:
            return jsonify({'message': 'CSRF token missing'}), 400

        validate_csrf(csrf_token)
        current_app.logger.info('CSRF token validated successfully')

        form = LoginForm()
        if form.validate_on_submit():
            user = User.query.filter_by(email=form.email.data.lower()).first()
            if user and user.check_password(form.password.data):
                login_user(user, form.remember.data)
                admin = user.is_administrator()
                token = request.json.get('token')  # Get token from request body
                current_app.logger.info(f'Confirmation token received: {token}')
                if token and not user.is_confirmed:
                    if user.confirm(token):
                        db.session.commit()
                        current_app.logger.info('User confirmed successfully')
                        response = jsonify({'success': True, 'confirmed': user.is_confirmed, 'admin': admin, 'user': user.email})
                        response.status_code = 200
                        return response
                    else:
                        current_app.logger.error('Invalid or expired token, please login again and request a new confirmation email')
                        response = jsonify({'success': False, 'message': 'Invalid or expired token, please login again and request a new confirmation email'})
                        response.status_code = 400
                        return response
                response = jsonify({'success': True, 'confirmed': user.is_confirmed, 'admin': admin, 'user': user.email})
                response.status_code = 200
                return response
            else:
                response = jsonify({'success': False, 'message': "Invalid email or password"})
                response.status_code = 401
                return response
        else:
            response = jsonify({
                "success": False,
                "message": "Invalid data provided.",
                "errors": form.errors
            })
            response.status_code = 400
            return response
    except ValidationError as e:
        return jsonify({'message': 'Invalid CSRF token', 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500
# ...existing code...

@api.route('/csrf-token', methods=['GET', 'OPTIONS'])
def csrf_token():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRFToken')
        return response, 200
    
    if request.method != 'GET':
        return jsonify({'message': 'Method not allowed'}), 405

    if not current_user.is_authenticated:
        return jsonify({'message': 'User not authenticated'}), 403

    try:
        csrf_token = generate_csrf()
        current_app.logger.info(f'Generated CSRF Token: {csrf_token}')
        response = jsonify({'csrf_token': csrf_token})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRFToken')
        response.set_cookie('csrf_token', csrf_token, httponly=True)
        return response, 200
    except Exception as e:
        current_app.logger.error(f'Error generating CSRF token: {str(e)}')
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

@api.route('/confirmation-status', methods=['GET'])
def confirmation_status():
    if not current_user.is_authenticated:
        return jsonify({'is_authenticated': False}), 401
    return jsonify({
        'is_authenticated': True,
        'is_confirmed': current_user.is_confirmed
    }), 200

# ...existing code...
@api.route('/confirm/<token>', methods=['GET'])
def confirm(token):
    if not current_user.is_authenticated:
        session['confirmation_token'] = token
        return redirect(url_for('api.login', next=request.path))
    
    if current_user.is_confirmed:
        response = create_response({'message': 'User already confirmed', 'is_confirmed': True}, 200)
    elif current_user.confirm(token):
        db.session.commit()
        response = create_response({'message': 'User confirmed', 'is_confirmed': True, 'token': token}, 200)
    else:
        response = create_response({'message': 'Invalid or expired token, please login again and request a new confirmation email'}, 400)
    
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.info(f'Confirm Response: {response.get_data(as_text=True)}')
    return response
# ...existing code...

# ...existing code...
@api.route('/confirm', methods=['POST'])
def resend_confirmation():
    if not request.is_json:
        return create_response({'message': 'Request content type must be application/json'}, 400)

    try:
        email = request.json.get('email')
        token = request.json.get('token')  # Get token from request body
        if not email:
            return create_response({'message': 'Email is required'}, 400)

        user = User.query.filter_by(email=email.lower()).first()
        if not user:
            return create_response({'message': 'User not found'}, 404)

        if token and not user.is_confirmed:
            if user.confirm(token):
                db.session.commit()
                current_app.logger.info('User confirmed successfully')
                response = jsonify({'success': True, 'confirmed': user.is_confirmed, 'user': user.email})
                response.status_code = 200
                return response
            else:
                current_app.logger.error('Invalid or expired token, please login again and request a new confirmation email')
                response = jsonify({'success': False, 'message': 'Invalid or expired token, please login again and request a new confirmation email'})
                response.status_code = 400
                return response

        token = user.generate_confirmation_token()
        app = current_app._get_current_object()
        app.logger.debug('/confirm: %s', user.email)
        send_email(user.email, 'Confirm Your Account',
                   'api/email/confirm', user=user, token=token)
        message = 'A new confirmation email has been sent to you by email.'
        response = jsonify({'success': True, 'message': message})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error resending confirmation email: {str(e)}')
        return create_response({'message': 'An error occurred', 'error': str(e)}, 500)
# ...existing code...

def clear_browsing_history():
    response = redirect(url_for('main.index'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@api.route('/logout', methods=['POST'])
def logout():
    logout_user()
    response = jsonify({'success': True})
    response.status_code = 200
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response

@api.route('/cities', methods=['GET', 'POST'])
def get_cities():
    cities_file = os.path.join(current_app.config['JSON_FOLDER'], 'cities.json')
    with open(cities_file, encoding='utf-8') as f:
        cities = json.load(f)
    response = jsonify(cities)
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response  # Ensure a response is returned

@api.route('/register', methods=['POST'])
def register():
    try:
        data = request.form.to_dict()
        image = request.files.get('image')
        
        current_app.logger.debug(f'Registration data received: {data}')
        if image:
            current_app.logger.debug(f'Image received: {image.filename}')
        else:
            current_app.logger.debug('No image received')
        
        csrf_token = data.get('csrf_token')
        current_app.logger.debug(f'CSRF Token received: {csrf_token}')
        if not csrf_token:
            return create_response({'message': 'CSRF token missing'}, 400)

        validate_csrf(csrf_token)
        current_app.logger.info('CSRF token validated successfully')

        form = RegistrationForm(data=data)
        cities_file = os.path.join(current_app.config['JSON_FOLDER'], 'cities.json')
        with open(cities_file, encoding='utf-8') as f:
            cities = json.load(f)
            form.city.choices = [(city, city) for city in cities]
        if form.validate():

            user = User(
                firstname=form.firstname.data,
                lastname=form.lastname.data,
                email=form.email.data.lower(),
                password=form.password.data,
                address=form.address.data,
                zipcode=form.zipcode.data,
                phone=form.phone.data,
                city=form.city.data,
            )
            if image:
                filename = secure_filename(image.filename)
                image.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                user.profile_picture = filename

            db.session.add(user)
            db.session.commit()
            token = user.generate_confirmation_token()
            send_email(user.email, 'Confirm Your Account', 'api/email/confirm', user=user, token=token)
            return create_response({'message': 'A confirmation email has been sent to you by email.'}, 201)
        else:
            current_app.logger.debug(f'Form validation errors: {form.errors}')
            return create_response({'message': 'Invalid data provided.', 'errors': form.errors}, 400)
    except ValidationError as e:
        return create_response({'message': 'Invalid CSRF token', 'error': str(e)}, 400)
    except Exception as e:
        current_app.logger.error(f'Error during registration: {str(e)}')
        return create_response({'message': 'An error occurred', 'error': str(e)}, 500)

@api.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:
        response = create_response({'message': 'Already authenticated'}, 400)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    form = PasswordResetRequestForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            token = user.generate_reset_token()
            send_email(user.email, _('Reset Your Password'), 'api/email/reset_password', user=user, token=token)
            response = create_response({'message': 'An email with instructions to reset your password has been sent to you.'}, 200)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            response = create_response({'message': 'Something went wrong. Please try again.'}, 400)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
    response = create_response({'message': 'Invalid data provided.', 'errors': form.errors}, 400)
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response

@api.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        response = create_response({'message': 'Already authenticated'}, 400)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    form = ChangePasswordForm()
    if form.validate_on_submit():
        if User.reset_password(token, form.password.data):
            response = create_response({'message': 'Your password has been updated.'}, 200)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            response = create_response({'message': 'The reset password link is invalid or has expired.'}, 400)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
    response = create_response({'message': 'Passwords do not match.', 'errors': form.errors}, 400)
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response

# ...existing code...

@api.route('/quiz/create', methods=['POST'])
def create_quiz():
    try:
        if 'application/json' in request.content_type:
            return create_response({'message': 'Request content type must be multipart/form-data'}, 400)

        data = request.form.to_dict()
        form = QuizForm(data=data)
        if form.validate():
            image = request.files.get('image')
            filename = None
            if image:
                filename = secure_filename(image.filename)
                upload_folder = current_app.config['QUIZ_UPLOAD_FOLDER']
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                image.save(os.path.join(upload_folder, filename))
            
            shuffle_questions_enabled = data.get('shuffle_questions_enabled') == 'true'
            
            quiz = Quizzes(
                title=form.title.data,
                description=form.description.data,
                status=form.status.data,
                capacity=form.capacity.data,
                start_date=form.start_date.data,
                time_limit=form.time_limit.data,
                image=filename,
                shuffle_questions_enabled=shuffle_questions_enabled
            )
            db.session.add(quiz)
            db.session.commit()
            response = create_response({'message': 'Quiz created successfully'}, 201)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
            
        else:
            errors = {}
            for field, field_errors in form.errors.items():
                errors[field] = field_errors
            response = create_response({'message': 'Invalid data provided.', 'errors': errors}, 400)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
    except Exception as e:
        current_app.logger.error(f'Error creating quiz: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
# ...existing code...

@api.route('/quiz/<int:quiz_id>/add_question', methods=['POST'])
def add_question(quiz_id):
    try:
        quiz = Quizzes.query.get_or_404(quiz_id)
        data = request.form.to_dict()
        form = QuestionForm(data=data)
        
        if form.validate():
            image = request.files.get('image')
            filename = None
            if image:
                filename = secure_filename(image.filename)
                upload_folder = current_app.config['QUESTION_UPLOAD_FOLDER']
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                image.save(os.path.join(upload_folder, filename))
            
            question = Questions(
                question=form.question.data,
                image=filename,
                quiz_id=quiz.id,
                order_number=form.order_number.data,
                question_type_id=form.question_type_id.data
            )
            db.session.add(question)
            db.session.commit()

            for option_form in form.options.entries:
                option = Options(
                    option=option_form.form.option_text.data,
                    image=option_form.form.option_image.data,
                    score=option_form.form.score.data,
                    question_id=question.id
                )
                db.session.add(option)
            db.session.commit()

            response = create_response({'message': 'Question added successfully'}, 201)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            errors = {}
            for field, field_errors in form.errors.items():
                errors[field] = field_errors
            response = create_response({'message': 'Invalid data provided.', 'errors': errors}, 400)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
    except Exception as e:
        current_app.logger.error(f'Error adding question: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response

# ...existing code...

@api.route('/all_quizzes', methods=['GET'])
def all_quizzes():
    try:
        quizzes = Quizzes.query.all()
        response = create_response({'quizzes': [quiz.to_dict() for quiz in quizzes]})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching quizzes: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response

# ...existing code...

@api.route('/quiz/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    quiz = Quizzes.query.get_or_404(quiz_id)
    response = create_response({'quiz': quiz.to_dict()})
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response
# ...existing code...

@api.route('/quiz/edit/<int:quiz_id>', methods=['POST'])
def edit_quiz(quiz_id):
    try:
        quiz = Quizzes.query.get_or_404(quiz_id)
        data = request.form.to_dict()
        form = QuizForm(data=data)
        if form.validate():
            image = request.files.get('image')
            if image:
                # Save the new image
                filename = secure_filename(image.filename)
                upload_folder = current_app.config['QUIZ_UPLOAD_FOLDER']
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                image.save(os.path.join(upload_folder, filename))
                quiz.image = filename
            else:
                # Use the existing image only if provided; otherwise, keep the current image
                existing_image = data.get('existing_image')
                if existing_image and isinstance(existing_image, str):
                    quiz.image = existing_image
                # No `else` needed; retain the current image if neither new nor existing is provided

            quiz.title = form.title.data
            quiz.description = form.description.data
            quiz.status = form.status.data
            quiz.capacity = form.capacity.data
            quiz.start_date = form.start_date.data
            quiz.time_limit = form.time_limit.data
            quiz.shuffle_questions_enabled = data.get('shuffle_questions') == 'true'
            db.session.commit()

            response = create_response({'message': 'Quiz updated successfully'}, 200)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
        else:
            errors = {}
            for field, field_errors in form.errors.items():
                errors[field] = field_errors
            response = create_response({'message': 'Invalid data provided.', 'errors': errors}, 400)
            response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
            response.headers.set('Access-Control-Allow-Credentials', 'true')
            return response
    except Exception as e:
        current_app.logger.error(f'Error editing quiz: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response

# ...existing code...
@api.route('/quiz/delete/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    try:
        quiz = Quizzes.query.get_or_404(quiz_id)
        db.session.delete(quiz)
        db.session.commit()
        response = create_response({'message': 'Quiz deleted successfully'}, 200)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error deleting quiz: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
# ...existing code...
