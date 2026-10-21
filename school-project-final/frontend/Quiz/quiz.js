const QUESTIONS = {
    1: [
        { text : "괴산고등학교의 교목은?", answer: "소나무" },
        { text : "괴산고등학교의 교화는?", answer: "국화" },
        { text : "괴산고등학교의 개교기념일은?", answer: "9월1일" },
        { text : "괴산고등학교의 도서관 이름은?", answer: "여울서관" },
        { text : "괴산고등학교의 기숙사 이름은?", answer : "괴정학사"},
        { text : "괴산고등학교의 축제 이름은?" , answer : "와유페스티벌"},
        { text : "괴산고등학교 체육관 이름은?" , answer : "괴정관"},
        { text : "괴산고등학교 교장선생님 성함은?" , answer : "권은심"},
        { text : "괴산고등학교의 인재상은?", answer : "괴정인"},
        { text : "괴산고등학교 댄스부 이름은?" , answer : "미단옥"},
        { text : "괴산고등학교의 비전은?" , answer : "꿈꾸며 배우고 성장하는 교육공동체"},
        { text : "괴산고등학교가 개교한지 몇 주년일까요?" , answer : "75주년"}
    ],
    2: [
        { text: "괴산의 대표적인 특산물 홍보를 위한 축제 이름은?", answer: "고추축제" },
        { text: "산이 많아 더 갈 수 없다는 뜻에서 유래한 괴산명소는? ", answer: "산막이옛길" },
        { text: "괴산 특산물이자 통이 가늘고 길며 당도가 높아 전국적으로 유명한 구황작물은?", answer: "대학찰옥수수" },
        { text: "괴산 청천면에 위치하며 임진왜란 명의 은혜를 기르기 위해 송시열이 세운 제단은?", answer: "만동묘" },
        { text: "괴산군 연풍면과 경상북도를 잇는 길로 과거시험을 보러 넘던 유명한 고계 이름은?", answer: "이화령" },
        { text: "문광면에 위치하며 호숫가에 비친 은행나무로 인기가 높은 관광지는?", answer: "문광저수지" },
        { text: "감물면에서 개최되며 감물 특산물 홍보및 수확 체험을 제공하는 지역 축제 이름은?", answer: "감자축제" },
        { text: "2015년 괴산군에서 개최 되었으며 친환경 유기농업의 가치를 알린 국제 행사의 이름은?", answer: "세계 유기농 산업 엑스포" },
        { text: "칠성면에 위치하며 우리나라 자본과 기술로 건설된 대한민국 최초 수력 발전소 이름은?", answer: "괴산 수력발전소" }
    ],
};

const DIFFICULTY_LABEL = { 1: "학교퀴즈", 2: "괴산퀴즈" };

const params = new URLSearchParams(window.location.search);
const round = Number(params.get('round')) || 1;

const pool = QUESTIONS[round];
const currentQuestion = pool[Math.floor(Math.random() * pool.length)];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('quizQuestion').innerText = currentQuestion.text;
    document.getElementById('quizBadge').innerText = `QUIZ ${round} · ${DIFFICULTY_LABEL[round]}`;
    document.getElementById('quizAnswer').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAnswer();
    });
});

function submitAnswer() {
    const userAnswer = document.getElementById('quizAnswer').value.trim();
    
    // [추가] 아무것도 입력하지 않고 제출하는 것 방지
    if (!userAnswer) {
        alert('정답을 입력해 주세요!');
        return;
    }

    // [유지] 띄어쓰기를 모두 제거한 뒤 비교 (예: "고 추 축 제" -> "고추축제")
    const normalize = str => str.replace(/\s+/g, '');
    const isCorrect = normalize(userAnswer) === normalize(currentQuestion.answer);

    const studentId = localStorage.getItem('studentId') || 'unknown';
    localStorage.setItem(`quizResult_${studentId}_round${round}`, isCorrect ? 'correct' : 'incorrect');

    const feedback = document.getElementById('quizFeedback');
    if (isCorrect) {
        feedback.innerText = '정답입니다! 다음 사격 스테이션으로 이동해주세요.';
        feedback.style.color = '#2980b9';
    } else {
        feedback.innerText = `아쉬워요! 정답은 "${currentQuestion.answer}" 였어요. 다음 사격 스테이션으로 이동해주세요.`;
        feedback.style.color = '#ff5252';
    }

    document.getElementById('quizAnswer').disabled = true;
    document.querySelector('#quiz-screen button').disabled = true;
}

// ★ [수정] file:/// 환경에서도 100% 작동하는 주기적 확인(Polling) 방식 리셋 로직
let lastGameSignal = localStorage.getItem('gameStartSignal');

setInterval(() => {
    const currentSignal = localStorage.getItem('gameStartSignal');
    // 메인 화면에서 누군가 [시작하기]를 눌러 신호값이 변경되었다면
    if (currentSignal && currentSignal !== lastGameSignal) {
        location.reload(); // 즉시 퀴즈 화면 새로고침하여 새 문제와 열린 입력창 띄우기
    }
}, 1000); // 1초마다 감시
