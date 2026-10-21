from app import db
from app.models import Record

def calculate_and_save_record(data):
    """
    프론트엔드에서 보낸 데이터를 수신하여 퀴즈 보너스를 계산하고 DB에 저장하는 함수
    
    [시간 차감 규칙]
    - 난이도 1 (쉬움): 정답 시 -1초
    - 난이도 2 (어려움): 정답 시 -2초
    """
    student_id = data.get('studentId')
    username = data.get('username')
    raw_time = float(data.get('rawTime', 0.0))
    quiz1 = data.get('quiz1', 'none') # 'correct', 'incorrect', 'none'
    quiz2 = data.get('quiz2', 'none') # 'correct', 'incorrect', 'none'

    # 1. 퀴즈 난이도별 보너스 시간 계산
    bonus_time = 0.0
    if quiz1 == 'correct':
        bonus_time += 1.0  # 쉬움 퀴즈 (1난이도) 성공 시 -1초
    if quiz2 == 'correct':
        bonus_time += 2.0  # 어려움 퀴즈 (2난이도) 성공 시 -2초

    # 2. 최종 시간 계산 (시간이 음수가 되지 않도록 최소 0초)
    final_time = max(0.0, raw_time - bonus_time)

    # 3. DB 모델 생성 및 저장
    new_record = Record(
        student_id=student_id,
        username=username,
        raw_time=raw_time,
        quiz1=quiz1,
        quiz2=quiz2,
        bonus_time=bonus_time,
        final_time=final_time
    )
    db.session.add(new_record)
    db.session.commit()

    return new_record

def get_top_rankings(limit=10):
    """
    최종 기록(final_time)이 가장 짧은 순(오름차순)으로 상위 N명 가져오기
    """
    records = Record.query.order_by(Record.final_time.asc()).limit(limit).all()
    return [r.to_dict() for r in records]
