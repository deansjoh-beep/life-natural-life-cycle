import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SEASONS, MAJOR_SEASONS } from '../lib/saju';

interface Props {
  ipchunYear: number;
  currentYear: number;
  birthYear: number;
}

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

    // 배경 원
    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#f3f4f6')
      .attr('stroke-width', 1);

    g.append('circle')
      .attr('r', innerRadius)
      .attr('fill', 'none')
      .attr('stroke', '#f3f4f6')
      .attr('stroke-width', 1);

    // 계절 선 및 텍스트
    SEASONS.forEach((s) => {
      const angleRad = (s.angle - 90) * (Math.PI / 180);
      const x2 = Math.cos(angleRad) * radius;
      const y2 = Math.sin(angleRad) * radius;

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#f1f5f9')
        .attr('stroke-dasharray', '2,2');

      const textX = Math.cos(angleRad) * (radius + 22);
      const textY = Math.sin(angleRad) * (radius + 22);

      const isMajor = MAJOR_SEASONS.includes(s.name);
      
      g.append('text')
        .attr('x', textX)
        .attr('y', textY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', isMajor ? '13px' : '10px')
        .attr('font-weight', isMajor ? '700' : '400')
        .attr('fill', isMajor ? '#ef4444' : '#9ca3af')
        .text(s.name);
        
      // 해당 계절의 연도 표시
      const yearsFromIpchun = (s.angle - 180 < 0 ? s.angle + 180 : s.angle - 180) / 360 * 60;
      const seasonYear1 = Math.floor(ipchunYear + yearsFromIpchun);
      const seasonYear2 = seasonYear1 + 60;
      
      const yearRadius = innerRadius - 22;
      const yearX = Math.cos(angleRad) * yearRadius;
      const yearY = Math.sin(angleRad) * yearRadius;
      
      const yearText = g.append('text')
        .attr('x', yearX)
        .attr('y', yearY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '500')
        .attr('fill', '#94a3b8')
        .style('paint-order', 'stroke')
        .style('stroke', '#fff')
        .style('stroke-width', '4px');

      yearText.append('tspan')
        .attr('x', yearX)
        .attr('dy', '-0.6em')
        .text(seasonYear1);

      yearText.append('tspan')
        .attr('x', yearX)
        .attr('dy', '1.2em')
        .text(seasonYear2);
    });

    // 현재 위치 표시 (화살표 또는 점)
    const yearsSinceIpchun = (currentYear - ipchunYear) % 60;
    const normalizedYears = yearsSinceIpchun < 0 ? yearsSinceIpchun + 60 : yearsSinceIpchun;
    const currentAngle = (normalizedYears / 60) * 360 + 180;
    const currentRad = (currentAngle - 90) * (Math.PI / 180);
    
    const pointerX = Math.cos(currentRad) * (radius + innerRadius) / 2;
    const pointerY = Math.sin(currentRad) * (radius + innerRadius) / 2;

    // 현재 위치 점
    g.append('circle')
      .attr('cx', pointerX)
      .attr('cy', pointerY)
      .attr('r', 8)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 0px 4px rgba(0,0,0,0.2))');

    g.append('text')
      .attr('x', pointerX)
      .attr('y', pointerY - 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#b45309')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', '3px')
      .text(`현재 (${currentYear}년)`);

    // 태어난 시점 표시
    const birthYearsSinceIpchun = (birthYear - ipchunYear) % 60;
    const normalizedBirthYears = birthYearsSinceIpchun < 0 ? birthYearsSinceIpchun + 60 : birthYearsSinceIpchun;
    const birthAngle = (normalizedBirthYears / 60) * 360 + 180;
    const birthRad = (birthAngle - 90) * (Math.PI / 180);
    
    const birthX = Math.cos(birthRad) * (radius + innerRadius) / 2;
    const birthY = Math.sin(birthRad) * (radius + innerRadius) / 2;

    g.append('circle')
      .attr('cx', birthX)
      .attr('cy', birthY)
      .attr('r', 4)
      .attr('fill', '#10b981');

    g.append('text')
      .attr('x', birthX)
      .attr('y', birthY + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#059669')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', '3px')
      .text(`${birthYear}년생`);

    // 중앙 텍스트
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -10)
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text('인생의 사계절');
      
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 20)
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text('120년 인생 주기');

  }, [ipchunYear, currentYear, birthYear]);

  return (
    <div className="flex justify-center items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
      <svg ref={svgRef} width="500" height="500" viewBox="0 0 500 500" className="max-w-full h-auto" />
    </div>
  );
};

export default LifeCycleChart;
