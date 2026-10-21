from app import create_app, socketio, db

app = create_app()

if __name__ == '__main__':
    # 앱 실행 시 DB 테이블 자동 생성
    with app.app_context():
        db.create_all()

    print("Flask 서버를 5000번 포트에서 시작합니다 ")
    # Flask 기본 app.run() 대신 socketio.run()을 사용해야 실시간 소켓 통신이 정상 작동합니다.
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
