import React from 'react';
import { CppAnalytics } from '../types';

interface PriceChartProps {
  history: { timestamp: number; price: number }[];
  currency: string;
  analytics?: CppAnalytics;
  targetPrice?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  history,
  currency,
  analytics,
  targetPrice,
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No price history recorded yet.
      </div>
    );
  }

  // Find min/max bounds
  const rawPrices = history.map((h) => h.price);
  if (targetPrice) rawPrices.push(targetPrice);
  if (analytics?.bollinger_upper) rawPrices.push(analytics.bollinger_upper);
  if (analytics?.bollinger_lower) rawPrices.push(analytics.bollinger_lower);

  const minP = Math.min(...rawPrices) * 0.96;
  const maxP = Math.max(...rawPrices) * 1.04;
  const range = maxP - minP || 1.0;

  const width = 640;
  const height = 180;
  const padX = 40;
  const padY = 25;

  const getX = (idx: number, total: number) => {
    if (total <= 1) return padX + (width - padX * 2) / 2;
    return padX + (idx / (total - 1)) * (width - padX * 2);
  };

  const getY = (val: number) => {
    return height - padY - ((val - minP) / range) * (height - padY * 2);
  };

  // Generate SVG points
  const points = history.map((pt, i) => `${getX(i, history.length)},${getY(pt.price)}`).join(' ');

  // Target price Y
  const targetY = targetPrice ? getY(targetPrice) : null;
  // SMA Y
  const smaY = analytics?.sma ? getY(analytics.sma) : null;
  // Bollinger Upper & Lower
  const bollUpperY = analytics?.bollinger_upper ? getY(analytics.bollinger_upper) : null;
  const bollLowerY = analytics?.bollinger_lower ? getY(analytics.bollinger_lower) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-slate-900 inline-block rounded" />
            <span>Price Track</span>
          </span>
          {analytics?.sma && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-sky-500 inline-block rounded" />
              <span>C++ SMA ({currency}{analytics.sma.toFixed(2)})</span>
            </span>
          )}
          {bollUpperY && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-purple-400 border-t border-dashed inline-block" />
              <span>Bollinger Envelope (2σ)</span>
            </span>
          )}
          {targetPrice && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-500 inline-block border-t border-dotted" />
              <span>Target ({currency}{targetPrice.toFixed(2)})</span>
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          Range: {currency}{minP.toFixed(2)} - {currency}{maxP.toFixed(2)}
        </span>
      </div>

      <div className="relative bg-slate-900 rounded-lg p-2 overflow-hidden shadow-inner">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 overflow-visible"
        >
          {/* Horizontal grid lines */}
          <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

          {/* Bollinger Upper & Lower bands */}
          {bollUpperY && bollLowerY && (
            <>
              <line
                x1={padX}
                y1={bollUpperY}
                x2={width - padX}
                y2={bollUpperY}
                stroke="#c084fc"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <line
                x1={padX}
                y1={bollLowerY}
                x2={width - padX}
                y2={bollLowerY}
                stroke="#c084fc"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            </>
          )}

          {/* Target Price Line */}
          {targetY !== null && (
            <line
              x1={padX}
              y1={targetY}
              x2={width - padX}
              y2={targetY}
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          )}

          {/* SMA line */}
          {smaY !== null && (
            <line
              x1={padX}
              y1={smaY}
              x2={width - padX}
              y2={smaY}
              stroke="#0ea5e9"
              strokeWidth="1.2"
              opacity="0.8"
            />
          )}

          {/* Primary Price Path */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Dots on points */}
          {history.map((pt, i) => {
            const cx = getX(i, history.length);
            const cy = getY(pt.price);
            const isLast = i === history.length - 1;
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLast ? 4.5 : 3}
                  fill={isLast ? '#fbbf24' : '#f59e0b'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                {isLast && (
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {currency}{pt.price.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
