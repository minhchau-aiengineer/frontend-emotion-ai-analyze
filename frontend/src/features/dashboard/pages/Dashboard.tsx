import { useEffect, useMemo, useState } from "react";
import { getRealAnalyticsData, deleteUploadAnalysis, deleteAudioAnalysis, deleteVisionAnalysis } from "../services/analyticsService";
import { generateMockData } from "../services/mockAnalysis";
import { trashService } from "../../trash/services/trashService";
import { enhancedLogService } from "../../log/services/enhancedLogService";
import { EmotionSummaryCard } from "../../../components/EmotionSummaryCard";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DistributionCard } from "../components/dashboard/DistributionCard";
import { TimelineCard } from "../components/dashboard/TimelineCard";
import { DetectionTable } from "../components/dashboard/DetectionTable";
import { DetectionDetailModal } from "../components/dashboard/DetectionDetailModal";
import { DashboardSkeleton } from "../components/dashboard/Skeletons";
import { Analysis, AnalysisSummary, EmotionResult } from "../../../types/emotions";
import { DashboardStyles } from "../styles/DashboardStyles";

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<{
    analysis: Analysis;
    summary: AnalysisSummary;
    results: EmotionResult[];
  } | null>(null);

  const [useMock, setUseMock] = useState(() => {
    const saved = localStorage.getItem('dashboard-use-mock');
    return saved ? JSON.parse(saved) : false;
  });
  const [loading, setLoading] = useState(true);

  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [selected, setSelected] = useState<EmotionResult | null>(null);

  // Load real data or fallback to mock
  const loadData = async () => {
    setLoading(true);
    enhancedLogService.logAction('load_data_started', 'Dashboard', { useMock });

    try {
      if (useMock) {
        const mockData = generateMockData();
        setAnalyticsData(mockData);
        enhancedLogService.logAction('mock_data_loaded', 'Dashboard');
      } else {
        // Try to load from localStorage first for real data
        const cachedData = localStorage.getItem('dashboard-analytics-data');
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            setAnalyticsData(parsedData);
            enhancedLogService.logAction('cached_data_loaded', 'Dashboard');
          } catch (parseError) {
            enhancedLogService.logError(parseError as Error, 'Dashboard', { context: 'parsing_cached_data' });
          }
        }

        // Always fetch fresh data from API
        const realData = await getRealAnalyticsData();
        setAnalyticsData(realData);
        enhancedLogService.logAction('real_data_loaded', 'Dashboard', {
          resultsCount: realData.results?.length || 0
        });

        // Save fresh data to localStorage
        localStorage.setItem('dashboard-analytics-data', JSON.stringify(realData));
      }
    } catch (error) {
      enhancedLogService.logError(error as Error, 'Dashboard', { context: 'loading_data' });

      // Try cached data first
      const cachedData = localStorage.getItem('dashboard-analytics-data');
      if (cachedData && !useMock) {
        try {
          const parsedData = JSON.parse(cachedData);
          setAnalyticsData(parsedData);
          enhancedLogService.logAction('fallback_to_cached_data', 'Dashboard');
          return;
        } catch (parseError) {
          enhancedLogService.logError(parseError as Error, 'Dashboard', { context: 'parsing_fallback_data' });
        }
      }

      // Final fallback to mock data
      const mockData = generateMockData();
      setAnalyticsData(mockData);
      setUseMock(true);
      enhancedLogService.logAction('fallback_to_mock_data', 'Dashboard');
    } finally {
      setLoading(false);
      enhancedLogService.logAction('load_data_completed', 'Dashboard');
    }
  }; useEffect(() => {
    loadData();
  }, [useMock]);

  // Save mock preference to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-use-mock', JSON.stringify(useMock));
  }, [useMock]);

  // ESC đóng modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Get current data
  const summary = analyticsData?.summary ?? null;
  const results = analyticsData?.results ?? [];

  // Calculate windowed results for detail view
  const windowResults = useMemo(() => {
    if (!selected || results.length === 0) return [];
    const start = selected.timestamp - 1.5;
    const end = selected.timestamp + 1.5;
    return results.filter((r: EmotionResult) => r.timestamp >= start && r.timestamp <= end);
  }, [selected, results]);

  // Show loading skeleton
  if (loading || !analyticsData || !summary) {
    return <DashboardSkeleton />;
  }

  // Delete detection function  
  async function handleDeleteDetection(id: string, type?: 'upload' | 'audio' | 'vision') {
    // Find the item to be deleted for trash
    const itemToDelete = analyticsData?.results.find((r: EmotionResult) => r.id === id);

    enhancedLogService.logAction('delete_detection_started', 'Dashboard', {
      id,
      type,
      emotion: itemToDelete?.emotion_type
    });

    if (!useMock && type) {
      try {
        // Call backend delete API
        if (type === 'upload') {
          await deleteUploadAnalysis(id);
        } else if (type === 'audio') {
          await deleteAudioAnalysis(id);
        } else if (type === 'vision') {
          await deleteVisionAnalysis(id);
        }
        enhancedLogService.logAction('backend_delete_success', 'Dashboard', { id, type });
      } catch (error) {
        enhancedLogService.logError(error as Error, 'Dashboard', {
          context: 'backend_delete_failed',
          id,
          type
        });
        alert(`Failed to delete ${type}. Please try again.`);
        return;
      }
    }

    // Add to trash before removing from current data
    if (itemToDelete) {
      trashService.addToTrash({
        originalId: id,
        type: type || 'upload', // default to upload if type not specified
        name: `Emotion Detection - ${itemToDelete.emotion_type}`,
        content: itemToDelete,
        deletedFrom: 'Analytics Dashboard'
      });
      enhancedLogService.logAction('item_moved_to_trash', 'Dashboard', {
        id,
        type,
        emotion: itemToDelete.emotion_type
      });
    }

    // Update local state
    setAnalyticsData((prev) => {
      if (!prev) return prev;
      const newData = {
        ...prev,
        results: prev.results.filter((r: EmotionResult) => r.id !== id),
      };

      // Save updated data to localStorage when using real data
      if (!useMock) {
        localStorage.setItem('dashboard-analytics-data', JSON.stringify(newData));
      }

      return newData;
    });

    if (selected?.id === id) {
      setSelected(null);
    }

    enhancedLogService.logAction('delete_detection_completed', 'Dashboard', { id });
  }

  return (
    <div className="space-y-8">
      {/* Data Source Toggle */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Use Mock Data</span>
          </label>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <DashboardHeader
        summary={{
          dominant_emotion: summary.dominant_emotion,
          average_confidence: summary.average_confidence,
          total_frames_analyzed: summary.total_frames_analyzed,
          duration: summary.duration,
        }}
        onNewAnalysis={() => loadData()}
      />

      <EmotionSummaryCard summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionCard
          distribution={summary.emotion_distribution}
          chartType={chartType}
          onChangeType={setChartType}
        />
        <TimelineCard results={results} />
      </div>

      <DetectionTable
        results={results}
        onSelect={setSelected}
        onDeleteOne={handleDeleteDetection}
      />

      {selected && (
        <DetectionDetailModal
          selected={selected}
          windowResults={windowResults}
          onClose={() => setSelected(null)}
        />
      )}

      <DashboardStyles />
    </div>
  );
}
