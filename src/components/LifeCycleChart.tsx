import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SEASONS, MAJOR_SEASONS } from '../lib/saju';

interface Props {
  ipchunYear: number;
  currentYear: number;
  birthYear: number;
}

// 계절 국면: 차트 각도 기준 (입춘=180°에서 시계방향으로 15년씩)
const QUADRANTS = [
  { name: '봄', start: 180, fill: '#22c55e', label: '#15803d' },
  { name: '여름', start: 270, fill: '#f97316', label: '#c2410c' },
  { name: '가을', start: 0, fill: '#eab308', label: '#a16207' },
  { name: '겨울', start: 90, fill: '#3b82f6', label: '#1e40af' },
];

// 계절이 시작되는 절기 → 해당 국면 인덱스
const SEASON_START_IDX: Record<string, number> = { '입춘': 0, '입하': 1, '입추': 2, '입동': 3 };

const toRad = (a: number) => (a - 90) * (Math.PI / 180);

const LifeCycleChart: React.FC<Props> = ({ ipchunYear, currentYear, birthYear }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 45;
    const innerRadius = radius - 50;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // ── 1. 계절 4국면 배경 (반투명 색상) ──
    QUADRANTS.forEach((q) => {
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle((q.start * Math.PI) / 180)
        .endAngle(((q.start + 90) * Math.PI) / 180);
      g.append('path')
        .attr('d', arc as any)
        .attr('fill', q.fill)
        .attr('opacity', 0.10);
    });

    // ── 2. 시계 눈금: 60년 = 60눈금 (5년마다 중간, 15년(계절 경계)마다 굵게) ──
    for (let i = 0; i < 60; i++) {
      const a = toRad(180 + i * 6);
      const isBoundary = i % 15 === 0;
      const isFive = i % 5 === 0;
      const r1 = radius - (isBoundary ? 13 : isFive ? 9 : 5);
      g.append('line')
        .attr('x1', Math.cos(a) * r1)
        .attr('y1', Math.sin(a) * r1)
        .attr('x2', Math.cos(a) * radius)
        .attr('y2', Math.sin(a) * radius)
        .attr('stroke', isBoundary ? '#64748b' : isFive ? '#94a3b8' : '#cbd5e1')
        .attr('stroke-width', isBoundary ? 2.5 : isFive ? 1.5 : 1);
    }

    // ── 3. 시계판 링 ──
    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 2);

    g.append('circle')
      .attr('r', innerRadius)
      .attr('fill', 'none')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    // ── 4. 절기 라벨 + 연도 ──
    SEASONS.forEach((s) => {
      const angleRad = toRad(s.angle);

      const textX = Math.cos(angleRad) * (radius + 22);
      const textY = Math.sin(angleRad) * (radius + 22);

      const startIdx = SEASON_START_IDX[s.name];
      const isSeasonStart = startIdx !== undefined;
      const isMajor = MAJOR_SEASONS.includes(s.name);

      g.append('text')
        .attr('x', textX)
        .attr('y', textY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', isSeasonStart ? '17px' : isMajor ? '15px' : '11px')
        .attr('font-weight', isSeasonStart ? '800' : isMajor ? '700' : '400')
        .attr('fill', isSeasonStart ? QUADRANTS[startIdx].label : isMajor ? '#ef4444' : '#9ca3af')
        .text(s.name);

      // 해당 절기의 연도 표시 — 출생 연도부터 100세까지 살아있는 기간만
      const yearsFromIpchun = (s.angle - 180 < 0 ? s.angle + 180 : s.angle - 180) / 360 * 60;
      const baseYear = Math.floor(ipchunYear + yearsFromIpchun);
      const lifeYears: number[] = [];
      for (let k = 0; k < 4; k++) {
        const y = baseYear + k * 60;
        if (y >= birthYear && y <= birthYear + 100) lifeYears.push(y);
      }

      const yearRadius = innerRadius - 22;
      const yearX = Math.cos(angleRad) * yearRadius;
      const yearY = Math.sin(angleRad) * yearRadius;

      const yearText = g.append('text')
        .attr('x', yearX)
        .attr('y', yearY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('fill', '#94a3b8')
        .style('paint-order', 'stroke')
        .style('stroke', '#fff')
        .style('stroke-width', '4px');

      lifeYears.forEach((y, i) => {
        yearText.append('tspan')
          .attr('x', yearX)
          .attr('dy', i === 0 ? (lifeYears.length === 1 ? '0' : '-0.6em') : '1.2em')
          .text(y);
      });
    });

    // ── 5. 계절 이름 (국면 중앙, 큰 라벨) ──
    QUADRANTS.forEach((q) => {
      const a = toRad(q.start + 45);
      const r = 100;
      g.append('text')
        .attr('x', Math.cos(a) * r)
        .attr('y', Math.sin(a) * r)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '19px')
        .attr('font-weight', '800')
        .attr('fill', q.label)
        .style('paint-order', 'stroke')
        .style('stroke', '#fff')
        .style('stroke-width', '5px')
        .text(`${q.name}`);
    });

    // ── 6. 시곗바늘 (흰 중심판 아래에 그려 중앙 텍스트를 가리지 않음) ──
    const yearsSinceIpchun = (currentYear - ipchunYear) % 60;
    const normalizedYears = yearsSinceIpchun < 0 ? yearsSinceIpchun + 60 : yearsSinceIpchun;
    const currentAngle = (normalizedYears / 60) * 360 + 180;
    const currentRad = toRad(currentAngle);

    const birthYearsSinceIpchun = (birthYear - ipchunYear) % 60;
    const normalizedBirthYears = birthYearsSinceIpchun < 0 ? birthYearsSinceIpchun + 60 : birthYearsSinceIpchun;
    const birthAngle = (normalizedBirthYears / 60) * 360 + 180;
    const birthRad = toRad(birthAngle);

    const birthTip = 122;
    const currentTip = 160;

    // ── 7. 흰 시계 중심판 ──
    g.append('circle')
      .attr('r', 72)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.94)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1.5);



    // ── 8. 바늘 끝 마커 + 라벨 ──
    // 출생점
    g.append('circle')
      .attr('cx', Math.cos(birthRad) * birthTip)
      .attr('cy', Math.sin(birthRad) * birthTip)
      .attr('r', 5)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', Math.cos(birthRad) * birthTip)
      .attr('y', Math.sin(birthRad) * birthTip + 17)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#059669')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', '3px')
      .text(`${birthYear}년생`);

    // 현재점
    g.append('circle')
      .attr('cx', Math.cos(currentRad) * currentTip)
      .attr('cy', Math.sin(currentRad) * currentTip)
      .attr('r', 8)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0px 0px 4px rgba(0,0,0,0.25))');

    g.append('text')
      .attr('x', Math.cos(currentRad) * currentTip)
      .attr('y', Math.sin(currentRad) * currentTip - 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#b45309')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', '3px')
      .text(`현재 (${currentYear}년)`);

    // ── 9. 중앙: 현재 계절만 크게 ──
    const qIdx = Math.floor(normalizedYears / 15) % 4;
    const cur = QUADRANTS[qIdx];

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', 2)
      .attr('font-size', '34px')
      .attr('font-weight', '800')
      .attr('fill', cur.label)
      .text(`${cur.name}`);

    // ── 10. 시곗바늘 (항상 최전면) ──
    // 출생 바늘 (짧은 초록)
    g.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', Math.cos(birthRad) * birthTip)
      .attr('y2', Math.sin(birthRad) * birthTip)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.85);

    // 현재 바늘 (긴 주황)
    g.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', Math.cos(currentRad) * currentTip)
      .attr('y2', Math.sin(currentRad) * currentTip)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 5)
      .attr('stroke-linecap', 'round');

    // 중심축 핀
    g.append('circle').attr('r', 5.5).attr('fill', '#1f2937');
    g.append('circle').attr('r', 2).attr('fill', '#ffffff');

  }, [ipchunYear, currentYear, birthYear]);

  return (
    <div className="flex justify-center items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
      <svg ref={svgRef} width="500" height="500" viewBox="0 0 500 500" className="max-w-full h-auto" />
    </div>
  );
};

export default LifeCycleChart;
