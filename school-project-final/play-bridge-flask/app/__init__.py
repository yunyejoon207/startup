from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Cross-Origin (프론트엔드 통신) 허용 설정
    CORS(app)
    
    # DB 및 SocketIO 초기화
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # API 라우트 등록
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    # SocketIO 이벤트 연결
    from app import events

    return app
