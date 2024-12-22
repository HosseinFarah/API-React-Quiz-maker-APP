import random
from sqlalchemy.exc import IntegrityError
from faker import Faker
from . import db
from .models import User

def users(count=100):
    fake = Faker(['fi_FI'])
    fake.unique.clear()
    i = 0
    while i < count:
        u = User(
            email=fake.unique.email(),
            firstname=fake.first_name(),
            lastname=fake.last_name(),
            password='password',
            phone=fake.phone_number(),
            address=fake.street_address(),
            zipcode='12345',
            is_confirmed=random.choice([True, False]),
            image='default.jpg',
            created_at=fake.date_time_this_decade(),
            updated_at=fake.date_time_this_decade()
        )
        db.session.add(u)
        try:
            db.session.commit()
            i += 1
        except IntegrityError:
            db.session.rollback()