from . import db, get_locale,login
import sqlalchemy as sa
import sqlalchemy.orm as so
from pytz import timezone
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from flask_login import UserMixin, AnonymousUserMixin #for role
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask import current_app
from flask_babel import lazy_gettext as _
from sqlalchemy.sql import func

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    firstname = db.Column(db.String(100), nullable=False,index=True)
    lastname = db.Column(db.String(100), nullable=False,index=True)
    email = db.Column(db.String(100), unique=True, nullable=False,index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone=db.Column(db.String(20), nullable=False, unique=True,index=True)
    address=db.Column(db.String(255), nullable=False)
    zipcode=db.Column(db.String(15), nullable=False)
    city=db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(255), nullable=False, default='default.jpg')
    created_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    is_active = db.Column(db.Boolean, default=True,server_default=sa.sql.expression.true())
    is_confirmed = db.Column(db.Boolean, default=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), default=1)
    last_login = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    role = db.relationship('Role', backref='users')
    results = relationship("QuizResults", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return '<User %r>' % self.email
    
    
    def ping(self):
        self.last_login = datetime.now(timezone('Europe/Helsinki'))
        db.session.add(self)
        db.session.commit()
    
    #for role 
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.role is None:
            if self.email == current_app.config['ADMIN_EMAIL']:
                self.role = Role.query.filter_by(name = 'Administrator').first()
            if self.role is None:
                self.role = Role.query.filter_by(default=True).first()
                
                
    #for role            
    def can(self, perm):
        return self.role is not None and self.role.has_permission(perm)
    #for role
    def is_administrator(self):
        return self.can(Permission.ADMIN)
    #for role
    class AnonymousUser(AnonymousUserMixin):
        def can(self, permissions):
            return False
            
        def is_administrator(self):
            return False
    
# login.anonymous_user = AnonymousUser    
    login.anonymous_user = AnonymousUser       

    @login.user_loader
    def load_user(id):
        return User.query.get(int(id))
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_confirmation_token(self):
        s = Serializer(current_app.config['SECRET_KEY'])
        return s.dumps({'confirm': self.id})
    


    def confirm(self, token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token,max_age=3600)
        except:
            return False
        if data.get('confirm') != self.id:
            return False
        self.is_confirmed = True
        db.session.add(self)
        db.session.commit()
        return True         
    
    def generate_reset_token(self):
        s = Serializer(current_app.config['SECRET_KEY'])
        return s.dumps({'reset': self.id})
    

    def reset_password(token, new_password):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token,max_age=3600)
        except:
            return False
        user = User.query.get(data.get('reset'))
        if user is None:
            return False
        user.password_hash = generate_password_hash(new_password)
        db.session.add(user)
        db.session.commit()
        return True
    
    def generate_email_change_token(self, new_email):
        s = Serializer(current_app.config['SECRET_KEY'])
        return s.dumps({'change_email': self.id, 'new_email': new_email})
    
    def change_email(self,token):
        s=Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token,max_age=3600)
        except:
            return False
        if data.get('change_email') != self.id:
            return False
        new_email = data.get('new_email')
        if new_email is None or self.query.filter_by(email=new_email).first() is not None:
            return False
        self.email = new_email
        db.session.add(self)
        db.session.commit()
        return True
    
    def to_dict(self):
        return {
            'id': self.id,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'image': self.image,
            'city': self.city,
            'zipcode': self.zipcode,
            'is_active': self.is_active,
            'role': self.role.name if self.role else None,  # Convert role to a serializable format
            # Add other fields as necessary
        }

 #for role    
class Permission:
    FOLLOW = 1
    COMMENT = 2
    WRITE = 4
    MODERATE = 8
    ADMIN = 16
    
    
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    default = db.Column(db.Boolean, default=False, index=True)
    permissions = db.Column(db.Integer, default=0, index=True)    
    
    def __repr__(self) -> str:
        return self.name
    
    #for role
    def has_permission(self, perm):
        return self.permissions & perm == perm
    
    #for role
    def add_permission(self, perm):
        if not self.has_permission(perm):
            self.permissions += perm
    #for role
    def remove_permission(self, perm):
        if self.has_permission(perm):
            self.permissions -= perm
     #for role       
    def reset_permissions(self):
        self.permissions = 0
    
    #for role
    @staticmethod
    def insert_roles():
        roles = {
            'User': [Permission.FOLLOW, Permission.COMMENT, Permission.WRITE],
            'Moderator': [Permission.FOLLOW, Permission.COMMENT, Permission.WRITE, Permission.MODERATE],
            'Administrator': [Permission.FOLLOW, Permission.COMMENT, Permission.WRITE, Permission.MODERATE, Permission.ADMIN]
        }
        default_role = 'User'
        for r in roles:
            role = Role.query.filter_by(name=r).first()
            if role is None:
                role = Role(name=r)
            role.reset_permissions()
            for perm in roles[r]:
                role.add_permission(perm)
            role.default = (role.name == default_role)
            db.session.add(role)
        db.session.commit()
#for role  

class Ticket(db.Model):
    __tablename__ = 'tickets'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='open', index=True)
    image = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    user = db.relationship('User', backref='tickets')
    messages = db.relationship('TicketMessage', backref='ticket', cascade='all, delete-orphan')

    def __repr__(self) -> str:
        return '<Ticket %r>' % self.title

class TicketMessage(db.Model):
    __tablename__ = 'ticket_messages'
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    user = db.relationship('User', backref='messages')

    def __repr__(self) -> str:
        return '<TicketMessage %r>' % self.message


class Quizzes(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, index=True, unique=True)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='available', index=True)
    image = db.Column(db.String(255), nullable=True)
    attempt = db.Column(db.Integer, nullable=False, default=0)
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone('Europe/Helsinki')))
    end_date = db.Column(db.DateTime, nullable=True)
    time_limit = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    shuffle_questions_enabled = db.Column(db.Boolean, default=False)  # Add this field
    results = relationship("QuizResults", back_populates="quiz", cascade="all, delete-orphan")
    
    def shuffle_questions(self):
        from random import shuffle
        questions = self.questions
        shuffle(questions)
        for index, question in enumerate(questions):
            question.order_number = index
        db.session.commit()
    
    def calculate_overall_score(self):
        overall_score = 0
        for question in self.questions:
            for answer in question.answers:
                if answer.option.score > 0:
                    overall_score += answer.option.score
        return overall_score
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'attempt': self.attempt,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'time_limit': self.time_limit,
            'image': self.image,
            'shuffle_questions': self.shuffle_questions_enabled,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    def __repr__(self) -> str:
        return '<Quizzes %r>' % self.title


class Questions(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(255), nullable=True)
    format = db.Column(db.String(50), nullable=False)  # "multiple_choice" or "true_false"
    score = db.Column(db.Float, nullable=False, default=1.0)  # Score for the question
    shuffle_enabled = db.Column(db.Boolean, default=False)  # Shuffle answers for this question
    options_format = db.Column(db.String(10), nullable=False, default="A,B,C,D")  # e.g., A,B,C,D or 1,2,3,4
    created_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    
    # Relationships
    quiz = relationship("Quizzes", back_populates="questions")
    answers = relationship("Answers", back_populates="question", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'text': self.text,
            'image': self.image,
            'format': self.format,
            'score': self.score,
            'shuffle_enabled': self.shuffle_enabled,
            'options_format': self.options_format,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }

class Answers(db.Model):
    __tablename__ = 'answers'
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(255), nullable=True)  # Optional image for the answer
    is_correct = db.Column(db.Boolean, nullable=False, default=False)  # True if this answer is correct
    order_number = db.Column(db.Integer, nullable=True)  # For ordering answers
    
    # Relationships
    question = relationship("Questions", back_populates="answers")

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'text': self.text,
            'image': self.image,
            'is_correct': self.is_correct,
            'order_number': self.order_number,
        }

# Adding back_populates to Quizzes
Quizzes.questions = relationship("Questions", back_populates="quiz", cascade="all, delete-orphan")


class QuizResults(db.Model):
    __tablename__ = 'quiz_results'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    overall_score = db.Column(db.Float, nullable=False, default=0.0)  # Score for the quiz
    completed = db.Column(db.Boolean, nullable=False, default=False)  # True if the quiz is completed
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone('Europe/Helsinki')))
    end_time = db.Column(db.DateTime, nullable=True)  # End time of the quiz
    duration = db.Column(db.Integer, nullable=True)  # Duration of the quiz in seconds
    created_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone('Europe/Helsinki')))
    
    # Relationships
    quiz = relationship("Quizzes", back_populates="results")
    user = relationship("User", back_populates="results")
    answers = relationship("QuizAnswers", back_populates="result", cascade="all, delete-orphan")
    
    def calculate_overall_score(self):
        score = 0
        for answer in self.answers:
            if answer.is_correct:
                score += answer.question.score
        return score
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'user_id': self.user_id,
            'overall_score': self.overall_score,
            'completed': self.completed,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
        
    @staticmethod
    def get_attempts(user_id, quiz_id):
        try:
            attempts = QuizResults.query.filter_by(user_id=user_id, quiz_id=quiz_id).count()
            return attempts
        except Exception as e:
            current_app.logger.error(f'Error in get_attempts: {str(e)}')
            raise

    @staticmethod
    def save_result(user_id, quiz_id, overall_score, completed, start_time, end_time, duration):
        result = QuizResults(
            user_id=user_id,
            quiz_id=quiz_id,
            overall_score=overall_score,
            completed=completed,
            start_time=start_time,
            end_time=end_time,
            duration=duration
        )
        db.session.add(result)
        db.session.commit()
        return result
    
    @staticmethod
    def get_results(user_id, quiz_id):
        try:
            results = QuizResults.query.filter_by(user_id=user_id, quiz_id=quiz_id).all()
            return results
        except Exception as e:
            current_app.logger.error(f'Error in get_results: {str(e)}')
            raise
        
        

    @staticmethod
    def get_max_score(user_id, quiz_id):
        try:
            max_score = db.session.query(db.func.max(QuizResults.overall_score)).filter_by(user_id=user_id, quiz_id=quiz_id).scalar()
            return max_score if max_score is not None else 0.0
        except Exception as e:
            current_app.logger.error(f'Error in get_max_score: {str(e)}')
            raise

    @staticmethod
    def get_all_results(quiz_id):
        try:
            return QuizResults.query.filter_by(quiz_id=quiz_id).all()
        except SQLAlchemyError as e:
            current_app.logger.error(f'Database error fetching all results for quiz_id {quiz_id}: {str(e)}')
            raise


class QuizAnswers(db.Model):
    __tablename__ = 'quiz_answers'
    id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, ForeignKey('quiz_results.id', ondelete='CASCADE'), nullable=False)
    question_id = db.Column(db.Integer, ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    answer_id = db.Column(db.Integer, ForeignKey('answers.id', ondelete='CASCADE'), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)

    # Relationships
    result = relationship("QuizResults", back_populates="answers")
    question = relationship("Questions")
    answer = relationship("Answers")

    def to_dict(self):
        return {
            'id': self.id,
            'result_id': self.result_id,
            'question_id': self.question_id,
            'answer_id': self.answer_id,
            'is_correct': self.is_correct,
        }