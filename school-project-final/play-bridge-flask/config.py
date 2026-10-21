import os

class Config:
    # 암호화 키 (원하는 문자열로 변경 가능)
    SECRET_KEY = os.getenv('SECRET_KEY', 'play-bridge-secret-key-1234')
    
   
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///playbridge.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
