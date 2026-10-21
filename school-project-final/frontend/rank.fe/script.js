/* ===== 데이터 형식 =====
   순위순으로 정렬된 배열: { studentId: '3105', name: '김민준', score: 42.35 (초), avatar: '(선택)' }
   studentId는 4자리 문자열 (학년 1자리 + 반 1자리 + 번호 2자리, 예: 3105 = 3학년 1반 5번)
   change(순위변동)는 생략하면 이전 렌더 대비 자동 계산됩니다.
   실시간 데이터가 올 때마다 Ranking.render(items) 를 호출하면 변경분만 부드럽게 갱신됩니다. */

const $ = (id) => document.getElementById(id);
const sec = (n) => Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '초';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CROWN = `<svg class="crown" viewBox="0 0 44 34"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE58A"/><stop offset="1" stop-color="#E29A1B"/></linearGradient></defs><path d="M3 10l9 8 10-14 10 14 9-8-4 20H7z" fill="url(#cg)" stroke="#fff3b8" stroke-width="1.5" stroke-linejoin="round"/><circle cx="3" cy="10" r="3" fill="#FFE58A"/><circle cx="22" cy="4" r="3" fill="#FFE58A"/><circle cx="41" cy="10" r="3" fill="#FFE58A"/></svg>`;

const avatar = (it) => it.avatar
  ? `<span class="avatar"><img src="${esc(it.avatar)}" alt=""></span>`
  : `<span class="avatar">${esc(String(it.name).charAt(0))}</span>`;

const change = (c = 0) => c > 0 ? `<span class="chg up">▲ ${c}</span>`
  : c < 0 ? `<span class="chg down">▼ ${Math.abs(c)}</span>` : `<span class="chg same">-</span>`;

const Ranking = {
  prevRank: new Map(), prevScore: new Map(), podiumSig: '', ready: false,

  render(items) {
    const all = items.map((it, i) => {
      const rank = i + 1, prev = this.prevRank.get(it.studentId);
      return { ...it, rank, change: it.change ?? (prev ? prev - rank : 0) };
    });

    // 포디움: 내용이 바뀐 경우에만 다시 그림 (등장 애니메이션 반복 방지)
    const top = all.slice(0, 3);
    const sig = top.map((t) => t.studentId + t.score).join('|');
    if (sig !== this.podiumSig) {
      this.podiumSig = sig;
      $('podium').classList.toggle('live', this.ready);
      $('podium').innerHTML = [top[1], top[0], top[2]].filter(Boolean).map((it) => `
        <div class="pod r${it.rank}">
          ${it.rank === 1 ? CROWN : ''}
          <div class="ring">${avatar(it)}</div>
          <div class="sid">${esc(it.studentId)}</div>
          <div class="name">${esc(it.name)}</div>
          <div class="score">${sec(it.score)}</div>
          <div class="step">${it.rank}</div>
        </div>`).join('');
    }

    // 리스트: 순위가 바뀐 행이 부드럽게 이동하도록 이동 전 위치를 기록
    const list = $('list');
    const before = new Map([...list.children].map((li) => [li.dataset.id, li.getBoundingClientRect().top]));
    list.innerHTML = all.slice(3).map((it) => `
      <li class="row" data-id="${esc(it.studentId)}">
        <span class="rank">${it.rank}</span>
        ${avatar(it)}
        <div class="info"><div class="name"><span class="sid">${esc(it.studentId)}</span>${esc(it.name)}</div></div>
        <div class="meta"><div class="score${this.ready && this.prevScore.get(it.studentId) !== it.score ? ' flash' : ''}">${sec(it.score)}</div>${change(it.change)}</div>
      </li>`).join('');
    if (this.ready) {
      [...list.children].forEach((li) => {
        const old = before.get(li.dataset.id);
        const d = old == null ? 0 : old - li.getBoundingClientRect().top;
        if (d) li.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    }

    this.prevRank = new Map(all.map((it) => [it.studentId, it.rank]));
    this.prevScore = new Map(all.map((it) => [it.studentId, it.score]));
    this.ready = true;
  },
};

/* ===== 실시간 연결 자리 (서버 구현 후 하나만 사용) =====
// SSE
// const es = new EventSource('/api/rank/stream');
// es.onmessage = (e) => Ranking.render(JSON.parse(e.data));
// WebSocket
// const ws = new WebSocket('wss://your-domain/rank');
// ws.onmessage = (e) => Ranking.render(JSON.parse(e.data));
// 최초 로딩: fetch('/api/rank').then(r => r.json()).then(Ranking.render);
*/
const SERVER_IP = window.location.hostname;
const API_URL = `http://${SERVER_IP}:5000/api/ranking`;

async function loadRanking() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // 서버에서 받아온 데이터를 화면에 렌더링
    Ranking.render(data);
  } catch (error) {
    console.error("랭킹을 불러오는 중 오류 발생:", error);
  }
}

// 화면이 켜지자마자 1번 실행하고, 이후 5초(5000ms)마다 새로고침
loadRanking();
setInterval(loadRanking, 5000);

