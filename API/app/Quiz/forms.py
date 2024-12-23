from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, RadioField, SelectField, TextAreaField, BooleanField, FileField, FieldList, FormField
from wtforms.validators import DataRequired, Length, Email, Regexp, Optional, ValidationError
from wtforms.fields import DateField
from flask_wtf.file import FileAllowed, FileRequired
from flask_login import current_user
from app.models import User, Quizzes, Questions, Answers, Options, QuestionType

import os

def img_size(max_size, message=None):
    def _img_size(form, field):
        if field.data:
            field.data.seek(0, os.SEEK_END) # Seek to end of file
            size = field.data.tell()
            if size > max_size:
                raise ValidationError(message or _('File size must be less than %d bytes') % max_size)
            field.data.seek(0) # Seek back to beginning of file
    return _img_size


class QuizForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[DataRequired(), Length(min=2, max=1000)])
    status = SelectField('Status', choices=[('available', 'Available'), ('unavailable', 'Unavailable')], validators=[DataRequired()])
    capacity = StringField('Capacity', validators=[DataRequired()])
    start_date = DateField('Start Date', format='%Y-%m-%d', validators=[DataRequired()])
    time_limit = StringField('Time Limit', validators=[DataRequired()])
    image = FileField('Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Only jpg, png, jpeg, gif and webp files allowed'),  img_size(1*1024*1024, message='Image size must be less than 1MB')])
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
        
class OptionForm(FlaskForm):
    option_text = StringField('Option Text', validators=[DataRequired(), Length(min=1, max=255)])
    option_image = FileField('Option Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Only jpg, png, jpeg, gif and webp files allowed'), Optional(), img_size(1*1024*1024, message='Image size must be less than 1MB')])
    # Remove order_number field

class QuestionForm(FlaskForm):
    question = TextAreaField('Question', validators=[DataRequired(), Length(min=2, max=1000)])
    image = FileField('Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'webp'], 'Only jpg, png, jpeg, gif and webp files allowed'), Optional(), img_size(1*1024*1024, message='Image size must be less than 1MB')])
    # Remove order_number field
    question_type_id = SelectField('Question Type', coerce=int, validators=[DataRequired()])
    quiz_id = SelectField('Quiz', coerce=int, validators=[DataRequired()])
    options = FieldList(FormField(OptionForm), min_entries=2, max_entries=10)
    correct_option = RadioField('Correct Option', coerce=int, validators=[DataRequired()])
    shuffle_options = BooleanField('Shuffle Options')
    submit = SubmitField('Add Question')
    
    def __init__(self, *args, **kwargs):
        super(QuestionForm, self).__init__(*args, **kwargs)
        self.question_type_id.choices = [(qt.id, qt.type_name) for qt in QuestionType.query.all()]
        self.quiz_id.choices = [(q.id, q.title) for q in Quizzes.query.all()]

    
    def validate_options(self, options):
        if len(options.data) < 2:
            raise ValidationError('There must be at least two options')
        self.correct_option.choices = [(i, opt.option_text.data) for i, opt in enumerate(options)]



