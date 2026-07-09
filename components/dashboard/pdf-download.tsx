'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Sparkles, FileText } from 'lucide-react';
import { loadBirthDetails, loadChartResponse } from '../../lib/storage';

interface PdfReportData {
  birth: ReturnType<typeof loadBirthDetails>;
  chart: {
    sunSign: string;
    moonSign: string;
    ascendant: { sign: string; degree: number };
    ayanamsa: string;
    ayanamsaValue: number;
    nakshatra: { name: string; pada: number; lord: string };
    dasha: { mahadasha: string; antardasha: string; remainingYears: number; startDate: string; endDate: string };
  };
  planets: Array<{ name: string; sign: string; house: number; degree: string; retrograde: boolean }>;
  houses: Array<{ house: number; sign: string }>;
  aiSummary: string;
  generatedAt: string;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function generatePdfContent(data: PdfReportData): string {
  const birth = data.birth!;
  const chart = data.chart;
  const date = new Date(data.generatedAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const planetsHtml = data.planets
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#fff">${p.name}${p.retrograde ? ' ℞' : ''}</td>
        <td style="padding:8px 12px;color:#D4AF37">${p.sign}</td>
        <td style="padding:8px 12px;color:#B8BCC8">${ordinal(p.house)} House</td>
        <td style="padding:8px 12px;color:#B8BCC8">${p.degree}°</td>
      </tr>
    `
    )
    .join('');

  const housesHtml = data.houses
    .map(
      (h) => `
      <tr>
        <td style="padding:6px 12px;color:#B8BCC8">${ordinal(h.house)} House</td>
        <td style="padding:6px 12px;color:#D4AF37">${h.sign}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #05060A; color: #fff; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 30px; }
  .logo { font-size: 24px; font-weight: 800; letter-spacing: 0.3em; color: #D4AF37; margin-bottom: 8px; }
  .name { font-size: 36px; font-weight: 700; margin-bottom: 6px; }
  .subtitle { color: #B8BCC8; font-size: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; }
  .card-title { font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #D4AF37; margin-bottom: 12px; }
  .section { margin: 30px 0; }
  .section-title { font-size: 14px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #D4AF37; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) { background: rgba(255,255,255,0.02); }
  .ai-summary { background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.2); border-radius: 16px; padding: 20px; margin: 30px 0; }
  .ai-summary p { line-height: 1.7; color: #B8BCC8; font-size: 14px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #B8BCC8; font-size: 11px; }
  .stat-value { font-size: 22px; font-weight: 700; }
  .stat-label { font-size: 11px; color: #B8BCC8; margin-top: 2px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">✦ ASTRA</div>
    <div class="name">${birth.name}</div>
    <div class="subtitle">
      Born ${birth.date}${birth.knownTime && birth.time ? ' · ' + birth.time : ''} · ${birth.displayPlace ?? birth.place}<br/>
      ${chart.ayanamsa} (${chart.ayanamsaValue.toFixed(4)}°) · Generated ${date}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Sun Sign</div>
      <div class="stat-value" style="color:#F59E0B">${chart.sunSign}</div>
    </div>
    <div class="card">
      <div class="card-title">Moon Sign</div>
      <div class="stat-value" style="color:#93C5FD">${chart.moonSign}</div>
      <div class="stat-label">${chart.nakshatra.name} Nakshatra, Pada ${chart.nakshatra.pada}</div>
    </div>
    <div class="card">
      <div class="card-title">Ascendant (Lagna)</div>
      <div class="stat-value" style="color:#D4AF37">${chart.ascendant.sign}</div>
      <div class="stat-label">${chart.ascendant.degree.toFixed(1)}° Rising</div>
    </div>
    <div class="card">
      <div class="card-title">Current Mahadasha</div>
      <div class="stat-value" style="color:#34D399">${chart.dasha.mahadasha}</div>
      <div class="stat-label">${chart.dasha.antardasha} Antardasha · ${chart.dasha.remainingYears.toFixed(1)} yrs remaining</div>
    </div>
  </div>

  <div class="ai-summary">
    <div class="card-title">✦ AI Cosmic Summary</div>
    <p>${data.aiSummary}</p>
  </div>

  <div class="section">
    <div class="section-title">Planetary Positions</div>
    <table>
      <thead>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
          <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#B8BCC8">Planet</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#B8BCC8">Sign</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#B8BCC8">House</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#B8BCC8">Degree</th>
        </tr>
      </thead>
      <tbody>${planetsHtml}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">House Signs</div>
    <table>
      <tbody>${housesHtml}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Nakshatra</div>
    <div class="card">
      <div style="font-size:18px;font-weight:700;color:#D4AF37;margin-bottom:6px">${chart.nakshatra.name}</div>
      <div style="color:#B8BCC8;font-size:13px">Pada ${chart.nakshatra.pada} · Lord: ${chart.nakshatra.lord}</div>
    </div>
  </div>

  <div class="footer">
    Generated by ASTRA · astra.app · This report presents Vedic astrology as interpretive guidance, not prediction.
  </div>
</body>
</html>
  `;
}

export function PdfDownloadButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const birth = loadBirthDetails();
      const chart = loadChartResponse();

      if (!birth || !chart) {
        setError('Generate your birth chart first.');
        setLoading(false);
        return;
      }

      // Fetch PDF data from API
      const res = await fetch('/api/pdf-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth, chart }),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const data: PdfReportData = await res.json();

      // Generate HTML content
      const htmlContent = generatePdfContent({ ...data, birth });

      // Create printable window
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2.5 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:opacity-60"
      >
        {loading ? (
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={16} />
          </motion.span>
        ) : (
          <FileText size={16} />
        )}
        {loading ? 'Generating Report…' : 'Download Birth Report (PDF)'}
        {!loading && <Download size={14} className="opacity-60" />}
      </motion.button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-[10px] text-[#B8BCC8]/50">Opens a print dialog — Save as PDF</p>
    </div>
  );
}
