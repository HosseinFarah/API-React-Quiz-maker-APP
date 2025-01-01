from . import main
from flask import render_template, redirect, url_for, request, flash, current_app, session, g
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User,  User, Ticket, Quizzes  # Import the Quizzes model
from app import db
from app.forms import SearchForm
from sqlalchemy import or_
from flask_babel import get_locale as babel_get_locale



# Search form in the base.html
@main.app_context_processor
def inject_search_form():
    return dict(form=SearchForm())

# Open tickets count in the base.html
@main.app_context_processor
def inject_open_tickets_count():
    if current_user.is_administrator():
        open_tickets_count = Ticket.query.filter_by(status='open').count()
    elif current_user.is_authenticated:
        open_tickets_count = Ticket.query.filter_by(status='open', user_id=current_user.id).count()
    else:
        open_tickets_count = None

    return dict(open_tickets_count=open_tickets_count)

# for translation
@main.before_app_request
def before_request():
    g.locale = babel_get_locale()
    # current_app.logger.info(f"Current locale: {g.locale}")
    if 'lang' in session:
        g.locale = session['lang']
    else:
        g.locale = request.accept_languages.best_match(current_app.config['BABEL_SUPPORTED_LOCALES'])
    # current_app.logger.info(f"Locale set to: {g.locale}")
    
    
    
# for translation
@main.route('/set_language', methods=['POST'])
def set_language():
    lang_code = request.form.get('lang_code')
    if lang_code:
        session['lang'] = lang_code
    return redirect(request.referrer or url_for('main.index'))



@main.route("/")
def index():
    # quizzes = Quizzes.query.all()  # Fetch all quizzes
    return render_template("index.html")

@main.route('/search', methods=['GET', 'POST'])
def search():
    form = SearchForm()
    if form.validate_on_submit():
        search = form.search.data.strip()
        users = db.session.query(User).filter(
            or_(
                User.firstname.ilike(f'%{search}%'),
                User.lastname.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%'),
                # fullname
                User.firstname.concat(' ').concat(User.lastname).ilike(f'%{search}%'
            )
        ).all()
        )
    else:
        users = []      
    return render_template('search.html', users=users, form=form)