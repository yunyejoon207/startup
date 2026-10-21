from app import db
from datetime import datetime

class Record(db.Model):
    __tablename__ = 'records'

    id = db.Column(db.Integer, primary_key=True)                 # 고유 ID (자동 증가)
    student_id = db.Column(db.String(10), nullable=False)       # 학번 (예: '1234')
    username = db.Column(db.String(20), nullable=False)         # 이름 (예: '홍길동')
    raw_time = db.Column(db.Float, nullable=False)             # 순수 측정한 스톱워치 시간 (초)
    quiz1 = db.Column(db.String(10), default='none')           # 쉬움 퀴즈 결과 ('correct', 'incorrect', 'none')
    quiz2 = db.Column(db.String(10), default='none')           # 어려움 퀴즈 결과 ('correct', 'incorrect', 'none')
    bonus_time = db.Column(db.Float, default=0.0)              # 차감된 보너스 시간 (초)
    final_time = db.Column(db.Float, nullable=False)           # 최종 기록 = max(0, raw_time - bonus_time)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # 데이터 저장 일시

    def to_dict(self):
        """프론트엔드/소켓 통신 시 JSON으로 변환하기 위한 함수"""
        return {
            "id": self.id,
            "studentId": self.student_id,
            "username": self.username,
            "rawTime": round(self.raw_time, 2),
            "quiz1": self.quiz1,
            "quiz2": self.quiz2,
            "bonusTime": self.bonus_time,
            "finalTime": round(self.final_time, 2),
            "createdAt": self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
