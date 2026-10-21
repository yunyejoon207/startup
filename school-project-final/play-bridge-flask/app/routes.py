from flask import Blueprint, request, jsonify
from app.services import calculate_and_save_record, get_top_rankings
from app.events import broadcast_rankings

main_bp = Blueprint('main', __name__)

@main_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "PLAY BRIDGE Flask 서버가 성공적으로 작동 중입니다!"
    })

@main_bp.route('/api/record', methods=['POST'])
def save_record():
    """
    프론트엔드에서 게임 종료 시 보낸 기록을 받아 DB에 저장하고 
    실시간 소켓으로 랭킹을 갱신합니다.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "잘못된 요청 데이터입니다."}), 400

        # 필수 입력값 검증
        if not data.get('studentId') or not data.get('username'):
            return jsonify({"error": "학번과 이름은 필수 항목입니다."}), 400

        # 1. 퀴즈 보너스 계산 및 DB 저장
        saved_record = calculate_and_save_record(data)

        # 2. 실시간 소켓으로 모든 접속자에게 최신 랭킹 전송 (방송)
        broadcast_rankings()

        return jsonify({
            "status": "success",
            "message": "기록이 성공적으로 저장되었습니다.",
            "data": saved_record.to_dict()
        }), 201

    except Exception as e:
        print(f"❌ 기록 저장 중 에러 발생: {e}")
        return jsonify({"error": "서버 내부 오류가 발생했습니다."}), 500

@main_bp.route('/api/ranking', methods=['GET'])
def get_rankings_api():
    """REST API 형태(GET)로도 랭킹을 불러올 수 있도록 제공"""
    rankings = get_top_rankings()
    
    formatted_rankings = []
    
    for r in rankings:
        # DB에서 확인된 필드명: studentId, username, finalTime
        formatted_rankings.append({
            "studentId": str(r.get('studentId', '')),
            "name": str(r.get('username', '')),
            "score": r.get('finalTime', 0)  # finalTime 필드명 적용
        })
        
    return jsonify(formatted_rankings)
