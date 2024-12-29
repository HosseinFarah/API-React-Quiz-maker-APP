from . import api
from flask import jsonify, request, current_app, redirect, url_for, session, render_template, make_response, flash
from app import db  # Ensure this import is correct
from flask_wtf.csrf import generate_csrf, validate_csrf, CSRFError
from flask_login import login_user, current_user, logout_user
from wtforms import ValidationError
from app.email import send_email
from flask_login import login_required
from ..forms import LoginForm, PasswordResetRequestForm, ChangePasswordForm
from ..forms import RegistrationForm
from ..Quiz.forms import QuizForm
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from pytz import timezone
from flask_babel import _
from ..Quiz.forms import QuestionForm, AnswerForm
from app.models import Questions, Answers, Quizzes, User, QuizResults, QuizAnswers
from sqlalchemy.exc import SQLAlchemyError

@api.errorhandler(400)
def bad_request_error(e):
    response = jsonify({'message': 'Bad Request', 'error': str(e)})
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.error(f'400 Error: {response.get_data(as_text=True)}')
    return response

@api.errorhandler(500)
def internal_server_error(e):
    response = jsonify({'message': 'Internal Server Error', 'error': str(e)})
    response.status_code = 500
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.error(f'500 Error: {response.get_data(as_text(as_text=True))}')
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
    app.logger.error(f'401 Error: {response.get_data(as_text(True))}')
    return response

@api.app_errorhandler(CSRFError)
def handle_csrf_error(e):
    message = {'error': f'CSRF token missing ({e.description}), headers: {str(request.headers)}'}
    current_app.logger.error(f"CSRFError, headers: {str(request.headers)}")
    response = create_response(message, status_code=400)
    response.headers.set('Content-Type', 'application/json')
    current_app.logger.error(f'CSRF Error: {response.get_data(as_text(True))}')
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


@api.route('/user-info', methods=['GET'])
@login_required
def user_info():
    response = jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'firstname': current_user.firstname,
        'lastname': current_user.lastname,
        'is_admin': current_user.is_administrator(),
        'is_confirmed': current_user.is_confirmed,
        'phone': current_user.phone,
        'address': current_user.address,
        'city': current_user.city,
        'zipcode': current_user.zipcode,
        'image': current_user.image,
        'created_at': current_user.created_at,
        'is_active': current_user.is_active,
    })
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response


    
    



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
# ...existing code...

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
    current_app.logger.info(f'Confirm Response: {response.get_data(as_text(True))}')
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
        data['start_date'] = request.form.get('start_date')
        data['end_date'] = request.form.get('end_date')
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
                attempt=form.attempt.data,
                start_date=datetime.strptime(data.get('start_date'), '%Y-%m-%dT%H:%M'),
                end_date=datetime.strptime(data.get('end_date'), '%Y-%m-%dT%H:%M'),
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
        data['start_date'] = request.form.get('start_date')
        data['end_date'] = request.form.get('end_date')
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
            quiz.attempt = form.attempt.data
            quiz.start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%dT%H:%M')
            quiz.end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%dT%H:%M')
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

# ...existing code...
from ..Quiz.forms import QuestionForm, AnswerForm
from app.models import Questions, Answers, Quizzes
# ...existing code...

def save_image(file):
    if file is None:
        return None
    filename = secure_filename(file.filename)
    upload_folder = current_app.config['QUIZ_UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    image_path = os.path.join(upload_folder, filename)
    file.save(image_path)
    current_app.logger.info(f'Image saved to {image_path}')
    return filename

@api.route('/quiz/<int:quiz_id>/create_question', methods=['POST'])
def create_question(quiz_id):
    try:
        quiz = Quizzes.query.get_or_404(quiz_id)
        data = request.form.to_dict(flat=False)
        files = request.files
        current_app.logger.info(f'Received data: {data}')
        current_app.logger.info(f'Received files: {files}')

        # Reconstruct the answers dictionary from individual form fields
        answers = {}
        for key, value in data.items():
            if key.startswith('answers['):
                parts = key.split('[')
                index = int(parts[1][:-1])
                sub_key = parts[2][:-1]
                if index not in answers:
                    answers[index] = {}
                answers[index][sub_key] = value[0]

        current_app.logger.info(f'Parsed answers: {answers}')

        processed_answers = []
        for index, answer in answers.items():
            text = answer['text']
            is_correct = answer['is_correct'] == 'true'
            image = files.get(f'answers[{index}][image]', None)

            current_app.logger.info(f'Processing answer {index}: text={text}, is_correct={is_correct}, image={image}')

            if not text:
                return jsonify({"message": f"Answer {int(index)+1} text is required"}), 400

            processed_answers.append({
                'text': text,
                'is_correct': is_correct,
                'image': image,
                'order_number': int(index)  # Set order number
            })

        current_app.logger.info(f'Processed answers: {processed_answers}')

        question_image = files.get('image', None)
        question = Questions(
            quiz_id=quiz.id,
            text=data.get('text')[0],
            format=data.get('format')[0],
            options_format=data.get('options_format')[0],
            score=float(data.get('score')[0]),  # Set question score
            shuffle_enabled=data.get('shuffle_enabled', ['false'])[0] == 'true',  # Set shuffle_enabled
            image=save_image(question_image)  # Set question image
        )
        db.session.add(question)
        db.session.flush()

        for answer in processed_answers:
            answer_entry = Answers(
                question_id=question.id,
                text=answer['text'],
                is_correct=answer['is_correct'],
                image=save_image(answer['image']),
                order_number=answer['order_number']  # Set order number
            )
            db.session.add(answer_entry)

        db.session.commit()
        current_app.logger.info(f'Question created with ID: {question.id}')
        return jsonify({"message": "Question created successfully"}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {e}")
        return jsonify({"message": "A database error occurred"}), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error: {e}")
        return jsonify({"message": "An unexpected error occurred"}), 500
# ...existing code...

@api.route('/quiz/<int:quiz_id>/questions', methods=['GET'])
def get_questions(quiz_id):
    try:
        quiz = Quizzes.query.get_or_404(quiz_id)
        questions = Questions.query.filter_by(quiz_id=quiz.id).all()
        answers = Answers.query.filter(Answers.question_id.in_([q.id for q in questions])).all()
        questions_dict = [question.to_dict() for question in questions]
        answers_dict = [answer.to_dict() for answer in answers]
        for question in questions_dict:
            question['answers'] = [answer for answer in answers_dict if answer['question_id'] == question['id']]
        response = create_response({'questions': questions_dict})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching questions: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    
    

@api.route('/quiz/<int:quiz_id>/submit', methods=['POST'])
@login_required
def submit_quiz(quiz_id):
    try:
        csrf_token = request.headers.get('X-CSRFToken')
        current_app.logger.info(f'CSRF Token received: {csrf_token}')
        if not csrf_token:
            return jsonify({'message': 'CSRF token missing'}), 400

        validate_csrf(csrf_token)
        current_app.logger.info('CSRF token validated successfully')

        user_id = current_user.id
        quiz = Quizzes.query.get_or_404(quiz_id)
        attempts = QuizResults.get_attempts(user_id, quiz_id)

        if attempts >= quiz.attempt:
            return jsonify({'message': 'Maximum number of attempts reached'}), 403

        data = request.get_json()
        current_app.logger.info(f'Submission data received: {data}')
        questions = data.get('questions')
        duration = data.get('duration')  # Get duration from request data
        end_time = datetime.now(timezone('Europe/Helsinki'))
        quiz_results = QuizResults(quiz_id=quiz.id, user_id=user_id, end_time=end_time, duration=duration)
        db.session.add(quiz_results)
        db.session.flush()
        total_score = 0
        for question in questions:
            question_id = question.get('question_id')
            answers = question.get('answers')
            question_score = 0
            for answer in answers:
                answer_id = answer.get('answer_id')
                correct_answer = Answers.query.filter_by(id=answer_id, question_id=question_id).first()
                is_correct = correct_answer.is_correct if correct_answer else False
                answer_entry = QuizAnswers(
                    result_id=quiz_results.id,
                    question_id=question_id,
                    answer_id=answer_id,
                    is_correct=is_correct
                )
                db.session.add(answer_entry)
                db.session.flush()
                if is_correct:
                    question_score += correct_answer.question.score
            total_score += question_score
        quiz_results.overall_score = total_score
        db.session.commit()
        current_app.logger.info(f'Quiz submitted successfully with score: {total_score}')
        return jsonify({'message': 'Quiz submitted successfully', 'overall_score': total_score}), 201
    except Exception as e:
        current_app.logger.error(f'Error submitting quiz: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response

# ...existing code...

# ...existing code...

@api.route('/answers/<int:question_id>', methods=['GET'])
def get_answers(question_id):
    try:
        question = Questions.query.get_or_404(question_id)
        answers = Answers.query.filter_by(question_id=question.id).all()
        answers_dict = [answer.to_dict() for answer in answers]
        response = create_response({'answers': answers_dict})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching answers: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
# ...existing code...

@api.route('/quiz/<int:quiz_id>/attempts', methods=['GET'])
@login_required
def get_attempts(quiz_id):
    try:
        user_id = current_user.id
        current_app.logger.info(f'Fetching attempts for user_id: {user_id}, quiz_id: {quiz_id}')
        attempts = QuizResults.get_attempts(user_id, quiz_id)
        current_app.logger.info(f'Number of attempts: {attempts}')
        response = create_response({'attempts': attempts})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching attempts: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response


# ...existing code...

# ...existing code...

@api.route('/quiz/<int:quiz_id>/results', methods=['GET'])
@login_required
def get_results(quiz_id):
    try:
        user_id = current_user.id
        current_app.logger.info(f'Fetching results for user_id: {user_id}, quiz_id: {quiz_id}')
        quiz = Quizzes.query.get_or_404(quiz_id)
        results = QuizResults.get_results(user_id, quiz_id)
        current_app.logger.info(f'Number of results fetched: {len(results)}')
        current_app.logger.info(f'Results fetched: {results}')
        results_dict = []
        for result in results:
            result_dict = result.to_dict()
            user = User.query.get(result.user_id)
            result_dict['user'] = {
                'firstname': user.firstname,
                'lastname': user.lastname
            }
            results_dict.append(result_dict)
        
        if not results:
            current_app.logger.info('No results found.')
            response = create_response({'results': [], 'max_score': 0.0})
        else:
            max_score = max([result.overall_score for result in results])
            response = create_response({'results': results_dict, 'max_score': max_score})
            
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching results: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    
    

@api.route('/quiz/<int:quiz_id>/all_results', methods=['GET'])
def get_all_results(quiz_id):
    try:
        current_app.logger.info(f'Fetching all results for quiz_id: {quiz_id}')
        quiz = Quizzes.query.get_or_404(quiz_id)
        results = QuizResults.get_all_results(quiz_id)
        results_dict = []
        for result in results:
            result_dict = result.to_dict()
            user = User.query.get(result.user_id)
            result_dict['user'] = {
                'firstname': user.firstname,
                'lastname': user.lastname
            }
            results_dict.append(result_dict)
        current_app.logger.info(f'Number of results fetched: {len(results_dict)}')
        response = create_response({'results': results_dict})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching results for quiz_id {quiz_id}: {str(e)}')
        response = create_response({'message': 'An error occurred', 'error': str(e)}, 500)
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
# ...existing code...

@api.route('/quiz/<int:quiz_id>/questions/<int:question_id>', methods=['GET'])
def get_question(quiz_id, question_id):
    try:
        quiz = Quizzes.query.get_or_404(quiz_id)
        question = Questions.query.filter_by(id=question_id, quiz_id=quiz.id).first_or_404()
        answers = Answers.query.filter_by(question_id=question.id).all()
        question_dict = question.to_dict()
        answers_dict = [answer.to_dict() for answer in answers]
        question_dict['answers'] = answers_dict
        response = jsonify({'question': question_dict})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        current_app.logger.error(f'Error fetching question: {str(e)}')
        response = jsonify({'message': 'An error occurred', 'error': str(e)})
        response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        return response, 500


# route for updating questions and answers in a quiz
@api.route('/quiz/<int:quiz_id>/update_question', methods=['POST'])
def update_question(quiz_id):
    try:
        if request.method != 'POST':
            current_app.logger.error('Request method is not POST')
            return jsonify({"message": "Method not allowed"}), 405

        quiz = Quizzes.query.get_or_404(quiz_id)
        data = request.form.to_dict(flat=False)
        files = request.files
        current_app.logger.info(f'Received data: {data}')  # Log received data
        current_app.logger.info(f'Received files: {files}')  # Log received files

        if not data:
            current_app.logger.error('No data received in the request')
            return jsonify({"message": "No data received"}), 400

        if not files:
            current_app.logger.error('No files received in the request')
            return jsonify({"message": "No files received"}), 400

        question_id = data.get('question_id')[0]
        question = Questions.query.get_or_404(question_id)
        question.text = data.get('text')[0]
        question.format = data.get('format')[0]
        question.options_format = data.get('options_format')[0]
        question.score = float(data.get('score')[0])
        question.shuffle_enabled = data.get('shuffle_enabled', ['false'])[0] == 'true'
        question_image = files.get('image', None)
        question.image = save_image(question_image)

        current_app.logger.info(f'Updating question: {question_id} with text: {question.text}, format: {question.format}, options_format: {question.options_format}, score: {question.score}, shuffle_enabled: {question.shuffle_enabled}, image: {question.image}')

        answers = {}
        for key, value in data.items():
            if key.startswith('answers['):
                parts = key.split('[')
                index = int(parts[1][:-1])
                sub_key = parts[2][:-1]
                if index not in answers:
                    answers[index] = {}
                answers[index][sub_key] = value[0]

        current_app.logger.info(f'Parsed answers: {answers}')

        processed_answers = []
        for index, answer in answers.items():
            text = answer['text']
            is_correct = answer['is_correct'] == 'true'
            image = files.get(f'answers[{index}][image]', None)
            answer_id = answer.get('id')
            order_number = answer.get('order_number')
            question_id = answer.get('question_id')

            current_app.logger.info(f'Processing answer {index}: id={answer_id}, text={text}, is_correct={is_correct}, image={image}, order_number={order_number}, question_id={question_id}')

            if not text:
                return jsonify({"message": f"Answer {int(index)+1} text is required"}), 400

            processed_answers.append({
                'id': None if answer_id == 'undefined' else answer_id,
                'text': text,
                'is_correct': is_correct,
                'image': image,
                'order_number': None if order_number == 'undefined' else order_number,
                'question_id': None if question_id == 'undefined' else question_id
            })

        current_app.logger.info(f'Processed answers: {processed_answers}')

        existing_answers = Answers.query.filter_by(question_id=question.id).all()
        for answer in existing_answers:
            db.session.delete(answer)

        for answer in processed_answers:
            answer_entry = Answers(
                question_id=answer['question_id'],
                text=answer['text'],
                is_correct=answer['is_correct'],
                image=save_image(answer['image']),
                order_number=answer['order_number']
            )
            db.session.add(answer_entry)            
        db.session.commit()
        current_app.logger.info(f'Question updated with ID: {question.id}')
        return jsonify({"message": "Question updated successfully"}), 200
    
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {e}")
        return jsonify({"message": "A database error occurred"}), 500
    
    except Exception as e:
        current_app.logger.error(f"Unexpected error: {e}")
        return jsonify({"message": "An unexpected error occurred"}), 500
    
# ...existing code...



