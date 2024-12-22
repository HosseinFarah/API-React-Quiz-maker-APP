from . import db, get_locale,login
import sqlalchemy as sa
import sqlalchemy.orm as so
from pytz import timezone
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

