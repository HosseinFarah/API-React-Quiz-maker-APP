from flask import Blueprint

auth = Blueprint('auth', __name__) # create a Blueprint object that represents the authentication blueprint

from . import views # import the views module