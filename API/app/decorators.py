from functools import wraps
from flask import request, abort, current_app
from flask_login import current_user
from .models import Permission
from datetime import datetime


def debugger(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if current_app.config['DEBUG']:
            now = datetime.now()
            msg = now.strftime("%Y-%m-%d %H:%M:%S") + ' '
            msg += f.__name__ + ' '
            if args and args != []:
                msg += ''.join([str(arg) for arg in args])
            if kwargs:
                msg += '' + str(kwargs)[1:-1].replace(': ', ':')
            result = f(*args, **kwargs)
            msg = msg.rstrip() + ", result: " + str(result)
            with open("debug.log", "a", encoding="utf-8") as file:
                file.write(msg + "\n")
        else:
            result = f(*args, **kwargs)
        return result
    return wrapper
            

def permission_required(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.can(permission):
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    return permission_required(Permission.ADMIN)(f)