'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ReportData {
  report: string;
  stats: any;
  country: string;
  timestamp: number;
}

export default function HealthReportPage() {
  const { country: rawCountry } = useParams();
  const country = decodeURIComponent(rawCountry as string);

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `health_report_${country}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setReport(JSON.parse(saved));
    }
    setLoading(false);
  }, [country]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Report Not Found</h1>
        <p className="text-gray-300 mb-6">
          No health report has been generated for <strong>{country}</strong> yet.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-semibold transition"
        >
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-400">
            Health & Wellbeing Report: {report.country}
          </h1>
        </div>

        {/* Stats Summary */}
        <div className="bg-white/5 rounded-2xl p-5 mb-8 border border-white/10">
          <h2 className="text-xl font-bold text-green-300 mb-3">Key Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Life Expectancy:</strong> {report.stats.lifeExpectancy} years
            </div>
            <div>
              <strong>Healthcare Access:</strong> {report.stats.healthcareAccess}
            </div>
            <div>
              <strong>Mental Health Index:</strong> {report.stats.mentalHealthIndex}/100
            </div>
          </div>
        </div>

        {/* Markdown Report */}
        <div className="prose prose-invert max-w-none bg-white/5 rounded-2xl p-6 border border-white/10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report.report}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Report generated on {new Date(report.timestamp).toLocaleString()} •{' '}
          <Link href="/" className="text-cyan-400 hover:underline">
            Generate another
          </Link>
        </div>
      </div>
    </div>
  );
}
