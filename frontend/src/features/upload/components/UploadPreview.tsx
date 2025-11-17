// src/features/upload/components/UploadPreview.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UploadKind, FaceBox, VideoDetection, VideoMeta } from "../types/uploadTypes";
import { tokens } from "../utils/tokens";

const mapFaceBoxes = (boxes: FaceBox[] | undefined) => {
    if (!boxes) return [];
    return boxes.map((b) => ({
        left: b.left,
        top: b.top,
        width: b.right - b.left,
        height: b.bottom - b.top,
    }));
};

const ImagePreviewWithBoxes: React.FC<{
    sourceUrl: string;
    boxes?: FaceBox[];
    label?: string;
    confidence?: number;
}> = ({ sourceUrl, boxes, label, confidence }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const mapped = useMemo(() => mapFaceBoxes(boxes), [boxes]);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setImage(img);
        img.src = sourceUrl;
        return () => {
            setImage(null);
        };
    }, [sourceUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const maxW = 880;
        const ratio = Math.min(1, maxW / image.width);
        const displayW = Math.round(image.width * ratio);
        const displayH = Math.round(image.height * ratio);

        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, displayW, displayH);
        ctx.drawImage(image, 0, 0, displayW, displayH);

        ctx.save();
        ctx.strokeStyle = "rgba(34,197,94,.95)"; // green border
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        mapped.forEach((box) => {
            const x = box.left * ratio;
            const y = box.top * ratio;
            const w = box.width * ratio;
            const h = box.height * ratio;

            ctx.strokeRect(x, y, w, h);

            const text = label && confidence !== undefined
                ? `${label} • ${Math.round(confidence * 100)}%`
                : confidence !== undefined
                    ? `${Math.round(confidence * 100)}%`
                    : label ?? "";

            if (text) {
                const paddingX = 10;
                ctx.font = "500 14px 'Inter', sans-serif";
                ctx.textBaseline = "middle";
                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;
                const boxX = x;
                const boxY = Math.max(0, y - 28);
                ctx.fillStyle = "rgba(22,163,74,.9)"; // darker green background
                ctx.fillRect(boxX, boxY, textWidth + paddingX * 2, 24);
                ctx.fillStyle = "#f8fafc";
                ctx.fillText(text, boxX + paddingX, boxY + 12);
            }
        });
        ctx.restore();
    }, [image, mapped, label, confidence]);

    return (
        <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 min-h-[280px] grid place-items-center">
            <canvas ref={canvasRef} />
        </div>
    );
};

type PreparedDetection = VideoDetection & {
    computedTime?: number;
};

const computeDetectionTime = (det: VideoDetection, meta?: VideoMeta): number | undefined => {
    if (typeof det.timeSec === "number" && Number.isFinite(det.timeSec)) {
        return det.timeSec;
    }
    if (typeof det.timestampMs === "number" && Number.isFinite(det.timestampMs)) {
        return det.timestampMs / 1000;
    }
    if (meta?.fps && meta.fps > 0) {
        return det.frameIndex / meta.fps;
    }
    if (meta?.durationSec && meta?.totalFrames) {
        const perFrame = meta.durationSec / meta.totalFrames;
        if (Number.isFinite(perFrame) && perFrame > 0) {
            return det.frameIndex * perFrame;
        }
    }
    return undefined;
};

const VideoPreviewWithBoxes: React.FC<{
    sourceUrl: string;
    fallbackBoxes?: FaceBox[];
    fallbackLabel?: string;
    fallbackConfidence?: number;
    detections?: VideoDetection[];
    meta?: VideoMeta;
}> = ({ sourceUrl, fallbackBoxes, fallbackLabel, fallbackConfidence, detections, meta }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [activeIndex, setActiveIndex] = useState(-1);
    const activeIndexRef = useRef(-1);

    const preparedDetections = useMemo<PreparedDetection[]>(() => {
        if (!detections || detections.length === 0) {
            return [];
        }
        return detections
            .map((det) => ({
                ...det,
                computedTime: computeDetectionTime(det, meta),
            }))
            .sort((a, b) => {
                const ta = a.computedTime ?? a.frameIndex;
                const tb = b.computedTime ?? b.frameIndex;
                return ta - tb;
            });
    }, [detections, meta]);

    useEffect(() => {
        activeIndexRef.current = -1;
        setActiveIndex(-1);
    }, [sourceUrl]);

    useEffect(() => {
        if (preparedDetections.length > 0) {
            activeIndexRef.current = 0;
            setActiveIndex(0);
        } else {
            activeIndexRef.current = -1;
            setActiveIndex(-1);
        }
    }, [preparedDetections]);

    useEffect(() => {
        setNaturalSize({ width: 0, height: 0 });
    }, [sourceUrl]);

    const updateActiveIndex = useCallback((idx: number) => {
        if (activeIndexRef.current === idx) return;
        activeIndexRef.current = idx;
        setActiveIndex(idx);
    }, []);

    const syncDetection = useCallback(
        (time: number) => {
            if (!preparedDetections.length) {
                updateActiveIndex(-1);
                return;
            }
            const tolerance = 0.25; // allow slight drift
            let candidate = activeIndexRef.current >= 0 ? activeIndexRef.current : 0;
            candidate = Math.min(Math.max(candidate, 0), preparedDetections.length - 1);

            for (let i = 0; i < preparedDetections.length; i += 1) {
                const det = preparedDetections[i];
                const t = det.computedTime;
                if (t == null) {
                    candidate = i;
                    continue;
                }
                if (t <= time + tolerance) {
                    candidate = i;
                } else {
                    break;
                }
            }

            updateActiveIndex(candidate);
        },
        [preparedDetections, updateActiveIndex]
    );

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleSync = () => syncDetection(video.currentTime || 0);
        const handleLoadedMetadata = () => {
            const { videoWidth, videoHeight } = video;
            if (videoWidth && videoHeight) {
                setNaturalSize({ width: videoWidth, height: videoHeight });
            }
            handleSync();
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("timeupdate", handleSync);
        video.addEventListener("seeking", handleSync);
        video.addEventListener("seeked", handleSync);
        video.addEventListener("play", handleSync);
        video.addEventListener("pause", handleSync);
        video.addEventListener("loadeddata", handleSync);

        return () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("timeupdate", handleSync);
            video.removeEventListener("seeking", handleSync);
            video.removeEventListener("seeked", handleSync);
            video.removeEventListener("play", handleSync);
            video.removeEventListener("pause", handleSync);
            video.removeEventListener("loadeddata", handleSync);
        };
    }, [syncDetection]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        syncDetection(video.currentTime || 0);
    }, [preparedDetections, syncDetection]);

    const activeDetection = activeIndex >= 0 ? preparedDetections[activeIndex] : undefined;

    const fallbackSubjects = useMemo(() => {
        if (!fallbackBoxes || fallbackBoxes.length === 0) return undefined;
        return fallbackBoxes.map((box) => ({
            box,
            emotion: fallbackLabel,
            confidence: fallbackConfidence,
        }));
    }, [fallbackBoxes, fallbackLabel, fallbackConfidence]);

    const subjects = activeDetection?.subjects?.length
        ? activeDetection.subjects
        : fallbackSubjects ?? [];

    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/40">
            <video
                key={sourceUrl}
                ref={videoRef}
                src={sourceUrl}
                controls
                className="w-full h-auto"
            />
            {subjects.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                    {subjects.map((subject, idx) => {
                        const basisWidth = activeDetection?.frameWidth && activeDetection.frameWidth > 0
                            ? activeDetection.frameWidth
                            : naturalSize.width;
                        const basisHeight = activeDetection?.frameHeight && activeDetection.frameHeight > 0
                            ? activeDetection.frameHeight
                            : naturalSize.height;

                        if (!basisWidth || !basisHeight) {
                            return null;
                        }

                        const box = subject.box;
                        const width = Math.max(box.right - box.left, 1);
                        const height = Math.max(box.bottom - box.top, 1);
                        const leftPct = (box.left / basisWidth) * 100;
                        const topPct = (box.top / basisHeight) * 100;
                        const widthPct = (width / basisWidth) * 100;
                        const heightPct = (height / basisHeight) * 100;

                        const subjectLabel = subject.emotion ?? fallbackLabel ?? "";
                        const subjectConfidence = subject.confidence ?? fallbackConfidence;
                        const displayConfidence = subjectConfidence !== undefined && subjectConfidence !== null
                            ? Math.round(subjectConfidence * 100)
                            : null;
                        const showLabel = subjectLabel || displayConfidence !== null;

                        return (
                            <div
                                key={`${idx}-${box.left}-${box.top}`}
                                style={{
                                    left: `${leftPct}%`,
                                    top: `${topPct}%`,
                                    width: `${widthPct}%`,
                                    height: `${heightPct}%`,
                                }}
                                className="absolute border-2 border-lime-400/90 rounded-md"
                            >
                                {showLabel && (
                                    <div className="absolute -top-7 left-0 bg-lime-600/90 text-lime-50 text-xs px-2 py-1 rounded-md">
                                        {subjectLabel}
                                        {displayConfidence !== null ? ` • ${displayConfidence}%` : ""}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const EmptyPreview: React.FC<{ message: string }> = ({ message }) => (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 min-h-[260px] grid place-items-center text-slate-400">
        {message}
    </div>
);

export const UploadPreview: React.FC<{
    kind: UploadKind;
    sourceUrl: string | null;
    faceBoxes?: FaceBox[];
    label?: string;
    confidence?: number;
    videoDetections?: VideoDetection[];
    videoMeta?: VideoMeta;
}> = ({ kind, sourceUrl, faceBoxes, label, confidence, videoDetections, videoMeta }) => {
    if (kind === "audio") {
        return sourceUrl ? (
            <audio controls src={sourceUrl} className="w-full rounded-xl bg-slate-900/50 mt-2" />
        ) : (
            <EmptyPreview message="Upload audio to play." />
        );
    }

    if (kind === "image") {
        if (!sourceUrl) {
            return <EmptyPreview message="Upload image to preview." />;
        }
        return (
            <ImagePreviewWithBoxes
                sourceUrl={sourceUrl}
                boxes={faceBoxes}
                label={label}
                confidence={confidence}
            />
        );
    }

    // video
    if (!sourceUrl) {
        return <EmptyPreview message="Upload video to preview." />;
    }
    return (
        <VideoPreviewWithBoxes
            sourceUrl={sourceUrl}
            fallbackBoxes={faceBoxes}
            fallbackLabel={label}
            fallbackConfidence={confidence}
            detections={videoDetections}
            meta={videoMeta}
        />
    );
};

export const PreviewContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className={tokens.card + " p-6 min-h-[340px]"}>
        <div className="text-sm text-slate-400 mb-2">Preview</div>
        {children}
    </div>
);
