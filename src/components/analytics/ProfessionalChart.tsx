import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Wifi, 
  WifiOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ProfessionalChartProps {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  currentPrice?: number;
  trades?: Array<{
    type: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    timestamp: string;
  }>;
  onDataCapture?: (data: any) => void;
}

export const ProfessionalChart: React.FC<ProfessionalChartProps> = ({
  symbol,
  timeframe,
  candles,
  currentPrice,
  trades = [],
  onDataCapture
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados para zoom e navegação
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Estados para navegação com mouse
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, pan: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);

  // Configurações do gráfico
  const chartConfig = {
    padding: { top: 20, right: 50, bottom: 60, left: 80 },
    candleWidth: 8,
    wickWidth: 1,
    futureSpace: 150, // Espaço para o futuro (em pixels)
    colors: {
      bullish: '#10b981',
      bearish: '#ef4444',
      grid: '#374151',
      text: '#9ca3af',
      background: '#1f2937',
      futureArea: '#1e293b', // Cor mais escura para área futura
      futureGrid: '#475569' // Grid mais claro para área futura
    }
  };

  // Calcular dimensões
  const getChartDimensions = () => {
    if (!containerRef.current) return { width: 800, height: 400 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  };

  // Desenhar grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, priceRange: { min: number; max: number }) => {
    // Área futura (mais escura)
    const chartAreaWidth = width - chartConfig.padding.left - chartConfig.padding.right;
    const futureAreaStart = chartConfig.padding.left + chartAreaWidth - chartConfig.futureSpace;
    
    ctx.fillStyle = chartConfig.colors.futureArea;
    ctx.fillRect(futureAreaStart, chartConfig.padding.top, chartConfig.futureSpace, height - chartConfig.padding.top - chartConfig.padding.bottom);
    
    // Linhas horizontais (preços) - Área principal
    ctx.strokeStyle = chartConfig.colors.grid;
    ctx.lineWidth = 0.5;
    const priceSteps = 8;
    for (let i = 0; i <= priceSteps; i++) {
      const y = chartConfig.padding.top + (height - chartConfig.padding.top - chartConfig.padding.bottom) * (i / priceSteps);
      ctx.beginPath();
      ctx.moveTo(chartConfig.padding.left, y);
      ctx.lineTo(width - chartConfig.padding.right, y);
      ctx.stroke();
      
      // Labels de preço
      const price = priceRange.max - (priceRange.max - priceRange.min) * (i / priceSteps);
      ctx.fillStyle = chartConfig.colors.text;
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toFixed(2)}`, chartConfig.padding.left - 10, y + 4);
    }
    
    // Linhas verticais (tempo) - Área principal
    const timeSteps = 10;
    for (let i = 0; i <= timeSteps; i++) {
      const x = chartConfig.padding.left + (chartAreaWidth - chartConfig.futureSpace) * (i / timeSteps);
      ctx.beginPath();
      ctx.moveTo(x, chartConfig.padding.top);
      ctx.lineTo(x, height - chartConfig.padding.bottom);
      ctx.stroke();
    }
    
    // Linha divisória entre presente e futuro
    ctx.strokeStyle = chartConfig.colors.futureGrid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(futureAreaStart, chartConfig.padding.top);
    ctx.lineTo(futureAreaStart, height - chartConfig.padding.bottom);
    ctx.stroke();
    
    // Grid futuro (mais claro)
    ctx.strokeStyle = chartConfig.colors.futureGrid;
    ctx.lineWidth = 0.3;
    const futureTimeSteps = 3;
    for (let i = 1; i <= futureTimeSteps; i++) {
      const x = futureAreaStart + (chartConfig.futureSpace * i / futureTimeSteps);
      ctx.beginPath();
      ctx.moveTo(x, chartConfig.padding.top);
      ctx.lineTo(x, height - chartConfig.padding.bottom);
      ctx.stroke();
    }
    
    // Label "FUTURO"
    ctx.fillStyle = chartConfig.colors.futureGrid;
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('FUTURO', futureAreaStart + chartConfig.futureSpace / 2, chartConfig.padding.top + 15);
  };

  // Desenhar vela
  const drawCandle = (
    ctx: CanvasRenderingContext2D,
    candle: CandleData,
    x: number,
    y: number,
    width: number,
    height: number,
    priceRange: { min: number; max: number }
  ) => {
    const isBullish = candle.close >= candle.open;
    const color = isBullish ? chartConfig.colors.bullish : chartConfig.colors.bearish;
    
    ctx.strokeStyle = color;
    ctx.fillStyle = isBullish ? color : 'transparent';
    ctx.lineWidth = chartConfig.wickWidth;
    
    // Corpo da vela
    const bodyTop = Math.min(candle.open, candle.close);
    const bodyBottom = Math.max(candle.open, candle.close);
    const bodyY = chartConfig.padding.top + (priceRange.max - bodyTop) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
    const bodyHeight = (bodyTop - bodyBottom) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
    
    ctx.fillRect(x - width/2, bodyY, width, Math.max(1, Math.abs(bodyHeight)));
    ctx.strokeRect(x - width/2, bodyY, width, Math.max(1, Math.abs(bodyHeight)));
    
    // Pavios
    const highY = chartConfig.padding.top + (priceRange.max - candle.high) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
    const lowY = chartConfig.padding.top + (priceRange.max - candle.low) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
    
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, bodyY);
    ctx.moveTo(x, bodyY + Math.abs(bodyHeight));
    ctx.lineTo(x, lowY);
    ctx.stroke();
  };

  // Desenhar trades
  const drawTrades = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    priceRange: { min: number; max: number }
  ) => {
    const chartAreaWidth = width - chartConfig.padding.left - chartConfig.padding.right;
    const futureAreaStart = chartConfig.padding.left + chartAreaWidth - chartConfig.futureSpace;
    
    trades.forEach(trade => {
      const priceY = chartConfig.padding.top + (priceRange.max - trade.entryPrice) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
      
      // Linha de entrada (até área futura)
      ctx.strokeStyle = trade.type === 'BUY' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(chartConfig.padding.left, priceY);
      ctx.lineTo(futureAreaStart, priceY);
      ctx.stroke();
      
      // Projeção futura da entrada (pontilhada mais clara)
      ctx.strokeStyle = trade.type === 'BUY' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(futureAreaStart, priceY);
      ctx.lineTo(width - chartConfig.padding.right, priceY);
      ctx.stroke();
      
      // Linha de stop loss
      const slY = chartConfig.padding.top + (priceRange.max - trade.stopLoss) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(chartConfig.padding.left, slY);
      ctx.lineTo(futureAreaStart, slY);
      ctx.stroke();
      
      // Projeção futura do stop loss
      ctx.setLineDash([1, 6]);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(futureAreaStart, slY);
      ctx.lineTo(width - chartConfig.padding.right, slY);
      ctx.stroke();
      
      // Linha de take profit
      const tpY = chartConfig.padding.top + (priceRange.max - trade.takeProfit) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(chartConfig.padding.left, tpY);
      ctx.lineTo(futureAreaStart, tpY);
      ctx.stroke();
      
      // Projeção futura do take profit
      ctx.setLineDash([1, 6]);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(futureAreaStart, tpY);
      ctx.lineTo(width - chartConfig.padding.right, tpY);
      ctx.stroke();
      
      // Reset styles
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });
  };

  // Desenhar gráfico
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = getChartDimensions();
    canvas.width = width;
    canvas.height = height;
    
    // Limpar canvas
    ctx.fillStyle = chartConfig.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Calcular range de preços
    const prices = candles.flatMap(c => [c.high, c.low, c.open, c.close]);
    const priceRange = {
      min: Math.min(...prices) * 0.999,
      max: Math.max(...prices) * 1.001
    };
    
    // Desenhar grid
    drawGrid(ctx, width, height, priceRange);
    
    // Calcular quantas velas mostrar (baseado no zoom e área futura)
    const chartAreaWidth = width - chartConfig.padding.left - chartConfig.padding.right;
    const availableWidth = chartAreaWidth - chartConfig.futureSpace;
    const visibleCandles = Math.floor(availableWidth / (chartConfig.candleWidth * zoom));
    const startIndex = Math.max(0, candles.length - visibleCandles - pan);
    const endIndex = Math.min(candles.length, startIndex + visibleCandles);
    
    // Desenhar velas
    const visibleCandlesData = candles.slice(startIndex, endIndex);
    visibleCandlesData.forEach((candle, index) => {
      const x = chartConfig.padding.left + (index + 0.5) * chartConfig.candleWidth * zoom;
      drawCandle(ctx, candle, x, 0, chartConfig.candleWidth * zoom, height, priceRange);
    });
    
    // Desenhar trades
    drawTrades(ctx, width, height, priceRange);
    
    // Desenhar preço atual estendido para o futuro
    if (currentPrice) {
      const currentPriceY = chartConfig.padding.top + (priceRange.max - currentPrice) / (priceRange.max - priceRange.min) * (height - chartConfig.padding.top - chartConfig.padding.bottom);
      const futureAreaStart = chartConfig.padding.left + chartAreaWidth - chartConfig.futureSpace;
      
      // Linha do preço atual (até área futura)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(chartConfig.padding.left, currentPriceY);
      ctx.lineTo(futureAreaStart, currentPriceY);
      ctx.stroke();
      
      // Projeção futura do preço atual (pontilhada)
      ctx.setLineDash([5, 10]);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(futureAreaStart, currentPriceY);
      ctx.lineTo(width - chartConfig.padding.right, currentPriceY);
      ctx.stroke();
      
      // Label do preço atual na área futura
      ctx.fillStyle = '#fbbf24';
      ctx.font = '11px Inter';
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      ctx.fillText(`$${currentPrice.toFixed(2)}`, futureAreaStart + 10, currentPriceY - 5);
      
      // Reset styles
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    
    // Desenhar preço atual se hover
    if (hoveredCandle) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(chartConfig.padding.left, chartConfig.padding.top, width - chartConfig.padding.left - chartConfig.padding.right, height - chartConfig.padding.top - chartConfig.padding.bottom);
      
      // Tooltip
      const tooltipX = Math.min(mousePosition.x + 10, width - 200);
      const tooltipY = Math.max(10, mousePosition.y - 80);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(tooltipX, tooltipY, 180, 70);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`O: $${hoveredCandle.open.toFixed(2)}`, tooltipX + 10, tooltipY + 20);
      ctx.fillText(`H: $${hoveredCandle.high.toFixed(2)}`, tooltipX + 10, tooltipY + 35);
      ctx.fillText(`L: $${hoveredCandle.low.toFixed(2)}`, tooltipX + 10, tooltipY + 50);
      ctx.fillText(`C: $${hoveredCandle.close.toFixed(2)}`, tooltipX + 100, tooltipY + 20);
      ctx.fillText(`V: ${hoveredCandle.volume.toFixed(0)}`, tooltipX + 100, tooltipY + 35);
    }
  }, [candles, zoom, pan, hoveredCandle, mousePosition]);

  // Handlers de mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    // Se estiver arrastando, mover o gráfico
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const panDelta = Math.round(deltaX / (chartConfig.candleWidth * zoom));
      setPan(Math.max(0, dragStart.pan + panDelta));
      return;
    }
    
    // Encontrar vela mais próxima
    const visibleCandles = Math.floor((canvas.width - chartConfig.padding.left - chartConfig.padding.right) / (chartConfig.candleWidth * zoom));
    const startIndex = Math.max(0, candles.length - visibleCandles - pan);
    const endIndex = Math.min(candles.length, startIndex + visibleCandles);
    
    const candleIndex = Math.floor((x - chartConfig.padding.left) / (chartConfig.candleWidth * zoom));
    if (candleIndex >= 0 && candleIndex < endIndex - startIndex) {
      setHoveredCandle(candles[startIndex + candleIndex]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    
    // Double click detection
    if (now - lastClickTime < 300) {
      // Double click - reset view
      setZoom(1);
      setPan(0);
      setLastClickTime(0);
      return;
    }
    setLastClickTime(now);
    
    // Start dragging
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, pan });
      canvasRef.current?.style.setProperty('cursor', 'grabbing');
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    canvasRef.current?.style.setProperty('cursor', 'crosshair');
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Context menu could be added here
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom com foco no mouse
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
      
      // Ajustar pan para manter o foco no mouse
      const zoomRatio = newZoom / zoom;
      const mouseCandlePos = (mouseX - chartConfig.padding.left) / (chartConfig.candleWidth * zoom);
      const newPan = Math.max(0, pan + mouseCandlePos * (1 - zoomRatio));
      
      setZoom(newZoom);
      setPan(newPan);
    } else {
      // Pan horizontal mais suave
      const panFactor = e.deltaY > 0 ? 5 : -5;
      setPan(prev => Math.max(0, prev + panFactor));
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
  };

  // Controles de zoom
  const zoomIn = () => setZoom(prev => Math.min(3, prev * 1.2));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev * 0.8));
  const resetView = () => {
    setZoom(1);
    setPan(0);
  };

  // Redesenhar quando dados mudarem
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Redimensionar canvas
  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-96'
      }`}
    >
      {/* Header com controles */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
              <Activity className="h-3 w-3 mr-1" />
              {symbol} {timeframe}
            </Badge>
            <span className="text-sm text-slate-400">
              {candles.length} velas • Zoom: {Math.round(zoom * 100)}%
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas do gráfico */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{ marginTop: '40px' }}
      />

      {/* Instruções */}
      <div className="absolute bottom-2 left-2 text-xs text-slate-500">
        🖱️ Click+Arrastar: Mover • Scroll: Navegar • Ctrl+Scroll: Zoom • Double Click: Reset • Hover: Detalhes
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-slate-400">
        📊 Área futura: {chartConfig.futureSpace}px • Velas futuras aparecerão aqui
      </div>
    </div>
  );
};

export default ProfessionalChart;
