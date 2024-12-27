from . import quiz
from ..models import Quizzes, db
from flask import request, jsonify, render_template, redirect, url_for, current_app, flash
from flask_login import login_required, current_user
from ..decorators import admin_required
from .forms import QuizForm
from werkzeug.utils import secure_filename
import os
from sqlalchemy.exc import IntegrityError

@quiz.route('/')
def index():
    quizzes = Quizzes.query.all()
    return render_template('index.html', quizzes=quizzes)

@quiz.route('/quiz/create', methods=['GET', 'POST'])
@login_required
@admin_required
def create_quiz():
    form = QuizForm()
    duplicate_title_error = False
    if form.validate_on_submit():
        image = request.files.get('image')
        filename = None
        if image:
            filename = secure_filename(image.filename)
            upload_folder = current_app.config['QUIZ_UPLOAD_FOLDER']
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            image.save(os.path.join(upload_folder, filename))
        quiz = Quizzes(title=form.title.data, description=form.description.data, status=form.status.data, attempt=form.attempt.data, start_date=form.start_date.data, time_limit=form.time_limit.data, image=filename)
        try:
            db.session.add(quiz)
            db.session.commit()
            if form.shuffle_questions.data:
                quiz.shuffle_questions()
            flash('Quiz created successfully', 'success')
            return redirect(url_for('quiz.index'))
        except IntegrityError:
            db.session.rollback()
            duplicate_title_error = True
            flash('This title already exists. Please choose a different title.', 'danger')
    else:
        # Flash form errors
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {getattr(form, field).label.text}: {error}", 'danger')
    return render_template('quiz/create_quiz.html', form=form, duplicate_title_error=duplicate_title_error)

