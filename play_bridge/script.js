const TICK_COUNT = 60;
const MAX_SECONDS = 180;
const svgNS = 'http://www.w3.org/2000/svg';
const PARTICIPANT_LABELS = {
    student: '재학생',
    staff: '교직원',
    visitor: '외부인'
};

let selectedParticipantType = null;
let activeParticipant = null;
let startTime;
let timerInterval;
let isGameRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    showScreen('start-screen');
});

// 한 번에 한 화면만 표시합니다.
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => {
        screen.style.display = screen.id === screenId ? 'block' : 'none';
    });
}

// 메인 화면 → 참가자 유형 선택
function goToParticipantScreen() {
    if (isGameRunning) return;
    selectedParticipantType = null;
    showScreen('participant-screen');
}

// 재학생은 기존 화면, 교직원/외부인은 별도 이름 입력 화면으로 이동
function selectParticipantType(type) {
    if (isGameRunning || !Object.hasOwn(PARTICIPANT_LABELS, type)) return;
    selectedParticipantType = type;

    if (type === 'student') {
        showScreen('info-screen');
        document.getElementById('studentId').focus();
        return;
    }

    document.getElementById('guest-type').textContent = PARTICIPANT_LABELS[type];
    document.getElementById('guest-title').textContent = `${PARTICIPANT_LABELS[type]} 정보 입력`;
    document.getElementById('guestName').value = '';
    showScreen('guest-info-screen');
    document.getElementById('guestName').focus();
}

// 기존 함수 이름도 유지합니다.
function goToInfoScreen() {
    selectParticipantType('student');
}

// 학번이 없는 참가자도 서로 다른 키로 퀴즈 결과를 저장하도록 ID를 만듭니다.
// 이름으로 ID를 만들지 않으므로 동명이인의 기록이 섞이지 않습니다.
function createGuestId(type) {
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    const randomPart = Array.from(randomBytes, (value) => value.toString(16).padStart(2, '0')).join('');
    return `${type}_${Date.now().toString(36)}_${randomPart}`;
}

function startGame() {
    if (isGameRunning) return;
    if (!selectedParticipantType) {
        goToParticipantScreen();
        return;
    }

    const type = selectedParticipantType;
    let participantId;
    let username;

    if (type === 'student') {
        participantId = document.getElementById('studentId').value.trim();
        username = document.getElementById('user').value.trim();
        if (!/^\d{4}$/.test(participantId)) {
            alert('학번이 정확한지 확인해주세요. (숫자 4자리)');
            document.getElementById('studentId').focus();
            return;
        }
    } else {
        username = document.getElementById('guestName').value.trim();
    }

    if (!username) {
        alert('이름을 입력해주세요.');
        document.getElementById(type === 'student' ? 'user' : 'guestName').focus();
        return;
    }
    if (type !== 'student') participantId = createGuestId(type);

    // 퀴즈 탭이 리셋 신호를 받을 때 새 참가자를 읽을 수 있도록,
    // 참가자 정보 저장 → 결과 초기화 → 시작 신호 순서로 실행합니다.
    try {
        // 기존 퀴즈와의 연결을 위해 studentId 키를 유지합니다.
        // 교직원/외부인은 이 키에 학번 대신 내부 참가 ID를 저장합니다.
        localStorage.setItem('studentId', participantId);
        localStorage.setItem('participantType', type);
        localStorage.setItem('participantName', username);
        localStorage.removeItem(`quizResult_${participantId}_round1`);
        localStorage.removeItem(`quizResult_${participantId}_round2`);
        localStorage.setItem('gameStartSignal', `${Date.now()}_${Math.random().toString(36).slice(2)}`);
    } catch (error) {
        console.error('참가자 정보 저장 실패:', error);
        alert('브라우저 저장소를 사용할 수 없습니다. 저장소 사용 설정을 확인해주세요.');
        return;
    }

    activeParticipant = { id: participantId, type, username };
    document.getElementById('displayUser').textContent = type === 'student'
        ? `${participantId} ${username}`
        : `${PARTICIPANT_LABELS[type]} ${username}`;

    resetResultScreen();
    document.getElementById('timer').textContent = '00:00.00';
    createTicks();
    showScreen('stopwatch-screen');
    isGameRunning = true;
    startTimer();
}

function createTicks() {
    const svg = document.getElementById('tickSvg');
    svg.innerHTML = '';
    const cx = 100, cy = 100;
    const outerR = 95, innerR = 80;
    for (let i = 0; i < TICK_COUNT; i++) {
        const angle = (i * 360 / TICK_COUNT) * (Math.PI / 180) - Math.PI / 2;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', cx + innerR * Math.cos(angle));
        line.setAttribute('y1', cy + innerR * Math.sin(angle));
        line.setAttribute('x2', cx + outerR * Math.cos(angle));
        line.setAttribute('y2', cy + outerR * Math.sin(angle));
        line.setAttribute('class', 'tick');
        line.setAttribute('id', `tick-${i}`);
        svg.appendChild(line);
    }
}

function formatTime(milliseconds) {
    const centiseconds = Math.floor(Math.max(0, milliseconds) / 10);
    const minutes = String(Math.floor(centiseconds / 6000)).padStart(2, '0');
    const seconds = String(Math.floor((centiseconds % 6000) / 100)).padStart(2, '0');
    const fraction = String(centiseconds % 100).padStart(2, '0');
    return `${minutes}:${seconds}.${fraction}`;
}

function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 10);
}

function updateTimer() {
    if (!isGameRunning) return;
    const elapsedTime = Math.min(Date.now() - startTime, MAX_SECONDS * 1000);
    document.getElementById('timer').textContent = formatTime(elapsedTime);

    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const lapCount = Math.floor(elapsedSeconds / 60);
    const secondsInLap = elapsedSeconds % 60;
    for (let i = 0; i < TICK_COUNT; i++) {
        const tick = document.getElementById(`tick-${i}`);
        const passes = i < secondsInLap ? lapCount + 1 : lapCount;
        const lapLevel = Math.min(passes, 3);
        tick.setAttribute('class', 'tick' + (lapLevel > 0 ? ' lap-' + lapLevel : ''));
    }
    if (elapsedTime >= MAX_SECONDS * 1000) gameOver();
}

function stopGame() {
    if (!isGameRunning || !activeParticipant) return;
    const elapsedMilliseconds = Date.now() - startTime;
    if (elapsedMilliseconds >= MAX_SECONDS * 1000) {
        gameOver();
        return;
    }
    isGameRunning = false;
    clearInterval(timerInterval);

    // 이 게임을 시작할 때 확정한 참가자 정보로 결과를 처리합니다.
    const participant = activeParticipant;
    const round1 = localStorage.getItem(`quizResult_${participant.id}_round1`) || 'none';
    const round2 = localStorage.getItem(`quizResult_${participant.id}_round2`) || 'none';
    const quizBonus = (round1 === 'correct' ? 1 : 0) + (round2 === 'correct' ? 2 : 0);
    const finalMilliseconds = Math.max(0, elapsedMilliseconds - quizBonus * 1000);

    document.getElementById('resultTitle').textContent = '게임 종료!';
    document.getElementById('resultTitle').classList.remove('timeout');
    document.getElementById('resultUser').textContent = `참여자: ${document.getElementById('displayUser').textContent}`;
    document.getElementById('resultRecord').textContent = `최종 기록: ${formatTime(finalMilliseconds)}`;
    const round1Text = round1 === 'correct' ? '정답(-1초)' : round1 === 'incorrect' ? '오답' : '미응시';
    const round2Text = round2 === 'correct' ? '정답(-2초)' : round2 === 'incorrect' ? '오답' : '미응시';
    document.getElementById('quizResult').textContent =
        `학교퀴즈(쉬움): ${round1Text}\n괴산퀴즈(어려움): ${round2Text}\n퀴즈 차감시간: ${quizBonus}초`;
    showScreen('result-screen');

    sendRecordToBackend({
        // 기존 API 필드 유지. 비재학생은 staff_... 또는 visitor_... 형태입니다.
        // 백엔드에서 숫자 4자리로만 제한한다면 검증/DB 수정이 필요합니다.
        studentId: participant.id,
        username: participant.username,
        rawTime: elapsedMilliseconds / 1000,
        quiz1: round1,
        quiz2: round2,
        participantType: participant.type,
        participantId: participant.id
    });
}

function gameOver() {
    if (!isGameRunning) return;
    isGameRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '03:00.00';
    document.getElementById('resultTitle').textContent = '시간 초과!';
    document.getElementById('resultTitle').classList.add('timeout');
    document.getElementById('resultUser').textContent = `참여자: ${document.getElementById('displayUser').textContent}`;
    document.getElementById('resultRecord').textContent = '기록: 03:00.00 (제한시간 초과)';
    document.getElementById('quizResult').textContent = '';
    showScreen('result-screen');
    // 기존과 동일하게 제한시간 초과 기록은 서버에 전송하지 않습니다.
}

function resetResultScreen() {
    document.getElementById('resultTitle').textContent = '게임 종료';
    document.getElementById('resultTitle').classList.remove('timeout');
    document.getElementById('resultUser').textContent = '';
    document.getElementById('resultRecord').textContent = '';
    document.getElementById('quizResult').textContent = '';
}

function goToStartScreen() {
    if (isGameRunning) return;
    clearInterval(timerInterval);
    selectedParticipantType = null;
    activeParticipant = null;
    document.getElementById('studentId').value = '';
    document.getElementById('user').value = '';
    document.getElementById('guestName').value = '';
    document.getElementById('timer').textContent = '00:00.00';
    resetResultScreen();
    showScreen('start-screen');
}

async function sendRecordToBackend(recordData) {
    try {
        const SERVER_IP = window.location.hostname;
        const RECORD_API_URL = `http://${SERVER_IP}:5000/api/record`;
        const response = await fetch(RECORD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
