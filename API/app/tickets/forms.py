from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField, SelectField, HiddenField
from wtforms.validators import DataRequired, Length, ValidationError
from flask_wtf.file import FileField, FileAllowed
import os
from flask import current_app

def img_size(max_size, message=None):
    def _img_size(form, field):
        if field.data:
            field.data.seek(0, os.SEEK_END) # Seek to end of file
            size = field.data.tell()
            if size > max_size:
                raise ValidationError(message or 'File size must be less than %d bytes' % max_size)
            field.data.seek(0) # Seek back to beginning of file
    return _img_size

class TicketForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[DataRequired()])
    image = FileField('Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'webp', 'gif'], 'Only jpg, png, webp, jpeg and gif files allowed'), img_size(1*1024*1024, message='Image size must be less than 1MB')])
    submit = SubmitField('Submit')

class UpdateTicketForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[DataRequired()])
    status = SelectField('Status', choices=[('open', 'Open'), ('in_progress', 'In Progress'), ('resolved', 'Resolved')], validators=[DataRequired()])
    image = FileField('Update Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'webp', 'gif'], 'Only jpg, png, webp, jpeg and gif files allowed'), img_size(1*1024*1024, message='Image size must be less than 1MB')])
    submit = SubmitField('Update')

class UpdateTicketFormUser(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[DataRequired()])
    status = HiddenField('Status')
    image = FileField('Update Image', validators=[FileAllowed(['jpg', 'png', 'jpeg', 'webp', 'gif'], 'Only jpg, png, webp, jpeg and gif files allowed'), img_size(1*1024*1024, message='Image size must be less than 1MB')])
    submit = SubmitField('Update')


class AnswerTicketForm(FlaskForm):
    answer = TextAreaField('Answer', validators=[DataRequired()])
    submit = SubmitField('Send')
