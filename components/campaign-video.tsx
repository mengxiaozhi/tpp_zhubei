"use client";

import { useEffect, useRef, useState } from "react";

import { filmChapters, formatFilmTime, getFilmChapter } from "@/lib/campaign-film";

import styles from "./campaign-video.module.css";

const videoSource = "/videos/liu-wen-hsuan-6f.mp4";
const intro = filmChapters[0];

export function CampaignVideo() {
  const playerRef = useRef<HTMLVideoElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const [chapter, setChapter] = useState(intro);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [notice, setNotice] = useState("");
  const chapterIndex = filmChapters.indexOf(chapter);
  const completedLetters = Math.min(chapterIndex, 6);

  function seekTo(player: HTMLVideoElement, start: number) {
    if (player.readyState === 0) {
      pendingSeek.current = start;
      player.preload = "metadata";
    } else {
      pendingSeek.current = null;
    }

    player.currentTime = start;
  }

  useEffect(() => {
    function cueFragment(event?: HashChangeEvent) {
      const fragment = window.location.hash;
      if (!fragment.startsWith("#video-")) return;

      const destination = getFilmChapter(fragment.slice("#video-".length));
      const player = playerRef.current;
      if (!destination || !player) return;

      player.pause();
      seekTo(player, destination.start);
      setChapter(destination);
      setNotice(`已定位到 ${destination.title}，按播放觀看。`);
      if (event) headingRef.current?.focus({ preventScroll: true });
    }

    cueFragment();
    window.addEventListener("hashchange", cueFragment);
    return () => window.removeEventListener("hashchange", cueFragment);
  }, []);

  function syncChapter(player: HTMLVideoElement) {
    if (pendingSeek.current !== null || player.seeking) return;

    const currentChapter = filmChapters.findLast(({ start }) => start <= player.currentTime);
    if (currentChapter) setChapter(currentChapter);
  }

  function play(player: HTMLVideoElement) {
    setNotice("");
    void player.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("無法開始播放，請用影片下方的播放控制再試一次。");
    });
  }

  return (
    <section id="video" aria-labelledby="video-heading" className={styles.section}>
      {filmChapters.map(({ id }) => (
        <span key={id} id={`video-${id}`} className={styles.chapterAnchor} aria-hidden="true" />
      ))}
      <div className="site-container">
        <header className={styles.heading}>
          <div>
            <h2 ref={headingRef} id="video-heading" className={styles.title} tabIndex={-1}>6F 政見影片</h2>
            <p className={styles.intro}>從通勤到社區照明，跟著影片走進竹北的日常。</p>
          </div>
          <time className={styles.duration} dateTime="PT2M34S">全片 2 分 34 秒</time>
        </header>

        <div className={styles.layout}>
          <div className={styles.screenColumn}>
            <div className={styles.screen}>
              <video
                ref={playerRef}
                id="campaign-film-player"
                className={styles.player}
                aria-labelledby="video-heading"
                controls
                playsInline
                preload="none"
                poster="/images/liu-wen-hsuan-video-cover.webp"
                width={1920}
                height={1080}
                onLoadedMetadata={({ currentTarget }) => {
                  const start = pendingSeek.current;
                  if (start === null) return;

                  pendingSeek.current = null;
                  if (Math.abs(currentTarget.currentTime - start) > 0.1) {
                    currentTarget.currentTime = start;
                  }
                }}
                onPlaying={({ currentTarget }) => {
                  if (document.activeElement === playButtonRef.current) {
                    currentTarget.focus({ preventScroll: true });
                  }
                  setHasPlayed(true);
                  setNotice("");
                }}
                onTimeUpdate={({ currentTarget }) => syncChapter(currentTarget)}
                onSeeked={({ currentTarget }) => syncChapter(currentTarget)}
              >
                <source src={videoSource} type="video/mp4" />
                <a href={videoSource}>開啟影片檔</a>
              </video>
              {!hasPlayed && (
                <button
                  ref={playButtonRef}
                  type="button"
                  aria-label={chapter === intro ? "播放 6F 政見影片" : `播放 ${chapter.title}`}
                  className={styles.playButton}
                  onClick={() => {
                    const player = playerRef.current;
                    if (player) play(player);
                  }}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 4.5 20 12 8 19.5Z" />
                  </svg>
                </button>
              )}
            </div>
            <div className={styles.caption}>
              <p>{chapter.description}</p>
              <a href="#policies">
                閱讀 6F 政見 <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className={styles.notice} role="status">{notice}</p>
          </div>

          <div className={styles.chapters}>
            <div className={styles.chapterHeading}>
              <h3>影片章節</h3>
              <span className={styles.chapterProgress} aria-hidden="true">
                #{"F".repeat(completedLetters)}<span>{"·".repeat(6 - completedLetters)}</span>
              </span>
            </div>
            <ol className={styles.chapterList}>
              {filmChapters.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-controls="campaign-film-player"
                    aria-current={chapter === entry ? "true" : undefined}
                    className={styles.chapterButton}
                    onClick={() => {
                      const player = playerRef.current;
                      if (!player) return;

                      seekTo(player, entry.start);
                      setChapter(entry);
                      play(player);
                      player.scrollIntoView({ block: "nearest" });
                    }}
                  >
                    <span
                      className={styles.chapterImage}
                      style={{ backgroundImage: `url(/images/film-chapter-${entry.id}.webp)` }}
                      aria-hidden="true"
                    />
                    <span className={styles.chapterTitle}>{entry.title}</span>
                    <time className={styles.chapterTime} dateTime={`PT${entry.start}S`}>
                      {formatFilmTime(entry.start)}
                    </time>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
