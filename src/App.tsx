import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Info, ChevronRight, RefreshCcw, ArrowRight, Check, Download, ShieldCheck, ExternalLink, Youtube, Globe } from 'lucide-react';
import { getSajuInfo, getYearByGanji, SajuInfo, SEASONS, MAJOR_SEASONS } from './lib/saju';
import LifeCycleChart from './components/LifeCycleChart';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const YEARS = Array.from({ length: 121 }, (_, i) => 2026 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function App() {
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [isLunar, setIsLunar] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saju, setSaju] = useState<SajuInfo | null>(null);
  const [selectedIpchunGanji, setSelectedIpchunGanji] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState<'input' | 'result' | 'guide'>('input');
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = () => {
    if (!privacyAccepted) {
      alert('개인정보 제공 동의가 필요합니다.');
      return;
    }
    const info = getSajuInfo(year, month, day, isLunar);
    setSaju(info);
    setSelectedIpchunGanji(info.ganji1);
    setCurrentPage('result');
  };

  const lifeCycleData = useMemo(() => {
    if (!saju || !selectedIpchunGanji) return null;
    
    const birthYear = year;
    // Find the ipchunYear that was active at birth (the one before or equal to birthYear)
    let ipchunYear = getYearByGanji(selectedIpchunGanji, birthYear);
    while (ipchunYear > birthYear) {
      ipchunYear -= 60;
    }
    
    const currentYear = new Date().getFullYear();
    
    // Generate 120 years (2 cycles)
    const fullSchedule: any[] = [];
    for (let cycle = 0; cycle < 2; cycle++) {
      const cycleStart = ipchunYear + (cycle * 60);
      SEASONS.forEach(s => {
        const yearsFromIpchun = (s.angle - 180 < 0 ? s.angle + 180 : s.angle - 180) / 360 * 60;
        fullSchedule.push({
          ...s,
          year: Math.floor(cycleStart + yearsFromIpchun)
        });
      });
    }

    // Filter schedule to start from birthYear and sort
    const schedule = fullSchedule
      .filter(s => s.year >= birthYear)
      .sort((a, b) => a.year - b.year);

    return {
      ipchunYear,
      currentYear,
      birthYear,
      schedule
    };
  }, [saju, selectedIpchunGanji, year]);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      // Create a clone of the report element to modify it for PDF export
      const element = reportRef.current;
      
      // Use html2canvas with onclone to handle hidden elements and scrollable areas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F9F9F7',
        logging: false,
        onclone: (clonedDoc) => {
          // Hide elements with 'no-print' class in the cloned document
          const noPrintElements = clonedDoc.querySelectorAll('.no-print');
          noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');
          
          // Expand scrollable containers to show all content
          const scrollContainers = clonedDoc.querySelectorAll('.overflow-y-auto');
          scrollContainers.forEach(el => {
            (el as HTMLElement).style.overflow = 'visible';
            (el as HTMLElement).style.maxHeight = 'none';
          });

          // Workaround for oklch and oklab colors not supported by html2canvas
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(tag => {
            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
              // Replace oklch/oklab with a hex fallback to prevent parsing errors
              // This is a broad replacement to ensure the export doesn't fail
              tag.innerHTML = tag.innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#3b82f6');
            }
          });
          
          // Ensure the cloned element itself is visible and has no height restrictions
          const clonedElement = clonedDoc.querySelector('.pdf-report-container') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`인생의사계절_분석결과_${year}${month}${day}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF 저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    setCurrentPage('input');
    setSaju(null);
    setPrivacyAccepted(false);
  };

  const NavItem = ({ id, label, disabled = false }: { id: 'input' | 'result' | 'guide', label: string, disabled?: boolean }) => (
    <button
      onClick={() => !disabled && setCurrentPage(id)}
      disabled={disabled}
      className={`relative px-4 py-2 text-sm font-medium transition-colors ${
        currentPage === id 
          ? 'text-blue-600' 
          : disabled 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
      {currentPage === id && (
        <motion.div 
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header & Navigation */}
      <header className="sticky top-0 z-50 bg-[#F9F9F7]/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="cursor-pointer" onClick={() => setCurrentPage('input')}>
              <h1 className="text-xl font-light tracking-tight serif">인생의 사계절</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Hohodang Natural Cycle</p>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              <NavItem id="input" label="정보입력" />
              <NavItem id="result" label="나의 인생" disabled={!saju} />
              <NavItem id="guide" label="가이드" />
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            {currentPage === 'result' && (
              <button 
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                <Download size={14} /> {isExporting ? 'PDF 생성 중...' : 'PDF 저장'}
              </button>
            )}
            {saju && currentPage !== 'input' && (
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-blue-600 transition-colors"
              >
                <RefreshCcw size={14} /> 다시 입력
              </button>
            )}
          </div>
        </div>
        {/* Mobile Nav */}
        <div className="md:hidden flex justify-center border-t border-gray-50 py-2">
          <NavItem id="input" label="정보입력" />
          <NavItem id="result" label="나의 인생" disabled={!saju} />
          <NavItem id="guide" label="가이드" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 pb-24">
        <AnimatePresence mode="wait">
          {currentPage === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-50/50 rounded-full -ml-16 -mb-16 blur-3xl"></div>

                <div className="relative z-10 text-center">
                  <h2 className="text-3xl md:text-4xl font-normal brush mb-4 leading-tight">
                    당신은 지금 <span className="text-blue-600">어떤 계절</span>에 있나요?
                  </h2>
                  <p className="text-gray-500 mb-6 leading-relaxed max-w-sm mx-auto text-sm">
                    호호당의 자연순환명리학을 바탕으로<br />
                    당신의 60년 인생 주기를 정교하게 분석해 드립니다.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    {/* Calendar Type Toggle */}
                    <div className="flex justify-center p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl w-fit mx-auto">
                      <button
                        onClick={() => setIsLunar(false)}
                        className={`px-10 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${!isLunar ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        양력
                      </button>
                      <button
                        onClick={() => setIsLunar(true)}
                        className={`px-10 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isLunar ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        음력
                      </button>
                    </div>

                    {/* Dropdowns with refined styling */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Year', value: year, setter: setYear, options: YEARS, suffix: '년' },
                        { label: 'Month', value: month, setter: setMonth, options: MONTHS, suffix: '월' },
                        { label: 'Day', value: day, setter: setDay, options: DAYS, suffix: '일' }
                      ].map((item) => (
                        <div key={item.label} className="space-y-2 text-left">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{item.label}</label>
                          <div className="relative group">
                            <select 
                              value={item.value}
                              onChange={(e) => item.setter(Number(e.target.value))}
                              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-lg font-medium focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none cursor-pointer group-hover:bg-gray-100/50"
                            >
                              {item.options.map(opt => <option key={opt} value={opt}>{opt}{item.suffix}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover:text-gray-400 transition-colors">
                              <ChevronRight size={18} className="rotate-90" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Checkbox with improved design */}
                  <div className="mb-5 flex items-center justify-center">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-6 h-6 border-2 border-gray-200 rounded-lg transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-blue-300 flex items-center justify-center">
                          <Check size={14} className="text-white opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-300" />
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">개인정보 제공 동의하기</span>
                    </label>
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    className="w-full py-5 bg-[#1A1A1A] text-white rounded-[20px] font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
                  >
                    내 인생의 계절 확인하기 <ArrowRight size={20} />
                  </button>
                </div>
              </div>
              
              <p className="mt-4 text-center text-gray-400 text-[11px] leading-relaxed">
                * 입력하신 정보는 분석 즉시 파기되며 서버에 저장되지 않습니다.
              </p>
            </motion.div>
          )}
          {currentPage === 'result' && saju && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pdf-report-container"
              ref={reportRef}
            >
              {/* Saju Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">일간 / 월지</p>
                  <p className="text-2xl font-medium">{saju?.dayMaster} / {saju?.monthBranch}</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm md:col-span-2 no-print">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">기점 간지 선택 (입춘 후보)</p>
                  <div className="flex gap-4">
                    {[saju?.ganji1, saju?.ganji2].map((g, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedIpchunGanji(g!)}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium relative ${
                          selectedIpchunGanji === g 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-100 hover:border-gray-300 text-gray-500'
                        }`}
                      >
                        {g} ({idx === 0 ? '기본' : '반대'})
                        {selectedIpchunGanji === g && <Check size={14} className="absolute top-2 right-2" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400 flex items-center gap-1">
                    <Info size={12} /> 살아온 인생을 바탕으로 더 잘 맞는 기점을 선택할 수 있습니다.
                  </p>
                </div>
                {/* Print-only selected ganji */}
                <div className="hidden print-block bg-white rounded-3xl p-6 border border-gray-100 shadow-sm md:col-span-2">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">선택된 기점 간지</p>
                   <p className="text-2xl font-medium">{selectedIpchunGanji}</p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <LifeCycleChart 
                  ipchunYear={lifeCycleData!.ipchunYear}
                  currentYear={lifeCycleData!.currentYear}
                  birthYear={lifeCycleData!.birthYear}
                />

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                      <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                      나의 인생과 절기
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {lifeCycleData?.schedule.map((s, idx) => {
                        const isNext = s.year >= lifeCycleData.currentYear && (idx === 0 || lifeCycleData.schedule[idx-1].year < lifeCycleData.currentYear);
                        
                        const isMajor = MAJOR_SEASONS.includes(s.name);
                        
                        return (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${isNext ? 'border-blue-200 bg-blue-50/50' : 'border-gray-50'} ${isMajor ? 'bg-red-50/30' : ''}`}>
                            <div className="flex items-center gap-4">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                                isMajor ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {s.name}
                              </span>
                              <div>
                                <p className="font-semibold">{s.year}년</p>
                                <p className="text-xs text-gray-500">{s.description}</p>
                              </div>
                            </div>
                            {isNext && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-1 rounded-full uppercase tracking-tighter">Next</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#1A1A1A] text-white rounded-3xl p-8 shadow-xl">
                    <h3 className="text-lg font-medium mb-4">현재 당신의 계절은?</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {lifeCycleData && (() => {
                        const diff = lifeCycleData.currentYear - lifeCycleData.ipchunYear;
                        const normalized = diff < 0 ? diff + 60 : diff % 60;
                        if (normalized < 15) return "현재 당신은 '봄'의 시기를 지나고 있습니다. 새로운 씨앗을 뿌리고 기초를 다지는 시기입니다.";
                        if (normalized < 30) return "현재 당신은 '여름'의 시기를 지나고 있습니다. 왕성한 활동과 성장이 이루어지는 뜨거운 시기입니다.";
                        if (normalized < 45) return "현재 당신은 '가을'의 시기를 지나고 있습니다. 그동안의 노력이 결실을 맺고 수확하는 풍요로운 시기입니다.";
                        return "현재 당신은 '겨울'의 시기를 지나고 있습니다. 활동을 줄이고 내면을 채우며 다음 순환을 준비하는 지혜로운 시기입니다.";
                      })()}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-400 font-medium text-sm cursor-pointer hover:underline">
                        자세히 보기 <ArrowRight size={16} />
                      </div>
                      <span className="text-[10px] text-gray-500 italic">본 계산은 표준 만세력을 바탕으로 합니다.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {currentPage === 'guide' && (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              {/* External Links Card */}
              <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="serif text-3xl mb-6">"호호당 자연순환운명학" 알아보기</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="http://www.hohodang.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Globe size={20} />
                      </div>
                      <span className="font-bold text-sm">공식 홈페이지</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-500" />
                  </a>
                  <a 
                    href="https://hohodang.tistory.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                        <RefreshCcw size={20} />
                      </div>
                      <span className="font-bold text-sm">티스토리 블로그</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-500" />
                  </a>
                  <a 
                    href="http://www.youtube.com/@hohodang-w9p" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Youtube size={20} />
                      </div>
                      <span className="font-bold text-sm">유튜브 채널</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-500" />
                  </a>
                </div>
              </div>

              {/* Logic Guide Card */}
              <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="serif text-4xl mb-4">분석 로직 가이드</div>
                <p className="text-gray-400 mb-10">호호당의 '자연순환운명학' 이론을 바탕으로 입춘과 입추 연도를 추정하는 로직입니다.</p>
                
                <div className="grid grid-cols-1 gap-6">
                  {[
                    {
                      num: 1,
                      title: "일간(日干)과 월지(月支) 추출 및 기점 간지 조합",
                      desc: "사주의 핵심 몸통인 태어난 달의 지지(월지 혹은 월령)와 태어난 날의 천간(일간)을 추출하여 하나의 간지(干支)로 연결합니다.",
                      example: "예시: 일간이 '정(丁)'이고 월지가 '미(未)'인 경우 기본 기점은 '정미(丁未)'가 됩니다."
                    },
                    {
                      num: 2,
                      title: "월지와 반대되는 지지(충) 추출 및 두 번째 간지 조합",
                      desc: "추출한 월지와 12지신 순서상 정반대(6개 차이)에 위치하는 글자를 찾은 뒤, 이를 다시 일간과 결합해 두 번째 간지를 만듭니다.",
                      example: "예시: '미(未)'와 반대되는 글자는 '축(丑)'이므로, 두 번째 간지는 '정축(丁丑)'이 됩니다."
                    },
                    {
                      num: 3,
                      title: "입춘(바닥)과 입추(정점) 연도 후보 도출",
                      desc: "위의 1, 2단계를 통해 만들어진 두 개의 간지(예: 정미년, 정축년)에 해당하는 연도가 바로 그 사람의 60년 운세 순환에서 가장 바닥인 '입춘'이 되거나 최고 정점인 '입추'가 됩니다."
                    },
                    {
                      num: 4,
                      title: "사주 전체 배합을 통한 입춘/입추 최종 확정",
                      desc: "두 개의 후보 연도 중 어느 해가 입춘이 되고 어느 해가 입추가 될지를 최종적으로 결정하는 것은 나머지 사주 글자 전체의 배합을 분석하여 가늠합니다.",
                      note: "* 본 프로그램은 디폴트로 일간과 월지의 조합을 입춘으로 설정하나, 살아온 인생을 돌이켜보고 기점을 직접 변경하실 수 있습니다."
                    },
                    {
                      num: 5,
                      title: "실제 캘린더 연도와 매칭",
                      desc: "최종 확정된 입춘과 입추의 간지를 실제 60갑자 연도(예: 1997년 정축년, 2027년 정미년)에 대입하여, 그 사람의 운명의 사계절 스케줄을 시간순으로 나열하고 출력합니다."
                    }
                  ].map((item) => (
                    <section key={item.num} className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100/50">
                      <div className="flex items-start gap-6">
                        <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white border border-gray-200 text-blue-600 text-lg font-bold flex items-center justify-center shadow-sm">
                          {item.num}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                          <p className="text-gray-500 mb-4 leading-relaxed">{item.desc}</p>
                          {item.example && <p className="text-xs text-gray-400 bg-white/80 px-4 py-2 rounded-xl inline-block border border-gray-100">{item.example}</p>}
                          {item.note && <p className="text-xs text-blue-500/70 mt-4 font-medium">{item.note}</p>}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
                
                <button 
                  onClick={() => setCurrentPage('input')}
                  className="w-full mt-12 py-5 bg-gray-900 text-white rounded-3xl font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200"
                >
                  정보 입력하러 가기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-gray-100 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <ShieldCheck size={14} />
          <p className="text-[11px] font-medium leading-relaxed">
            본 사이트는 개인의 정보를 사이트에 저장하지 않습니다.<br />
            사이트 이용 후 결과물은 PDF로 제공해 드립니다. 그러나 PDF는 본 사이트에 저장되지 않습니다.
          </p>
        </div>
        <div className="text-gray-400 text-[10px] uppercase tracking-widest">
          <p>© 2026 Hohodang Natural Cycle Analysis. All rights reserved.</p>
          <p className="mt-2 serif italic lowercase">인생은 60년을 주기로 순환하는 대자연의 흐름과 같습니다.</p>
        </div>
      </footer>
    </div>
  );
}
