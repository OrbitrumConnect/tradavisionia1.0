import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export const useScreenshot = () => {
  const takeScreenshot = useCallback(async (elementId: string): Promise<string | null> => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#0A0A0A',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return null;
    }
  }, []);

  const showScreenshotPreview = useCallback(async (elementId: string): Promise<string | null> => {
    const dataUrl = await takeScreenshot(elementId);
    if (dataUrl) {
      // Create modal overlay to show screenshot
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        cursor: pointer;
      `;
      
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      `;
      
      const closeText = document.createElement('div');
      closeText.textContent = 'Clique para fechar ou arraste a imagem';
      closeText.style.cssText = `
        position: absolute;
        top: 20px;
        color: white;
        font-size: 16px;
        background: rgba(0,0,0,0.7);
        padding: 10px 20px;
        border-radius: 4px;
      `;
      
      overlay.appendChild(closeText);
      overlay.appendChild(img);
      document.body.appendChild(overlay);
      
      // Add drag functionality
      img.draggable = true;
      img.ondragstart = (e) => {
        e.dataTransfer?.setData('text/plain', dataUrl);
      };
      
      // Close on click
      overlay.onclick = () => {
        document.body.removeChild(overlay);
      };
      
      return dataUrl;
    }
    return null;
  }, [takeScreenshot]);

  const downloadScreenshot = useCallback(async (elementId: string, filename: string = 'chart-analysis') => {
    const dataUrl = await takeScreenshot(elementId);
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${filename}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [takeScreenshot]);

  return {
    takeScreenshot,
    showScreenshotPreview,
    downloadScreenshot
  };
};