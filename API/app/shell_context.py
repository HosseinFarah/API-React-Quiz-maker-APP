
from app.models import QuestionType

def insert_question_types():
    QuestionType.insert_question_types()
    print("Question types inserted.")