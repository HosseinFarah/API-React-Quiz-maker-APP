from . import errors
from flask import render_template
from flask_wtf.csrf import CSRFError

@errors.app_errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

@errors.app_errorhandler(500)
def internal_error(error):
    return render_template('errors/500.html'), 500

@errors.app_errorhandler(403)
def forbidden_error(error):
    return render_template('errors/403.html'), 403

@errors.app_errorhandler(CSRFError)
def handle_csrf_error(e):
    return render_template('errors/csrf_error.html', reason=e.description), 400