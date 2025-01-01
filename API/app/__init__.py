from flask import Flask, session, request, current_app, redirect, url_for, g, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_bootstrap import Bootstrap
from flask_wtf.csrf import CSRFProtect, generate_csrf
from config import config
from flask_babel import Babel, lazy_gettext as _l
import logging
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'auth.login'
mail = Mail()
bootstrap = Bootstrap()
csrf = CSRFProtect()
babel = Babel()
cors = CORS()

# for translation
def get_locale():
    # Check if a language is stored in the session
    if 'lang' in session:
        return session['lang']
    # Use the `Accept-Language` header as a fallback
    locale = request.accept_languages.best_match(current_app.config.get('BABEL_SUPPORTED_LOCALES'))
    return locale

def create_app(config_name='default'):
    app = Flask(__name__, template_folder='templates', static_folder='static')
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    mail.init_app(app)
    bootstrap.init_app(app)
    csrf.init_app(app)
    # for API
    cors.init_app(app, resources={r"/api/*": {"origins": [config[config_name].DEFAULT_ORIGIN]}}, supports_credentials=True, expose_headers=['Content-Type', 'Authorization', 'X-CSRFToken'], allow_headers=['Content-Type', 'Authorization', 'X-CSRFToken', 'credentials'], methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
    
    # for translation
    babel.init_app(app, locale_selector=get_locale)
    app.jinja_env.globals['get_locale'] = get_locale
    
    # logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', handlers=[logging.FileHandler('app.log'), logging.StreamHandler()])    

    # for API
    @app.after_request
    def after_request(response):
        csrf_token = generate_csrf()
        current_app.logger.info(f'Generated CSRF Token: {csrf_token}')  # Log the generated CSRF token
        response.set_cookie('csrf_token', csrf_token, httponly=True)
        session['_csrf_token'] = csrf_token  # Ensure the CSRF token is set in the session
        if request.endpoint and request.endpoint.startswith('api.'):
            response.set_cookie('csrf_token', csrf_token, httponly=True)
        response.headers['Access-Control-Allow-Origin'] = config[config_name].DEFAULT_ORIGIN
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-CSRFToken,credentials'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
        return response
    
    # for API
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        csrf_token = generate_csrf()
        current_app.logger.info(f'Generated CSRF Token: {csrf_token}')
        response = jsonify({'csrf_token': csrf_token})
        response.set_cookie('csrf_token', csrf_token, httponly=True)
        session['_csrf_token'] = csrf_token  # Ensure the CSRF token is set in the session
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Origin'] = config[config_name].DEFAULT_ORIGIN
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-CSRFToken,credentials'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
        return response

    # Register blueprints
    from app.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    
    from app.main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    from app.errors import errors as errors_blueprint
    app.register_blueprint(errors_blueprint, url_prefix='/errors')
    
    
    from app.tickets import tickets as tickets_blueprint
    app.register_blueprint(tickets_blueprint, url_prefix='/tickets')
    
    
    from app.Quiz import quiz as quiz_blueprint
    app.register_blueprint(quiz_blueprint, url_prefix='/quiz')
    
    from app.API import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')  # Register the blueprint with a URL prefix
    
    @app.shell_context_processor
    def make_shell_context():
        from .models import insert_question_types  # Import the function here to avoid circular imports
        return dict(db=db, insert_question_types=insert_question_types)  # Add the function to the shell context

    return app