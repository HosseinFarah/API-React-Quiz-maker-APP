from . import quiz
from ..models import Quizzes, Questions, Options, Answers, QuestionType, User, db
from flask import request, jsonify, render_template, redirect, url_for, current_app, flash
from flask_login import login_required, current_user
from ..decorators import admin_required
from .forms import QuizForm, QuestionForm, OptionForm
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
        quiz = Quizzes(title=form.title.data, description=form.description.data, status=form.status.data, capacity=form.capacity.data, start_date=form.start_date.data, time_limit=form.time_limit.data, image=filename)
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

@quiz.route('/quiz/<int:quiz_id>/question/create', methods=['GET', 'POST'])
@login_required
@admin_required
def create_question(quiz_id):
    form = QuestionForm()
    form.quiz_id.choices = [(q.id, q.title) for q in Quizzes.query.all()]
    form.question_type_id.choices = [(qt.id, qt.type_name) for qt in QuestionType.query.all()]  # Change here
    form.quiz_id.data = quiz_id  # Set the quiz_id in the form
    
    if form.validate_on_submit():
        image = request.files.get('image')
        filename = None
        if image:
            filename = secure_filename(image.filename)
            upload_folder = current_app.config['QUIZ_UPLOAD_FOLDER']+f'/quiz_{quiz_id}/questions'
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            image.save(os.path.join(upload_folder, filename))
        
        # Set the next available order number for questions
        max_order_number = db.session.query(db.func.max(Questions.order_number)).filter_by(quiz_id=quiz_id).scalar()
        if max_order_number is None:
            max_order_number = 0
        else:
            max_order_number += 1
        
        question = Questions(question=form.question.data, image=filename, order_number=max_order_number, question_type_id=form.question_type_id.data, quiz_id=quiz_id)  # Use quiz_id here
        db.session.add(question)
        db.session.commit()
        
        # Set the next available order number for options
        correct_option_index = int(request.form.get('correct_option'))
        for index, option_form in enumerate(form.options):
            max_option_order_number = db.session.query(db.func.max(Options.order_number)).filter_by(question_id=question.id).scalar()
            if max_option_order_number is None:
                max_option_order_number = 0
            else:
                max_option_order_number += 1
            option = Options(option=option_form.data['option_text'], question_id=question.id, order_number=max_option_order_number)
            db.session.add(option)
            db.session.commit()
            if index == correct_option_index:
                answer = Answers(answer=option_form.data['option_text'], question_id=question.id, option_id=option.id)
                db.session.add(answer)
        db.session.commit()
        
        if form.shuffle_options.data:
            question.shuffle_options()
        
        flash('Question created successfully', 'success')
        return redirect(url_for('quiz.index'))
    else:
        # Flash form errors
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {getattr(form, field).label.text}: {error}", 'danger')
    return render_template('quiz/create_question.html', form=form, quiz_id=quiz_id)