from flask_socketio import emit
from app import socketio
from app.services import get_top_rankings

@socketio.on('connect')
def handle_connect():
    print('🟢 클라이언트(프론트엔드/전광판)가 실시간 소켓에 접속했습니다.')
    # 새로 접속한 화면에 즉시 현재 최신 랭킹 전송
    emit('ranking_update', get_top_rankings())

@socketio.on('disconnect')
def handle_disconnect():
    print('🔴 클라이언트 소켓 연결이 해제되었습니다.')

@socketio.on('request_rankings')
def handle_request_rankings():
    """클라이언트가 수동으로 랭킹을 다시 요청할 때 사용"""
    emit('ranking_update', get_top_rankings())

def broadcast_rankings():
    """
    게임 결과가 추가되었을 때 접속해 있는 모든 클라이언트(전광판)로 
    최신 랭킹 데이터를 실시간 전송하는 함수
    """
    socketio.emit('ranking_update', get_top_rankings())
