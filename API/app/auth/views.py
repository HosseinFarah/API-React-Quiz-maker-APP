from flask import render_template, redirect, url_for, request, flash, current_app, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User
from app import login, db
from ..forms import LoginForm, RegistrationForm, ChangePasswordForm, PasswordResetRequestForm, UpdateAccountForm, ResetEmailRequestForm, ResetEmailForm,UpdateUserByAdmin,SearchForm,UpdatePasswordForm
from app.auth import auth
from werkzeug.utils import secure_filename
import os
from app.email import send_email
from pytz import timezone
from datetime import datetime
from ..decorators import permission_required, admin_required, debugger
from app.models import Role
from sqlalchemy import func
import json
from flask_babel import _  # Add this import for localization
from flask import get_flashed_messages

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

@auth.before_app_request
def before_request():
    if current_user.is_authenticated:
        if not current_user.is_confirmed and request.endpoint[:5] != 'auth.' and request.endpoint != 'static':
            if request.blueprint == 'api' and request.endpoint not in [
                'api.get_csrf_token', 'api.csrf_token', 'api.resend_confirmation', 
                'api.logout', 'api.login', 'api.register', 'api.get_cities', 
                'api.confirm', 'api.confirm_token', '/api/login?next'
            ]:
                current_app.logger.info('User not confirmed, returning JSON response')
                return jsonify({'message': 'User not confirmed', 'redirect': 'http://localhost:5173/confirm'}), 403

@auth.route('/unconfirmed')
def unconfirmed():
    if current_user.is_anonymous or current_user.is_confirmed:
        return redirect(url_for('main.index'))
    return render_template('auth/unconfirmed.html')

@auth.route('/cities', methods=['GET', 'POST'])
def get_cities():
    cities_file = os.path.join(current_app.config['JSON_FOLDER'], 'cities.json')
    with open(cities_file,encoding='utf-8') as f:
        cities = json.load(f)
    return jsonify(cities)


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            current_app.logger.info(f"Login by {user.email}, {user.firstname + user.lastname} at {datetime.now(timezone('US/Eastern')).strftime('%Y-%m-%d %H:%M:%S')}")
            #last_login 
            if current_user.is_authenticated:
                current_user.ping()
            if not current_user.is_active or current_user.is_anonymous:
                flash('Your account has been disabled. Please contact the administrator.', 'danger')
                return redirect(url_for('auth.logout'))
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.index'))
        flash('Invalid email or password.', 'danger')
    return render_template('auth/login.html', title='Login', form=form)

@auth.route('auth/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    form = RegistrationForm()
     # Populate city choices
    cities_file = os.path.join(current_app.config['JSON_FOLDER'], 'cities.json')
    with open(cities_file, encoding='utf-8') as f:
        cities = json.load(f)
    form.city.choices = [(city, city) for city in cities]
    if form.validate_on_submit():
        image = request.files['image']
        if image:
            filename = secure_filename(image.filename)
            image.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
        user = User(firstname=form.firstname.data, lastname=form.lastname.data, email=form.email.data, password=form.password.data, address=form.address.data, zipcode=form.zipcode.data, phone=form.phone.data, image=filename, city=form.city.data)
        db.session.add(user)
        db.session.commit()
        token = user.generate_confirmation_token()
        current_app.logger.info(f"User {user.email} registered at {datetime.now(timezone('US/Eastern')).strftime('%Y-%m-%d %H:%M:%S')}")
        send_email(user.email, 'Confirm Your Account', 'auth/email/confirm', user=user, token=token)
        flash('A confirmation email has been sent via email.', 'info')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html', title='Register', form=form)

@auth.route('/confirm/<token>')
@login_required
def confirm(token):
    if current_user.is_confirmed:
        return redirect(url_for('main.index'))
    if current_user.confirm(token):
        db.session.commit()
        flash('You have confirmed your account. Thanks!', 'success')
    else:
        flash('The confirmation link is invalid or has expired.', 'danger')
    return redirect(url_for('main.index'))


@auth.route('/confirm')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    send_email(current_user.email, 'Confirm Your Account', 'auth/email/confirm', user=current_user, token=token)
    flash('A new confirmation email has been sent via email.', 'info')
    return redirect(url_for('main.index'))

@auth.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    form = PasswordResetRequestForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            token = user.generate_reset_token()
            send_email(user.email, 'Reset Your Password', 'auth/email/reset_password', user=user, token=token)
            flash('An email with instructions to reset your password has been sent to you.', 'info')
        else:
            flash('Something went wrong. Please try again.', 'danger')
        return redirect(url_for('auth.login'))
    return render_template('auth/reset_password_request.html', form=form)

    
@auth.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    form = ChangePasswordForm()
    if form.validate_on_submit():
        if User.reset_password(token, form.password.data):
            flash('Your password has been updated.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('The reset password link is invalid or has expired.', 'danger')
            return redirect(url_for('auth.login'))
    return render_template('auth/reset_password.html', form=form)    
          
@auth.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user=current_user
    member_since = datetime.now(timezone('Europe/Helsinki')) - user.created_at.replace(tzinfo=timezone('Europe/Helsinki'))    
    return render_template('auth/profile.html', title='Profile', user=user, member_since=member_since.days, json=json)

@auth.route('/update_profile', methods=['GET', 'POST'])
@login_required
def update_profile():
    
    image=None
    form = UpdateAccountForm()
    # Populate city choices
    cities_file = os.path.join(current_app.config['JSON_FOLDER'], 'cities.json')
    with open(cities_file, encoding='utf-8') as f:
        cities = json.load(f)
        form.city.choices = [(city, city) for city in cities]
    if form.validate_on_submit():
        if request.files['image']:
            image = request.files['image']
            if image:
                filename = secure_filename(image.filename)
                filename = f"{current_user.id}_{filename}"
                upload_path = current_app.config['UPLOAD_FOLDER']
                if not os.path.exists(upload_path):
                    os.makedirs(upload_path)
                image.save(os.path.join(upload_path, filename))
                current_image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], current_user.image)
                if current_user.image != 'default.jpg' and current_user.image != filename:
                    if os.path.exists(current_image_path):
                        os.remove(current_image_path)         
                current_user.image = filename
        current_user.firstname = form.firstname.data
        current_user.lastname = form.lastname.data
        current_user.address = form.address.data
        current_user.zipcode = form.zipcode.data
        current_user.phone = form.phone.data
        current_user.city = form.city.data
        try:
            db.session.commit()
            print("Database commit successful")
            flash('Your profile has been updated.', 'success')
        except Exception as e:
            db.session.rollback()
            print(f"Database commit failed: {e}")
            flash('An error occurred while updating your profile.', 'danger')
        return redirect(url_for('auth.profile'))
    elif request.method == 'GET':
        form.city.data = current_user.city
        form.firstname.data = current_user.firstname
        form.lastname.data = current_user.lastname
        form.address.data = current_user.address
        form.zipcode.data = current_user.zipcode
        form.phone.data = current_user.phone
        form.image.data = current_user.image
    else:
        print("Form validation failed")
        print(form.errors)
    return render_template('auth/update_profile.html', form=form)


@auth.route('/all_users', methods=['GET', 'POST'])
@login_required
@admin_required
def all_users():
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = 15
    all_users_count = User.query.count()
    if search:
        query = User.query.filter(
            User.firstname.like(f'%{search}%') |
            User.lastname.like(f'%{search}%') |
            User.email.like(f'%{search}%') |
            User.phone.like(f'%{search}%') |
            User.city.like(f'%{search}%') |
            User.address.like(f'%{search}%') |
            User.zipcode.like(f'%{search}%') |
            User.role.has(Role.name.like(f'%{search}%')) |
            (User.firstname + ' ' + User.lastname).like(f'%{search}%')
        )
    else:
        query = User.query

    sort_by = request.args.get('sort_by', 'firstname')


    users = query.paginate(page=page, per_page=per_page, error_out=False)
    return render_template('auth/all_users.html', users=users, search=search, page=page, pages=users.pages, all_users=all_users_count,  sort_by=sort_by)

@auth.route('/edit_user_admin/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_user_admin(id):
    user = User.query.get(id)
    form = UpdateUserByAdmin()
    cities_file = os.path.join(current_app.config['JSON_FOLDER'], 'cities.json')
    with open(cities_file, encoding='utf-8') as f:
        cities = json.load(f)
        form.city.choices = [(city, city) for city in cities]
    if form.validate_on_submit():
        user.firstname = form.firstname.data
        user.lastname = form.lastname.data
        user.city = form.city.data
        user.address = form.address.data
        user.zipcode = form.zipcode.data
        role = Role.query.filter_by(name=form.role.data).first()
        user.is_active = form.is_active.data
        user.role = role
        
        try:
            # for key,value in vars(user).items():
            #     if key in ['firstname','lastname','address','zipcode','is_active','role']:
            #         print(f"{key} : {value}")
            db.session.commit()
            flash('User has been updated.', 'success')
        except Exception as e:
            db.session.rollback()
            flash('An error occurred while updating user.', 'danger')
        return redirect(url_for('auth.all_users'))
    
    elif request.method == 'GET':
        form.firstname.data = user.firstname
        form.lastname.data = user.lastname
        form.city.data = user.city
        form.address.data = user.address
        form.zipcode.data = user.zipcode
        form.role.data = user.role.name if user.role else 'User'
        form.is_active.data = user.is_active
    return render_template('auth/edit_user_admin.html', form=form, user=user)


@auth.route('/delete_user_admin/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def delete_user_admin(id):
    user = User.query.get(id)
    db.session.delete(user)
    db.session.commit()
    flash('User has been deleted.', 'success')
    return redirect(url_for('auth.all_users'))

@auth.route('/update_password', methods=['GET', 'POST'])
@login_required
def update_password():
    form = UpdatePasswordForm()
    if form.validate_on_submit():
        if current_user.check_password(form.old_password.data):
            current_user.password = form.new_password.data
            try:
                db.session.commit()
                flash('Your password has been updated.', 'success')
            except Exception as e:
                db.session.rollback()
                flash('An error occurred while updating your password.', 'danger')
        else:
            flash('Invalid old password.', 'danger')
    return render_template('auth/update_password.html', form=form)

@auth.route('/reset_email_request', methods=['GET', 'POST'])
@login_required
def reset_email_request():
    form = ResetEmailRequestForm()
    if form.validate_on_submit():
        token = current_user.generate_email_change_token(form.email.data)
        send_email(form.email.data, 'Confirm Your Email Address', 'auth/email/change_email', user=current_user, token=token)
        flash('An email with instructions to confirm your new email address has been sent to you.', 'info')
        return redirect(url_for('auth.profile'))
    return render_template('auth/reset_email_request.html', form=form)

@auth.route('/change_email/<token>', methods=['GET', 'POST'])
@login_required
def change_email(token):
    if current_user.change_email(token):
        db.session.commit()
        flash('Your email address has been updated.', 'success')
    else:
        flash('The confirmation link is invalid or has expired.', 'danger')
    return redirect(url_for('auth.profile'))


# Active or Deactive Users without pagination-OK
# @auth.route('/activate_users', methods=['GET', 'POST'])
# @login_required
# @admin_required
# def activate_users():
#     if request.method == 'POST':
#         users = request.form.getlist('users')
#         print(f"Form data: {request.form}")  # Debug print
#         print(f"Selected user IDs: {users}")  # Debug print

#         if 'update_button' in request.form:
#             print("Update button clicked")  # Debug print
#             for user in User.query.all():
#                 is_active = f'is_active_{user.id}' in request.form
#                 print(f"Before update: {user.email}, is_active: {user.is_active}")  # Debug print
#                 user.is_active = is_active
#                 print(f"After update: {user.email}, is_active: {user.is_active}")  # Debug print
#             try:
#                 db.session.commit()
#                 flash('Users have been updated.', 'success')
#             except Exception as e:
#                 db.session.rollback()
#                 print(f"Database commit failed: {e}")  # Debug print
#                 flash('An error occurred while updating users.', 'danger')
#         else:
#             print("No button clicked")  # Debug print
#             flash('No action selected.', 'danger')
#         return redirect(url_for('auth.activate_users'))
    
#     # Handle GET request
#     users = User.query.all()
    
#     return render_template('auth/activate_users.html', users=users)

# Active or Deactive Users with pagination-OK
@auth.route('/activate_users', methods=['GET', 'POST'])
@login_required
@admin_required
def activate_users():
    page = request.args.get('page', 1, type=int)
    per_page = 25 
    if request.method == 'POST':
        users = request.form.getlist('users')
        # print(f"Form data: {request.form}")  # Debug print
        # print(f"Selected user IDs: {users}")  # Debug print

        if 'update_button' in request.form:
            # print("Update button clicked")  # Debug print
            for user_id in users:
                user = User.query.get(int(user_id))
                if user:
                    is_active = f'is_active_{user.id}' in request.form
                    # print(f"Before update: {user.email}, is_active: {user.is_active}")  # Debug print
                    user.is_active = is_active
                    # print(f"After update: {user.email}, is_active: {user.is_active}")  # Debug print
            try:
                db.session.commit()
                flash('Users have been updated.', 'success')
            except Exception as e:
                db.session.rollback()
                # print(f"Database commit failed: {e}")  # Debug print
                flash('An error occurred while updating users.', 'danger')
        else:
            # print("No button clicked")  # Debug print
            flash('No action selected.', 'danger')
        return redirect(url_for('auth.activate_users', page=page))

    # Handle GET request with pagination
    pagination = User.query.paginate(page=page, per_page=per_page)
    users = pagination.items

    return render_template('auth/activate_users.html', users=users, pagination=pagination)

@auth.route('/api/logout', methods=['POST'])
def api_logout():
    if not current_user.is_confirmed:
        return jsonify({'message': 'User not confirmed', 'redirect': 'http://localhost:5173/confirm'}), 403
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200
