import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

interface FloatingCard {
  id: string;
  imageData: string;
  x: number;
  y: number;
}

export const useDragDropScreenshot = () => {
  const [floatingCard, setFloatingCard] = useState<FloatingCard | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const floatingElementRef = useRef<HTMLImageElement | null>(null);

  const captureAndCreateFloatingCard = useCallback(async (elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) return;

      // Capture screenshot
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 0.5, // Reduce size for floating card
        backgroundColor: null
      });
      
      const imageData = canvas.toDataURL('image/png');
      
      // Create floating card at mouse position
      const cardId = Date.now().toString();
      setFloatingCard({
        id: cardId,
        imageData,
        x: 0,
        y: 0
      });

      // Create draggable card - SEM mousemove para não interferir com drag nativo
      const card = document.createElement('img');
      card.src = imageData;
      card.draggable = true;
      card.style.cssText = `
        position: fixed;
        width: 120px;
        height: 80px;
        z-index: 9999;
        border: 2px solid hsl(var(--primary));
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        cursor: grab;
        opacity: 0.9;
        pointer-events: auto;
        left: 50%;
        top: 20%;
        transform: translateX(-50%);
        animation: fadeIn 0.3s ease-out;
      `;
      
      floatingElementRef.current = card;
      document.body.appendChild(card);

      console.log('Floating card created - ready for native drag');

      // APENAS drag nativo - sem mousemove
      card.ondragstart = (e) => {
        console.log('🚀 Native drag started');
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', imageData);
          e.dataTransfer.effectAllowed = 'copy';
        }
        card.style.cursor = 'grabbing';
        card.style.opacity = '0.5';
      };

      card.ondragend = (e) => {
        console.log('🏁 Native drag ended');
        // Remove card após drag
        if (card.parentNode) {
          card.remove();
        }
        setFloatingCard(null);
        floatingElementRef.current = null;
      };

      // Click para remover se não quiser arrastar
      card.onclick = (e) => {
        e.preventDefault();
        console.log('❌ Card removido por click');
        if (card.parentNode) {
          card.remove();
        }
        setFloatingCard(null);
        floatingElementRef.current = null;
      };

      // Auto-remove após 10 segundos se não usar
      setTimeout(() => {
        if (card.parentNode) {
          console.log('⏰ Card removido por timeout');
          card.remove();
          setFloatingCard(null);
          floatingElementRef.current = null;
        }
      }, 10000);

      return imageData;
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  }, []);

  const handleDropAnalysis = useCallback(async (e: React.DragEvent, onAnalysisComplete?: (result: any) => void) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('HandleDropAnalysis called');
    
    // Pega base64 do drag nativo
    const imageData = e.dataTransfer.getData('text/plain');
    console.log('Imagem recebida:', imageData ? 'Base64 image data' : 'No data');
    
    if (imageData) {
      setIsAnalyzing(true);
      
      // Simulate AI analysis
      setTimeout(() => {
        const result = {
          timestamp: new Date().toLocaleTimeString(),
          type: Math.random() > 0.5 ? 'BUY' : 'SELL',
          probability: Math.floor(Math.random() * 30) + 70,
          pattern: 'Screenshot Analysis: ' + ['Sweep detectado', 'Confluência confirmada', 'Breakout identificado'][Math.floor(Math.random() * 3)],
          confidence: 'Alta',
          imageAnalyzed: true
        };
        
        setIsAnalyzing(false);
        onAnalysisComplete?.(result);
      }, 2500);
    }
  }, []);

  const removeFloatingCard = useCallback(() => {
    if (floatingElementRef.current) {
      floatingElementRef.current.remove();
      setFloatingCard(null);
      floatingElementRef.current = null;
    }
  }, []);

  return {
    captureAndCreateFloatingCard,
    handleDropAnalysis,
    removeFloatingCard,
    floatingCard,
    isAnalyzing
  };
};