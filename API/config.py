import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard to guess string'
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SHOP_ADMIN = os.environ.get('SHOP_ADMIN')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or os.path.join(basedir, 'site.db')
    UPLOAD_FOLDER = os.path.join(basedir, 'app/static/uploads/users')
    MAX_CONTRENT_LENGTH = 2 * 1024 * 1024  # 2MB
    MAIL_SENDER= os.environ.get('MAIL_SENDER')
    MAIL_SERVER = 'sandbox.smtp.mailtrap.io'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    FLASKY_MAIL_SUBJECT_PREFIX= '[Helmi shop]'
    FLASKY_MAIL_SENDER = 'Helmi shop Admin <' + os.environ.get('MAIL_SENDER') + '>'
    #for role 
    ADMIN_EMAIL= os.environ.get('ADMIN_EMAIL')
    JSON_FOLDER= os.path.join(basedir, 'app/static/js')
    TICKET_IMAGE_FOLDER = os.path.join(basedir, 'app/static/uploads/tickets')
    # for translation
    BABEL_DEFAULT_LOCALE = 'fi'
    # for translation
    BABEL_SUPPORTED_LOCALES = ['fi', 'en']
    # for translation
    BABEL_TRANSLATION_DIRECTORIES = os.path.join(basedir, 'translations') or '../translations'

    @staticmethod
    def init_app(app):
        pass
    
class DevelopmentConfig(Config):
    DEBUG = True
    MAIL_SERVER = 'smtp.googlemail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or os.path.join(basedir, 'siteDev.db')
    
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or os.path.join(basedir, 'siteTest.db')
    
class XAMPPConfig(Config):
    DEBUG = True
    DB_SERVER = os.environ.get('DB_SERVER') or 'localhost'
    DB_USER= os.environ.get('DB_USER') or 'root'
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or ''
    DB_NAME = os.environ.get('DB_NAME') or 'kosmetiikka_db'
    DB_PORT = os.environ.get('DB_PORT') or '3306'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://' + DB_USER + ':' + DB_PASSWORD + '@' + DB_SERVER + ':' + DB_PORT + '/' + DB_NAME
    DEFAULT_ORIGIN = 'http://localhost:5173'
    
class ProductionConfig(XAMPPConfig):
    DEBUG = False
    
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'xampp': XAMPPConfig,
    'default': XAMPPConfig
}
