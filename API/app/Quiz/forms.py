from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, RadioField, SelectField, TextAreaField, BooleanField, FileField, FieldList, FormField
from wtforms.validators import DataRequired, Length, Optional, ValidationError
from wtforms.fields import DateField
from flask_wtf.file import FileAllowed
from app.models import Quizzes

import os

def img_size(max_size, message=None):
    def _img_size(form, field):
        if field.data:
            field.data.seek(0, os.SEEK_END)  # Seek to end of file
            size = field.data.tell()
            if size > max_size:
                raise ValidationError(message or _('File size must be less than %d bytes') % max_size)
            field.data.seek(0)  # Seek back to beginning of file
    return _img_size

class QuizForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[DataRequired(), Length(min=2, max=1000)])
    status = SelectField('Status', choices=[('available', 'Available'), ('unavailable', 'Unavailable')], validators=[DataRequired()])
    capacity = StringField('Capacity', validators=[DataRequired()])
    start_date = DateField('Start Date', format='%Y-%m-%d', validators=[DataRequired()])
    time_limit = StringField('Time Limit', validators=[DataRequired()])
    image = FileField('Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Only jpg, png, jpeg, gif and webp files allowed'), img_size(1*1024*1024, message='Image size must be less than 1MB')])
    shuffle_questions = BooleanField('Shuffle Questions')
    shuffle_options = BooleanField('Shuffle Options')
    submit = SubmitField('Create Quiz')
    
    def validate_capacity(self, capacity):
        if not capacity.data.isnumeric():
            raise ValidationError('Capacity must be a number')
        if int(capacity.data) < 1:
            raise ValidationError('Capacity must be at least 1')
        if int(capacity.data) > 1000:
            raise ValidationError('Capacity must be at most 1000')
        
    def validate_time_limit(self, time_limit):
        if not time_limit.data.isnumeric():
            raise ValidationError('Time limit must be a number')
        if int(time_limit.data) < 1:
            raise ValidationError('Time limit must be at least 1')
        if int(time_limit.data) > 120:
            raise ValidationError('Time limit must be at most 120')

class AnswerForm(FlaskForm):
    text = StringField('Answer Text', validators=[DataRequired(), Length(min=1, max=500)])
    image = FileField('Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Only jpg, png, jpeg, gif and webp files allowed'), img_size(1*1024*1024, message='Image size must be less than 1MB'), Optional()])
    is_correct = BooleanField('Correct Answer')
    order_number = StringField('Order Number', validators=[Optional()])

class QuestionForm(FlaskForm):
    text = TextAreaField('Question Text', validators=[DataRequired(), Length(min=2, max=1000)])
    image = FileField('Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Only jpg, png, jpeg, gif and webp files allowed'), img_size(1*1024*1024, message='Image size must be less than 1MB'), Optional()])
    format = SelectField('Format', choices=[('multiple_choice', 'Multiple Choice'), ('true_false', 'True/False')], validators=[DataRequired()])
    shuffle_enabled = BooleanField('Shuffle Answers')
    options_format = StringField('Options Format', validators=[DataRequired()])
    score = StringField('Score', validators=[DataRequired()])  # Add score field
    answers = FieldList(FormField(AnswerForm), min_entries=1, max_entries=10)
    submit = SubmitField('Create Question')

    def validate_score(self, score):
        if not score.data.isnumeric():
            raise ValidationError('Score must be a number')
        if float(score.data) <= 0:
            raise ValidationError('Score must be greater than 0')

