import { useState, useCallback, type RefObject } from 'react';
import type { HealthCheckResponse } from '@/types/api';
import { copyToClipboard } from '@/lib/clipboard';

export function useShareCard(
  cardRef: RefObject<HTMLDivElement | null>,
  data: HealthCheckResponse | null,
) {
  const [generating, setGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const generatePng = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0b',
      });
      return new Promise<Blob | null>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
      });
    } finally {
      setGenerating(false);
    }
  }, [cardRef]);

  const shareUrl = data
    ? `https://slashr.dev/check?address=${encodeURIComponent(data.address)}`
    : '';

  const share = useCallback(async () => {
    if (!data) return;
    const blob = await generatePng();

    if (navigator.share && blob) {
      try {
        const file = new File([blob], 'slashr-health-check.png', { type: 'image/png' });
        const shareData: ShareData = {
          title: `Staking Health: ${data.portfolio.grade}`,
          text: `My staking portfolio scored ${data.portfolio.grade}. Check yours at slashr.dev/check`,
          url: shareUrl,
        };
        if (navigator.canShare?.({ ...shareData, files: [file] })) {
          (shareData as ShareData & { files: File[] }).files = [file];
        }
        await navigator.share(shareData);
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }

    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'slashr-health-check.png';
      a.click();
      URL.revokeObjectURL(blobUrl);
      showToast('Card downloaded');
    }
  }, [data, generatePng, shareUrl, showToast]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    const ok = await copyToClipboard(shareUrl);
    showToast(ok ? 'Copied!' : 'Copy failed');
  }, [shareUrl, showToast]);

  return { share, copyLink, generating, toastMessage };
}
