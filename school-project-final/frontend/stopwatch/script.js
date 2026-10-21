





// 1. 페이지가 로드되면 첫 화면(#start-screen)을 표시
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-screen').style.display = 'block';
});

// 2. 시작 화면 -> 정보 입력 화면 이동
function goToInfoScreen() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('info-screen').style.display = 'block';
}

let startTime;
let timerInterval;
const TICK_COUNT = 60;    
const MAX_SECONDS = 180;   
const svgNS = "http://www.w3.org/2000/svg";

// 3. 게임 시작
function startGame() {
    const studentId = document.getElementById('studentId').value.trim();
    const user = document.getElementById('user').value.trim();
    const idPattern = /^\d{4}$/;
    
    if (!idPattern.test(studentId)) {
        alert('학번이 정확한지 확인해주세요.');
        return;
    }
    if (!user) {
        alert('이름을 입력해주세요.');
        return;
    }

    // ★ [추가] 해당 학번의 이전 퀴즈 기록 초기화
    localStorage.removeItem(`quizResult_${studentId}_round1`);
    localStorage.removeItem(`quizResult_${studentId}_round2`);

    // ★ [추가] 다른 탭에 열려있는 퀴즈 화면들을 자동으로 새로고침(리셋)하기 위한 신호
    localStorage.setItem('gameStartSignal', Date.now());

    document.getElementById('info-screen').style.display = 'none';
    document.getElementById('stopwatch-screen').style.display = 'block';
    localStorage.setItem('studentId', studentId);
    document.getElementById('displayUser').innerText = `${studentId} ${user}`;

    createTicks();  
    startTimer();    
}

// 4. 스톱워치 눈금 생성
function createTicks() {
    const svg = document.getElementById('tickSvg');
    svg.innerHTML = '';
    const cx = 100, cy = 100;
    const outerR = 95, innerR = 80;
    for (let i = 0; i < TICK_COUNT; i++) {
        const angle = (i * 360 / TICK_COUNT) * (Math.PI / 180) - Math.PI / 2;
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy + innerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle);
        const y2 = cy + outerR * Math.sin(angle);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'tick');
        line.setAttribute('id', `tick-${i}`);
        svg.appendChild(line);
    }
}

// 5. 타이머 시작 및 업데이트
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 10);
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;

    const minutes = String(Math.floor(elapsedTime / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((elapsedTime % 60000) / 1000)).padStart(2, '0');
    const milliseconds = String(Math.floor((elapsedTime % 1000) / 10)).padStart(2, '0');
    document.getElementById('timer').innerText = `${minutes}:${seconds}.${milliseconds}`;
    
    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const lapCount = Math.floor(elapsedSeconds / 60);
    const secondsInLap = elapsedSeconds % 60;
    for (let i = 0; i < TICK_COUNT; i++) {
        const tick = document.getElementById(`tick-${i}`);
        const passes = i < secondsInLap ? lapCount + 1 : lapCount;
        const lapLevel = Math.min(passes, 3);
        tick.setAttribute('class', 'tick' + (lapLevel > 0 ? ' lap-' + lapLevel : ''));
    }
    if (elapsedSeconds >= MAX_SECONDS) {
        gameOver();
    }
}

// 6. 게임 종료 처리
function stopGame() {
    clearInterval(timerInterval);

    const elapsedTime = (Date.now() - startTime) / 1000;
    const studentId = localStorage.getItem('studentId') || '';
    const username = document.getElementById('user') ? document.getElementById('user').value.trim() : '';
    const userInfo = document.getElementById('displayUser').innerText;

    const round1 = localStorage.getItem(`quizResult_${studentId}_round1`) || 'none';
    const round2 = localStorage.getItem(`quizResult_${studentId}_round2`) || 'none';

    let quizBonus = 0;
    if (round1 === 'correct') quizBonus += 1;
    if (round2 === 'correct') quizBonus += 2;

    const finalTime = Math.max(0, elapsedTime - quizBonus);

    document.getElementById('stopwatch-screen').style.display = 'none';
    document.getElementById('resultTitle').innerText = '게임 종료!';
    document.getElementById('resultUser').innerText = `참여자: ${userInfo}`;

    const finalMinutes = String(Math.floor(finalTime / 60)).padStart(2, '0');
    const finalSeconds = String(Math.floor(finalTime % 60)).padStart(2, '0');
    const finalMilliseconds = String(Math.floor((finalTime % 1) * 100)).padStart(2, '0');
    const finalRecord = `${finalMinutes}:${finalSeconds}.${finalMilliseconds}`;

    document.getElementById('resultRecord').innerText = `최종 기록: ${finalRecord}`;

    const round1Text = round1 === 'correct' ? '정답(-1초)' : round1 === 'incorrect' ? '오답' : '미응시';
    const round2Text = round2 === 'correct' ? '정답(-2초)' : round2 === 'incorrect' ? '오답' : '미응시';
    document.getElementById('quizResult').innerText =
        `학교퀴즈(쉬움): ${round1Text}\n괴산퀴즈(어려움): ${round2Text}\n퀴즈 차감시간: ${quizBonus}초`;

    document.getElementById('result-screen').style.display = 'block';

    sendRecordToBackend({
        studentId: studentId,
        username: username,
        rawTime: elapsedTime,
        quiz1: round1,
        quiz2: round2
    });
}

// 7. 타임아웃 종료 처리
function gameOver() {
    clearInterval(timerInterval);
    const userInfo = document.getElementById('displayUser').innerText;
    document.getElementById('stopwatch-screen').style.display = 'none';
    document.getElementById('resultTitle').innerText = '시간 초과!';
    document.getElementById('resultUser').innerText = `참여자: ${userInfo}`;
    document.getElementById('resultRecord').innerText = `기록: 03:00.00 (제한시간 초과)`;
    document.getElementById('result-screen').style.display = 'block';
}

// 8. 결과 화면에서 다시 처음 화면으로 이동
function goToStartScreen() {
    document.getElementById('studentId').value = '';
    document.getElementById('user').value = '';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
}

// 9. 백엔드로 데이터 전송
async function sendRecordToBackend(recordData) {
    try {
        // 접속한 기기의 IP를 자동으로 인식하여 5000번 포트 주소를 만듭니다.
        const SERVER_IP = window.location.hostname;
        const RECORD_API_URL = `http://${SERVER_IP}:5000/api/record`;

        const response = await fetch(RECORD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recordData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Flask 서버에 저장 성공:', result);
        } else {
            console.error('❌ 서버 저장 실패:', result.error);
        }
    } catch (error) {
        console.error('❌ Flask 서버 연결 실패 (run.py 확인 필요):', error);
    }
}
