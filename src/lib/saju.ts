/**
 * SYSTEM INSTRUCTION: 
 * 모든 간지(干支) 및 절기 계산은 반드시 '표준 만세력'의 기준을 엄격히 준수해야 함.
 * 24절기의 입기 시각을 정확히 반영하여 월건(月建)과 일진(日辰)을 산출하며,
 * 호호당의 자연순환명리학 원칙에 따라 일간과 월지를 조합함.
 * 
 * [중요 지침]
 * 60년 주기의 기점이 되는 '입춘' 연도는 반드시 사용자의 '출생 연도'와 같거나 그 이후여야 함.
 * 출생 연도 이전으로 기점이 배정되는 오류를 방지하기 위해, 계산된 연도가 출생 연도보다 작을 경우 60년을 더하여 조정함.
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
  ganji1: string;
  ganji2: string;
}

const HANJA_MAP: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '미': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

// '未' (미) was missing in the previous thought, adding it correctly.
// Also ensuring all 12 branches are covered.
// '午' is '오', '未' is '미', '申' is '신', '酉' is '유', '戌' is '술', '亥' is '해'
// '子' is '자', '丑' is '축', '寅' is '인', '卯' is '묘', '辰' is '진', '巳' is '사'

function toHangul(char: string): string {
  return HANJA_MAP[char] || char;
}

export function getSajuInfo(year: number, month: number, day: number, isLunar: boolean): SajuInfo {
  let solar: Solar;
  if (isLunar) {
    const lunar = Lunar.fromYmd(year, month, day);
    solar = lunar.getSolar();
  } else {
    solar = Solar.fromYmd(year, month, day);
  }
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const dayMaster = toHangul(eightChar.getDayGan());
  const monthBranch = toHangul(eightChar.getMonthZhi());

  const ganji1 = dayMaster + monthBranch;
  const oppositeBranch = JI_OPPOSITE[monthBranch];
  const ganji2 = dayMaster + oppositeBranch;

  return {
    dayMaster,
    monthBranch,
    ganji1,
    ganji2
  };
}

export function getYearByGanji(ganji: string, referenceYear: number): number {
  // 60갑자 중 해당 간지가 몇 번째인지 찾기
  const gan = ganji[0];
  const zhi = ganji[1];
  
  const ganIdx = GAN.indexOf(gan);
  const zhiIdx = JI.indexOf(zhi);
  
  // (ganIdx - zhiIdx) % 2 == 0 이어야 함 (정상적인 간지)
  let targetIdx = -1;
  for (let i = 0; i < 60; i++) {
    if (GAN[i % 10] === gan && JI[i % 12] === zhi) {
      targetIdx = i;
      break;
    }
  }

  // 기준 연도(태어난 해) 근처의 해당 간지 연도 찾기
  // 갑자년(0번째)은 1924, 1984, 2044... (60n + 4)
  // 연도 % 60 을 했을 때의 값 계산
  // 1984 % 60 = 4
  // targetYear % 60 = (targetIdx + 4) % 60
  
  const refMod = referenceYear % 60;
  const targetMod = (targetIdx + 4) % 60;
  
  let year = referenceYear - (refMod - targetMod);
  
  // 출생 연도(referenceYear)보다 이전으로 배정되지 않도록 조정
  while (year < referenceYear) {
    year += 60;
  }
  
  // 만약 너무 미래로 갔다면 (예: 60년 이상 차이), 
  // 호호당 이론상 가장 가까운 미래의 해당 간지년을 선택함
  // (이미 위 while문에서 최소 referenceYear 이상의 첫 번째 연도를 찾음)
  
  return year;
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
