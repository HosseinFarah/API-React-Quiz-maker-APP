from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, SelectField, IntegerField, DateField, FileField, HiddenField, RadioField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, Regexp
from app.models import User
from flask_login import current_user
from flask_wtf.file import FileAllowed, FileRequired
import re
import os
from flask_babel import _

class LoginForm(FlaskForm):
    email = StringField(_('Email'), validators=[DataRequired(), Email()])
    password = PasswordField(_('Password'), validators=[DataRequired()])
    remember = BooleanField(_('Remember Me'))
    submit = SubmitField(_('Login'))
    
# Custom validator for image size
def img_size(max_size, message=None):
    def _img_size(form, field):
        if field.data:
            field.data.seek(0, os.SEEK_END) # Seek to end of file
            size = field.data.tell()
            if size > max_size:
                raise ValidationError(message or _('File size must be less than %d bytes') % max_size)
            field.data.seek(0) # Seek back to beginning of file
    return _img_size

class RegistrationForm(FlaskForm):
    firstname = StringField(_('First Name'), validators=[DataRequired(), Length(min=2, max=100), Regexp(_("^[a-zåäöA-ZÅÄÖ'\\-]+$"), message=_('Only letters, hyphens and apostrophes allowed'))])
    lastname = StringField(_('Last Name'), validators=[DataRequired(), Length(min=2, max=100), Regexp(_("^[a-zåäöA-ZÅÄÖ'\\-]+$"), message=_('Only letters, hyphens and apostrophes allowed'))])
    email = StringField(_('Email'), validators=[DataRequired(), Email()])
    password = PasswordField(_('Password'),validators=[DataRequired(),Regexp(_(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/]{8,}$"),message=_('Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long'))])
    confirm_password = PasswordField(_('Confirm Password'), validators=[DataRequired(), EqualTo('password')])
    address = StringField(_('Address'), validators=[DataRequired(),Regexp(_("^[a-zåäöA-ZÅÄÖ0-9'\\- ]+$"), message=_('Only letters, numbers, hyphens and apostrophes allowed'))])
    zipcode = StringField(_('Zip Code'), validators=[DataRequired(),Regexp(_("^[0-9]{5}$"), message=_('Zip code must be 5 digits long'))])
    city = SelectField(_('City'), choices=[], validators=[DataRequired()])
    phone = StringField(_('Phone Number'), validators=[DataRequired(),Regexp(_("^[\d\s\-\+\(\)]{1,15}$"), message=_('Phone number must have at most 15 digits and can contain numbers, spaces, hyphens, plus signs and parentheses'))])
    image = FileField(_('Profile Picture'), validators=[FileAllowed(['jpg', 'png', 'jpeg','webp', 'gif'], _('Only jpg, png, jpeg, webp and gif files allowed')), FileRequired(),img_size(1*1024*1024, message=_('Image size must be less than 1MB'))])
    submit = SubmitField(_('Sign Up'))
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError(_('Email already in use. Please choose a different one.'))
        
    def validate_phone(self, phone):
        user = User.query.filter_by(phone=phone.data).first()
        if user:
            raise ValidationError(_('Phone number already in use. Please choose a different one.'))
   
class UpdateAccountForm(FlaskForm):
    firstname = StringField(_('First Name'), validators=[DataRequired(), Length(min=2, max=100), Regexp(_("^[a-zåäöA-ZÅÄÖ'\\-]+$"), message=_('Only letters, hyphens and apostrophes allowed'))])
    lastname = StringField(_('Last Name'), validators=[DataRequired(), Length(min=2, max=100), Regexp(_("^[a-zåäöA-ZÅÄÖ'\\-]+$"), message=_('Only letters, hyphens and apostrophes allowed'))])
    city = SelectField(_('City'), choices=[], validators=[DataRequired()])
    address = StringField(_('Address'), validators=[DataRequired(),Regexp(_("^[a-zåäöA-ZÅÄÖ0-9'\\- ]+$"), message=_('Only letters, numbers, hyphens and apostrophes allowed'))])
    zipcode = StringField(_('Zip Code'), validators=[DataRequired(),Regexp(_("^[0-9]{5}$"), message=_('Zip code must be 5 digits long'))])
    phone = StringField(_('Phone Number'), validators=[DataRequired(),Regexp(_("^[\d\s\-\+\(\)]{1,15}$"), message=_('Phone number must have at most 15 digits and can contain numbers, spaces, hyphens, plus signs and parentheses'))])
    image = FileField(_('Update Profile Picture'), validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif','webp'], _('Only jpg, png, jpeg, webp and gif files allowed')),img_size(1*1024*1024, message=_('Image size must be less than 1MB'))])
    submit = SubmitField(_('Update'))
    
    def validate_phone(self, phone):
        if phone.data != current_user.phone:
            user = User.query.filter_by(phone=phone.data).first()
            if user:
                raise ValidationError(_('Phone number already in use. Please choose a different one.'))
            

    
class PasswordResetRequestForm(FlaskForm):
    email = StringField(_('Email'), validators=[DataRequired(), Email()])
    submit = SubmitField(_('Request Password Reset'))
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is None:
            raise ValidationError(_('There is no account with that email. You must register first.'))
        
class ChangePasswordForm(FlaskForm):
    password = PasswordField(_('Password'),validators=[DataRequired(),Regexp(_(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/]{8,}$"),message=_('Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long'))])
    confirm_password = PasswordField(_('Confirm Password'), validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField(_('Reset Password'))
    
class ResetEmailRequestForm(FlaskForm):
    email = StringField(_('Email'), validators=[DataRequired(), Email()])
    submit = SubmitField(_('Request Email Reset'))
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None and user.email != current_user.email:
            raise ValidationError(_('This email is already in use. Please choose a different one.'))

class ResetEmailForm(FlaskForm):
    email = StringField(_('Email'), validators=[DataRequired(), Email()])
    submit = SubmitField(_('Reset Email'))
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError(_('Email already in use. Please choose a different one.'))

class UpdateUserByAdmin(FlaskForm):
    firstname = StringField(_('First Name'), validators=[DataRequired(), Length(min=2, max=100), Regexp(_("^[a-zåäöA-ZÅÄÖ'\\-]+$"), message=_('Only letters, hyphens and apostrophes allowed'))])
    lastname = StringField(_('Last Name'), validators=[DataRequired(), Length(min=2, max=100), Regexp(_("^[a-zåäöA-ZÅÄÖ'\\-]+$"), message=_('Only letters, hyphens and apostrophes allowed'))])
    city = SelectField(_('City'), choices=[], validators=[DataRequired()])
    address = StringField(_('Address'), validators=[DataRequired(),Regexp(_("^[a-zåäöA-ZÅÄÖ0-9'\\- ]+$"), message=_('Only letters, numbers, hyphens and apostrophes allowed'))])
    zipcode = StringField(_('Zip Code'), validators=[DataRequired(),Regexp(_("^[0-9]{5}$"), message=_('Zip code must be 5 digits long'))])
    role = SelectField(_('Role'), choices=[('User', _('User')), ('Moderator', _('Moderator')), ('Administrator', _('Administrator'))], validators=[DataRequired()])
    is_active = BooleanField(_('is_active'))
    submit = SubmitField(_('Update'))

class SearchForm(FlaskForm):
    search = StringField(_('Search'), validators=[DataRequired()])
    submit = SubmitField(_('Search'))
    
    def validate_search(self, search):
        if search.data == '':
            raise ValidationError(_('You must enter a search term.'))

class UpdatePasswordForm(FlaskForm):
    old_password = PasswordField(_('Old Password'), validators=[DataRequired()])
    new_password = PasswordField(_('New Password'),validators=[DataRequired(),Regexp(_(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:'\",.<>?/]{8,}$"),message=_('Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long'))])
    confirm_password = PasswordField(_('Confirm New Password'), validators=[DataRequired(), EqualTo('new_password')])
    submit = SubmitField(_('Update Password'))

