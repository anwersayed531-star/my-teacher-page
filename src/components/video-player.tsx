import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Maximize, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseYouTubeId } from "@/lib/mock-data";

/**
 * YouTube-backed video player with custom controls.
 * Teacher uploads unlisted videos to YouTube; we store the URL/ID only.
 * The YouTube IFrame API (free, no API key) powers playback; our UI wraps it
 * so the player looks native to the platform.
 * TODO: connect to Supabase — persist watch progress per user instead of localStorage.
 */

interface Props {
  src: string;
  title?: string;
  storageKey?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: (getTime: () => number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Global loader — inject <script> once.
let ytPromise: Promise<any> | null = null;
function loadYT(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    if (w.YT?.Player) return resolve(w.YT);
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    if (!document.querySelector('script[data-yt-iframe]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.setAttribute("data-yt-iframe", "1");
      document.head.appendChild(tag);
    }
  });
  return ytPromise;
}

export function VideoPlayer({ src, title, storageKey, onTimeUpdate, onReady }: Props) {
  const videoId = parseYouTubeId(src);
  const holderRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false);

  const savedKey = storageKey ? `vp:${storageKey}` : null;

  // Build player
  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    if (!videoId) return;
    loadYT().then((YT) => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new YT.Player(holderRef.current, {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          controls: 0,
          disablekb: 1,
          iv_load_policy: 3,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            if (cancelled) return;
            setReady(true);
            setDuration(e.target.getDuration() || 0);
            // Resume
            if (savedKey) {
              const saved = Number(window.localStorage.getItem(savedKey) || 0);
              if (saved > 3 && saved < (e.target.getDuration() || Infinity)) {
                e.target.seekTo(saved, true);
              }
            }
            onReady?.(() => playerRef.current?.getCurrentTime?.() || 0);
            poll = setInterval(() => {
              const p = playerRef.current;
              if (!p?.getCurrentTime) return;
              const t = p.getCurrentTime();
              const d = p.getDuration();
              setTime(t);
              if (d && d !== duration) setDuration(d);
              onTimeUpdate?.(t);
              if (savedKey) window.localStorage.setItem(savedKey, String(t));
            }, 500);
          },
          onStateChange: (e: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (e.data === 1) setPlaying(true);
            else if (e.data === 2 || e.data === 0) setPlaying(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo(); else p.playVideo();
  }, [playing]);

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const setSpd = (n: number) => {
    setSpeed(n);
    playerRef.current?.setPlaybackRate?.(n);
  };

  const goFull = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const seek = (v: number) => {
    playerRef.current?.seekTo?.(v, true);
    setTime(v);
  };

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-xl bg-black text-white shadow-lg">
      <div className="relative aspect-video w-full">
        <div ref={holderRef} className="absolute inset-0 h-full w-full" />
        {/* Click overlay to toggle play (leaves ~64px bottom strip for controls) */}
        <button
          type="button"
          aria-label="play/pause"
          onClick={toggle}
          className="absolute inset-0 bottom-16 cursor-pointer bg-transparent"
        />
        {/* Top blocker to hide YouTube title/branding on hover */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
        {title && <div className="mb-2 truncate text-sm font-medium">{title}</div>}
        <div className="relative">
          <div className="absolute inset-y-1/2 h-1 w-full -translate-y-1/2 rounded bg-white/20" />
          <div
            className="pointer-events-none absolute inset-y-1/2 h-1 -translate-y-1/2 rounded bg-primary"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            className="relative z-10 w-full accent-primary"
            aria-label="seek"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={toggle} aria-label="play/pause" disabled={!ready}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span dir="ltr">{fmt(time)} / {fmt(duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 gap-1 text-white hover:bg-white/10">
                  <Gauge className="h-4 w-4" />
                  <span dir="ltr">{speed}x</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SPEEDS.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setSpd(s)}>
                    <span dir="ltr">{s}x</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={goFull} aria-label="fullscreen">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {pct > 0 && (
          <div className="mt-1 text-[10px] text-white/60">تم متابعة: {Math.round(pct)}%</div>
        )}
      </div>
    </div>
  );
}
