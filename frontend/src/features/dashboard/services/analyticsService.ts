// src/features/dashboard/services/analyticsService.ts
import { Analysis, AnalysisSummary, EmotionResult } from "@/types/emotions";

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export interface UploadAnalysisResponse {
    id: string;
    source_name: string;
    kind: string;
    label: string;
    confidence: number;
    latency_ms: number;
    file_url?: string;
    result_url?: string;
    size_bytes?: number;
    face_locations?: Array<{
        left: number;
        top: number;
        right: number;
        bottom: number;
    }>;
    top_emotions?: Array<{
        label: string;
        score: number;
    }>;
    extra?: Record<string, any>;
    raw_result?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface AudioAnalysisResponse {
    id: string;
    source_name: string;
    label: string;
    confidence: number;
    latency_ms: number;
    file_url?: string;
    raw_result?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface VisionAnalysisResponse {
    id: string;
    source_name?: string;
    label: string;
    confidence: number;
    latency_ms: number;
    image_url?: string;
    result_url?: string;
    face_locations?: Record<string, any>;
    raw_result?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

async function fetchAnalyticsData<T>(endpoint: string): Promise<T[]> {
    try {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/${endpoint}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
    }
}

export async function getUploadAnalytics(limit: number = 100): Promise<UploadAnalysisResponse[]> {
    return fetchAnalyticsData<UploadAnalysisResponse>(`upload?limit=${limit}`);
}

export async function getAudioAnalytics(limit: number = 100): Promise<AudioAnalysisResponse[]> {
    return fetchAnalyticsData<AudioAnalysisResponse>(`audio?limit=${limit}`);
}

export async function getVisionAnalytics(limit: number = 100): Promise<VisionAnalysisResponse[]> {
    return fetchAnalyticsData<VisionAnalysisResponse>(`vision?limit=${limit}`);
}

// Delete functions
export async function deleteUploadAnalysis(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/upload/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting upload analysis:', error);
        return false;
    }
}

export async function deleteAudioAnalysis(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/audio/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting audio analysis:', error);
        return false;
    }
}

export async function deleteVisionAnalysis(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/api/v1/analytics/vision/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting vision analysis:', error);
        return false;
    }
}// Convert backend data to frontend format
export function convertToEmotionResults(
    uploads: UploadAnalysisResponse[],
    audios: AudioAnalysisResponse[] = [],
    visions: VisionAnalysisResponse[] = []
): EmotionResult[] {
    const results: EmotionResult[] = [];

    // Convert upload analysis
    uploads.forEach((upload, index) => {
        results.push({
            id: upload.id,
            analysis_id: "combined", // Group all under one analysis
            timestamp: index * 0.5, // Mock timestamp for now
            emotion_type: upload.label as any,
            confidence: upload.confidence,
            detection_type: upload.kind === "audio" ? "vocal" : "facial",
            face_count: upload.face_locations?.length || (upload.kind === "image" || upload.kind === "video" ? 1 : 0),
            created_at: upload.created_at,
        });
    });

    // Convert audio analysis
    audios.forEach((audio, index) => {
        results.push({
            id: audio.id,
            analysis_id: "combined",
            timestamp: (uploads.length + index) * 0.5,
            emotion_type: audio.label as any,
            confidence: audio.confidence,
            detection_type: "vocal",
            face_count: 0,
            created_at: audio.created_at,
        });
    });

    // Convert vision analysis
    visions.forEach((vision, index) => {
        results.push({
            id: vision.id,
            analysis_id: "combined",
            timestamp: (uploads.length + audios.length + index) * 0.5,
            emotion_type: vision.label as any,
            confidence: vision.confidence,
            detection_type: "facial",
            face_count: 1,
            created_at: vision.created_at,
        });
    });

    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function generateAnalysisSummary(results: EmotionResult[]): AnalysisSummary {
    if (results.length === 0) {
        return {
            id: "empty-summary",
            analysis_id: "empty",
            dominant_emotion: null,
            emotion_distribution: {},
            average_confidence: 0,
            total_frames_analyzed: 0,
            duration: 0,
            created_at: new Date().toISOString(),
        };
    }

    const emotionCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let faceDetections = 0;
    let vocalEmotions = 0;
    let facialEmotions = 0;

    results.forEach((result) => {
        emotionCounts[result.emotion_type] = (emotionCounts[result.emotion_type] || 0) + 1;
        totalConfidence += result.confidence;

        if (result.detection_type === "vocal") {
            vocalEmotions++;
        } else {
            facialEmotions++;
            if (result.face_count > 0) {
                faceDetections++;
            }
        }
    });

    const total = results.length;
    const distribution: Record<string, number> = {};
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
        distribution[emotion] = (count / total) * 100;
    });

    const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as any;

    return {
        id: "combined-summary",
        analysis_id: "combined",
        dominant_emotion: dominantEmotion,
        emotion_distribution: distribution,
        average_confidence: totalConfidence / total,
        total_frames_analyzed: total,
        duration: Math.max(...results.map(r => r.timestamp)) || 0,
        created_at: new Date().toISOString(),
    };
}

export async function getRealAnalyticsData(): Promise<{
    analysis: Analysis;
    summary: AnalysisSummary;
    results: EmotionResult[];
}> {
    try {
        const [uploads, audios, visions] = await Promise.all([
            getUploadAnalytics(50),
            getAudioAnalytics(50),
            getVisionAnalytics(50),
        ]);

        const results = convertToEmotionResults(uploads, audios, visions);
        const summary = generateAnalysisSummary(results);

        const analysis: Analysis = {
            id: "combined-analysis",
            file_name: "Combined Analysis",
            file_type: "mixed",
            file_url: "",
            status: "completed",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return { analysis, summary, results };
    } catch (error) {
        console.error("Error fetching real analytics data:", error);
        // Fallback to empty data
        return {
            analysis: {
                id: "empty",
                file_name: "No Data",
                file_type: "none",
                file_url: "",
                status: "failed",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            summary: generateAnalysisSummary([]),
            results: [],
        };
    }
}