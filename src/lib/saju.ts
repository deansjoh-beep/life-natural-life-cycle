/**
 * SYSTEM INSTRUCTION:
 * 모든 간지(干支) 및 절기 계산은 반드시 '표준 만세력'의 기준을 엄격히 준수해야 함.
 * 24절기의 입기 시각을 정확히 반영하여 월건(月建)과 일진(日辰)을 산출하며,
 * 호호당의 자연순환명리학 원칙에 따라 일간과 월지를 조합함.
 *
 * [중요 지침]
 * 60년 주기의 기점(입춘) 연도는 사용자의 '출생 연도'가 속한 주기의 시작점이어야 함.
 * 즉, 기점 연도는 항상 출생 연도와 같거나 그 이전 60년 이내로 배정함.
 * (예: 1990년생의 기점 간지가 정미(丁未)라면 2027년이 아닌 1967년)
 *
 * [월지 조정 지침 — 60갑자에 없는 조합의 처리]
 * 60갑자에는 양간+양지, 음간+음지 조합만 존재하므로, 일간과 월지의 음양이
 * 서로 다르면(예: 계인) 두 글자를 합친 간지가 존재하지 않는다.
 * 이 경우 월지를 '다음 지지'(순행 방향)로 조정하여 기점 간지를 만든다.
 * 근거: 이번 달(今月)은 다음 달을 생(生)하기 때문.
 * (호호당 유튜브 사례: 인월 계수 일간 → 계인은 없으므로 계묘를 취함)
 * 단, 조후 판단(한난)과 억부 판단(득령)은 조정 전의 '실제 월지'를 기준으로 하고,
 * 입춘/입추 후보 간지는 조정된 지지와 그 충(冲)으로 구성한다.
 *
 * [입춘·입추 결정 지침 — 조후(調候) 원칙]
 * 일간+월지 간지와 일간+충지(월지와 반대되는 지지) 간지, 두 후보 중
 * 하나는 입춘(바닥), 다른 하나는 입추(정점)이 된다 (두 해는 30년 간격).
 *
 * 1. 조후 판단: 사주의 한난(寒暖)은 '월지'와 '시지' 글자의 냉온 여부로 판단한다.
 *    - 지지 냉온 분류: 한(寒) = 해·자·축·인·술 / 난(暖) = 사·오·미 / 중립 = 묘·진·신·유
 *    - 가중치: 월지 2, 시지 1. 냉온 점수를 가중 합산하므로 월지의 영향이 두 배이며,
 *      시지는 월지의 판정을 뒤집을 수 없고 중립 월지의 기울기만 정할 수 있다.
 *    - 월지·시지가 찬 글자 중심이면 사주는 한(寒)하고, 더운 글자 중심이면 난(暖)하다.
 *    - 시주(출생 시각)를 모르는 경우에는 '월지'만으로 조후를 판단한다.
 *      (만세력 계산상 정오를 대입하더라도, 조후 판단에 가상의 시지를 쓰지 않음)
 * 2. 입추 결정: 두 후보 간지 중, 지지가 '조후용신'에 해당하는 글자인 간지를
 *    입추로 정한다. 나머지 후보가 입춘이 된다.
 *    (예: 사주가 한(寒)하면 따뜻한 글자가 조후용신이므로, 따뜻한 지지를 가진
 *    간지가 입추)
 * 3. 조후가 중립적인 경우(월지·시지의 한난이 상쇄되거나 봄·가을의 중립적인
 *    글자인 경우): '억부용신'에 가까운 글자가 지지에 있는 간지를 입추로 정한다.
 *    - 억부는 자평명리학의 '월지 득령(得令) 여부'를 중심으로 판정한다:
 *      월지의 오행이 일간의 인성(일간을 생하는 오행) 또는 비겁(일간과 같은
 *      오행)이면 득령 → 신강, 아니면 실령 → 신약으로 본다.
 *    - 신약이면 일간을 돕는 오행(인성·비겁)이, 신강이면 일간의 힘을 빼거나
 *      억제하는 오행(식상·재성·관성)이 억부용신 방향이 된다.
 *    - 두 후보 지지 중 억부용신 방향의 오행에 해당하는 글자가 있는 간지를
 *      입추로 정한다. 억부로도 가릴 수 없는 경우(두 후보가 같은 오행인
 *      축/미·진/술 등)에는 사용자가 직접 선택한다.
 */
import { Solar, Lunar } from 'lunar-typescript';

export const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

export const JI_OPPOSITE: Record<string, string> = {
  '자': '오', '축': '미', '인': '신', '묘': '유', '진': '술', '사': '해',
  '오': '자', '미': '축', '신': '인', '유': '묘', '술': '진', '해': '사'
};

export interface SajuInfo {
  dayMaster: string;
  monthBranch: string;
  /** 시지. 출생 시각을 모르는 경우 null (조후 판단에 가상의 시지를 쓰지 않음) */
  timeBranch: string | null;
  /** 기점 간지에 쓰는 지지. 일간과 월지의 음양이 어긋나면 월지의 다음 지지로 조정됨 */
  baseBranch: string;
  /** 월지 조정 여부 */
  adjusted: boolean;
  ganji1: string;
  ganji2: string;
}

// 천간 10자 + 지지 12자 전체 매핑
const HANJA_MAP: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

function toHangul(char: string): string {
  return HANJA_MAP[char] || char;
}

/**
 * 생년월일(+시각)로 일간과 월지를 추출하고 기점 간지 후보 2개를 만듦.
 *
 * @param isLeapMonth 음력 윤달 여부 (isLunar가 true일 때만 의미 있음)
 * @param hour 출생 시각(0~23). 모르는 경우 null → 정오(12시)로 간주.
 *             월지는 절기 입기 '시각'을 경계로 바뀌므로, 절입일 출생자는 시각에 따라 결과가 달라질 수 있음.
 * @throws 존재하지 않는 날짜(예: 윤달이 없는 해의 윤달, 음력 30일이 없는 달)인 경우
 */
export function getSajuInfo(
  year: number,
  month: number,
  day: number,
  isLunar: boolean,
  isLeapMonth: boolean = false,
  hour: number | null = null
): SajuInfo {
  const h = hour ?? 12;
  let solar: Solar;
  if (isLunar) {
    // lunar-typescript는 음수 월로 윤달을 표현함 (예: 윤5월 → -5)
    const lunar = Lunar.fromYmd(year, isLeapMonth ? -month : month, day);
    const s = lunar.getSolar();
    solar = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), h, 0, 0);
  } else {
    solar = Solar.fromYmdHms(year, month, day, h, 0, 0);
  }
  const eightChar = solar.getLunar().getEightChar();

  const dayMaster = toHangul(eightChar.getDayGan());
  const monthBranch = toHangul(eightChar.getMonthZhi());
  // 시지는 실제 출생 시각을 아는 경우에만 추출 (모름이면 정오 대입값을 쓰지 않고 null)
  const timeBranch = hour !== null ? toHangul(eightChar.getTimeZhi()) : null;

  const dayIdx = GAN.indexOf(dayMaster);
  const monthIdx = JI.indexOf(monthBranch);
  if (dayIdx < 0 || monthIdx < 0) {
    // HANJA_MAP 누락 등으로 변환에 실패하면 잘못된 결과를 조용히 출력하지 않고 즉시 실패시킴
    throw new Error(`간지 변환에 실패했습니다: ${dayMaster}${monthBranch}`);
  }

  // 일간과 월지의 음양이 어긋나면(60갑자에 없는 조합) 월지를 다음 지지로 조정함.
  // 근거: 이번 달은 다음 달을 생(生)함 (예: 계인 → 계묘)
  const adjusted = dayIdx % 2 !== monthIdx % 2;
  const baseBranch = adjusted ? JI[(monthIdx + 1) % 12] : monthBranch;
  const oppositeBranch = JI_OPPOSITE[baseBranch];

  return {
    dayMaster,
    monthBranch,
    timeBranch,
    baseBranch,
    adjusted,
    ganji1: dayMaster + baseBranch,
    ganji2: dayMaster + oppositeBranch
  };
}

// 조후(調候) 판단용 지지 냉온 분류 (호호당 기준 확정)
// 한(寒): 해·자·축·인·술 / 난(暖): 사·오·미 / 중립: 묘·진·신·유
const BRANCH_TEMP: Record<string, number> = {
  '해': -1, '자': -1, '축': -1, '인': -1, '술': -1,
  '사': 1, '오': 1, '미': 1,
  '묘': 0, '진': 0, '신': 0, '유': 0
};

export interface JohuResult {
  /** 사주의 한난 판정 */
  chart: '한' | '난' | '중립';
  /** 입추로 추천되는 지지 (조후만으로 가릴 수 없으면 null → 억부용신 판단 필요) */
  ipchuBranch: string | null;
  /** 입춘으로 추천되는 지지 */
  ipchunBranch: string | null;
}

/**
 * 조후(調候)로 입춘/입추 후보를 판정함.
 * - 월지와 시지의 냉온으로 사주의 한난(寒暖)을 판단함(가중치: 월지 2, 시지 1).
 *   시주를 모르면 월지만으로 판단.
 * - 한(寒)하면 따뜻한 글자, 난(暖)하면 차가운 글자가 조후용신이며,
 *   두 후보(월지, 충지) 중 조후용신에 해당하는(가까운) 글자가 지지에 있는 간지가 입추가 됨.
 * - 조후가 중립이거나 두 후보의 냉온이 같으면 억부용신 판단이 필요하므로 추천 없이 반환함.
 */
export function judgeJohu(monthBranch: string, timeBranch: string | null, baseBranch: string = monthBranch): JohuResult {
  const monthTemp = BRANCH_TEMP[monthBranch] ?? 0;
  const timeTemp = timeBranch !== null ? (BRANCH_TEMP[timeBranch] ?? 0) : 0;
  // 가중치: 월지 2, 시지 1 — 월지가 조후에 더 큰 영향을 미침
  const chartTemp = monthTemp * 2 + timeTemp;

  if (chartTemp === 0) {
    return { chart: '중립', ipchuBranch: null, ipchunBranch: null };
  }
  const chart = chartTemp < 0 ? '한' : '난';

  // 사주의 한난은 실제 월지·시지로 판단하되, 후보는 (조정된) 기점 지지와 그 충으로 구성
  const candA = baseBranch;
  const candB = JI_OPPOSITE[baseBranch];
  const tempA = BRANCH_TEMP[candA] ?? 0;
  const tempB = BRANCH_TEMP[candB] ?? 0;

  if (tempA === tempB) {
    // 두 후보의 냉온이 같아(묘/유 등) 조후만으로 가릴 수 없음 → 억부용신 판단 필요
    return { chart, ipchuBranch: null, ipchunBranch: null };
  }

  // 한(寒)한 사주 → 따뜻한 쪽 후보가 조후용신에 가까움 → 입추
  // 난(暖)한 사주 → 차가운 쪽 후보가 조후용신에 가까움 → 입추
  const ipchuBranch = chart === '한'
    ? (tempA > tempB ? candA : candB)
    : (tempA < tempB ? candA : candB);
  const ipchunBranch = ipchuBranch === candA ? candB : candA;
  return { chart, ipchuBranch, ipchunBranch };
}

// 오행 인덱스: 목0 화1 토2 금3 수4 (상생: i → (i+1)%5, 생아(인성): (i+4)%5)
const GAN_ELEMENT: Record<string, number> = {
  '갑': 0, '을': 0, '병': 1, '정': 1, '무': 2, '기': 2, '경': 3, '신': 3, '임': 4, '계': 4
};
const JI_ELEMENT: Record<string, number> = {
  '인': 0, '묘': 0, '사': 1, '오': 1, '진': 2, '술': 2, '축': 2, '미': 2,
  '신': 3, '유': 3, '해': 4, '자': 4
};

export interface EokbuResult {
  /** 월지 득령 여부 중심의 신강/신약 판정 */
  strength: '신강' | '신약';
  /** 입추로 추천되는 지지 (억부로도 가릴 수 없으면 null) */
  ipchuBranch: string | null;
  /** 입춘으로 추천되는 지지 */
  ipchunBranch: string | null;
}

/**
 * 억부(抑扶)로 입춘/입추 후보를 판정함. 조후가 중립일 때만 사용.
 * - 신강/신약은 자평명리학의 '월지 득령 여부'를 중심으로 판정:
 *   월지 오행이 일간의 인성·비겁이면 득령 → 신강, 아니면 실령 → 신약.
 * - 신약 → 일간을 돕는 오행(인성·비겁)이 용신 / 신강 → 힘을 빼거나 억제하는
 *   오행(식상·재성·관성)이 용신.
 * - 두 후보(월지, 충지) 중 용신 방향 오행의 글자가 있는 간지가 입추.
 * - 두 후보가 같은 오행(축/미, 진/술)이거나 둘 다 용신 방향이면 판정 불가(null).
 */
export function judgeEokbu(dayMaster: string, monthBranch: string, baseBranch: string = monthBranch): EokbuResult {
  const d = GAN_ELEMENT[dayMaster];
  const isSupportive = (el: number) => el === d || el === (d + 4) % 5; // 비겁 또는 인성

  const strength: '신강' | '신약' = isSupportive(JI_ELEMENT[monthBranch]) ? '신강' : '신약';

  // 득령은 실제 월지로 판단하되, 후보는 (조정된) 기점 지지와 그 충으로 구성
  const candA = baseBranch;
  const candB = JI_OPPOSITE[baseBranch];
  const elA = JI_ELEMENT[candA];
  const elB = JI_ELEMENT[candB];
  if (elA === elB) {
    // 축/미, 진/술: 두 후보가 같은 오행(토)이라 억부로 가릴 수 없음
    return { strength, ipchuBranch: null, ipchunBranch: null };
  }

  const aIsYongsin = strength === '신약' ? isSupportive(elA) : !isSupportive(elA);
  const bIsYongsin = strength === '신약' ? isSupportive(elB) : !isSupportive(elB);
  if (aIsYongsin === bIsYongsin) {
    // 두 후보가 모두 용신 방향이거나 모두 아님 → 판정 불가
    return { strength, ipchuBranch: null, ipchunBranch: null };
  }

  const ipchuBranch = aIsYongsin ? candA : candB;
  return { strength, ipchuBranch, ipchunBranch: ipchuBranch === candA ? candB : candA };
}

export interface GijeomResult {
  /** 판정에 사용된 방법. 자동 판정 불가 시 null */
  method: '조후' | '억부' | null;
  johu: JohuResult;
  eokbu: EokbuResult | null;
  ipchuBranch: string | null;
  ipchunBranch: string | null;
}

/**
 * 기점(입춘/입추) 종합 판정: 1차 조후 → (중립·판정불가 시) 2차 억부 → 수동.
 */
export function decideGijeom(dayMaster: string, monthBranch: string, timeBranch: string | null, baseBranch: string = monthBranch): GijeomResult {
  const johu = judgeJohu(monthBranch, timeBranch, baseBranch);
  if (johu.ipchunBranch) {
    return { method: '조후', johu, eokbu: null, ipchuBranch: johu.ipchuBranch, ipchunBranch: johu.ipchunBranch };
  }
  const eokbu = judgeEokbu(dayMaster, monthBranch, baseBranch);
  if (eokbu.ipchunBranch) {
    return { method: '억부', johu, eokbu, ipchuBranch: eokbu.ipchuBranch, ipchunBranch: eokbu.ipchunBranch };
  }
  return { method: null, johu, eokbu, ipchuBranch: null, ipchunBranch: null };
}

/**
 * 주어진 간지에 해당하는 연도 중, 기준 연도(출생 연도)가 속한 주기의 연도를 반환함.
 * 반환값은 항상 referenceYear 이하, referenceYear - 59 이상임.
 */
/**
 * 간지가 60갑자에 실제로 존재하는 조합인지 검사함.
 * 60갑자에는 양간+양지, 음간+음지 조합만 존재하므로(각 30개씩 총 60개),
 * 일간과 월지의 음양이 어긋나면(예: 갑묘) 존재하지 않는 간지가 됨.
 */
export function isValidGanji(ganji: string): boolean {
  const ganIdx = GAN.indexOf(ganji[0]);
  const zhiIdx = JI.indexOf(ganji[1]);
  return ganIdx >= 0 && zhiIdx >= 0 && ganIdx % 2 === zhiIdx % 2;
}

export function getYearByGanji(ganji: string, referenceYear: number): number {
  const gan = ganji[0];
  const zhi = ganji[1];

  // 60갑자 중 해당 간지가 몇 번째인지 찾기
  let targetIdx = -1;
  for (let i = 0; i < 60; i++) {
    if (GAN[i % 10] === gan && JI[i % 12] === zhi) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx === -1) {
    // 음양이 어긋난 조합(예: 갑축) 또는 잘못된 글자 → 조용히 틀린 연도를 내지 않고 실패시킴
    throw new Error(`유효하지 않은 간지입니다: ${ganji}`);
  }

  // 갑자년(0번째)은 1924, 1984, 2044... → year % 60 === (targetIdx + 4) % 60
  const targetMod = (targetIdx + 4) % 60;
  // 기준 연도로부터 몇 년 전이 해당 간지년인지 (0~59)
  const diff = ((referenceYear % 60) - targetMod + 60) % 60;
  return referenceYear - diff;
}

export const SEASONS = [
  { name: '입춘', angle: 180, description: '인생의 가장 바닥, 새로운 시작의 씨앗' },
  { name: '우수', angle: 195, description: '얼음이 녹고 비가 내리는 시기' },
  { name: '경칩', angle: 210, description: '잠자던 생명이 깨어나는 시기' },
  { name: '춘분', angle: 225, description: '낮과 밤의 길이가 같아지는 봄의 정점' },
  { name: '청명', angle: 240, description: '하늘이 맑아지고 만물이 소생하는 시기' },
  { name: '곡우', angle: 255, description: '백곡을 기름지게 하는 비가 내리는 시기' },
  { name: '입하', angle: 270, description: '사회적 활동이 왕성해지는 여름의 시작' },
  { name: '소만', angle: 285, description: '만물이 점차 자라나 가득 차는 시기' },
  { name: '망종', angle: 300, description: '씨를 뿌리고 성장을 가속화하는 시기' },
  { name: '하지', angle: 315, description: '열정이 최고조에 달하는 여름의 정점' },
  { name: '소서', angle: 330, description: '본격적인 더위가 시작되는 시기' },
  { name: '대서', angle: 345, description: '가장 무더운 여름의 끝자락' },
  { name: '입추', angle: 0, description: '인생의 정점, 결실을 맺기 시작하는 가을의 시작' },
  { name: '처서', angle: 15, description: '더위가 물러가고 선선한 바람이 부는 시기' },
  { name: '백로', angle: 30, description: '흰 이슬이 맺히며 가을 기운이 깊어지는 시기' },
  { name: '추분', angle: 45, description: '수확을 마무리하고 정리하는 가을의 정점' },
  { name: '한로', angle: 60, description: '찬 이슬이 맺히며 겨울을 준비하는 시기' },
  { name: '상강', angle: 75, description: '서리가 내리고 만물이 갈무리되는 시기' },
  { name: '입동', angle: 90, description: '내면으로 침잠하고 휴식을 준비하는 겨울의 시작' },
  { name: '소설', angle: 105, description: '첫눈이 내리고 추위가 시작되는 시기' },
  { name: '대설', angle: 120, description: '눈이 많이 내리고 깊은 겨울로 들어가는 시기' },
  { name: '동지', angle: 135, description: '가장 깊은 밤, 다음 순환을 기다리는 겨울의 정점' },
  { name: '소한', angle: 150, description: '가장 추운 시기, 인내와 성찰의 시간' },
  { name: '대한', angle: 165, description: '큰 추위가 지나고 다시 봄을 기다리는 시기' },
];

export const MAJOR_SEASONS = ['입춘', '춘분', '입하', '하지', '입추', '추분', '입동', '동지'];
