import React from 'react';

interface SparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  width = 60,
  height = 36,
  strokeColor = 'var(--color-chart1)',
  fillColor = 'var(--color-primary)',
  strokeWidth = 1.5,
}) => {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="shrink-0" />;
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal;

  // Flat line at mid-height for all-zero, identical, or single-value series
  if (range === 0 || data.length === 1) {
    const midY = height / 2;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0 overflow-visible"
      >
        <line
          x1={2}
          y1={midY}
          x2={width - 2}
          y2={midY}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const paddingY = 4;
  const usableHeight = height - paddingY * 2;
  const stepX = (width - 4) / (data.length - 1);

  const points = data.map((val, index) => {
    const x = 2 + index * stepX;
    const y = height - paddingY - ((val - minVal) / range) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const gradId = `spark-grad-${strokeColor.replace(/[^a-zA-Z0-9]/g, '')}`;
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#${gradId})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
