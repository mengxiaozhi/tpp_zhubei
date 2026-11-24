"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { shareCardFileName, shareCardHash, shareCardQr, shareCardSiteLabel, shareCardSiteUrl } from "@/lib/share-card";

import styles from "./share-card.module.css";

const exampleName = "竹北好鄰居";
const photoTypes = ["image/jpeg", "image/png", "image/webp"];
const photoSizeLimit = 10 * 1024 * 1024;
const shareUrl = new URL(shareCardHash, shareCardSiteUrl).href;

async function renderCard(name: string, photo?: File) {
  const { drawShareCard } = await import("@/lib/draw-share-card");
  return drawShareCard({ name, photo, qrSource: shareCardQr, siteLabel: shareCardSiteLabel });
}

export function ShareCardMaker() {
  const nameId = useId();
  const photoId = useId();
  const photoRef = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const resultUrl = useRef("");

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [photoError, setPhotoError] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [sampleError, setSampleError] = useState(false);
  const [card, setCard] = useState<{ blob: Blob; url: string; name: string }>();
  const [working, setWorking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [showCopyField, setShowCopyField] = useState(false);

  useEffect(() => {
    let active = true;
    let url = "";

    void renderCard(exampleName).then((blob) => {
      if (!active) return;
      url = URL.createObjectURL(blob);
      setSampleUrl(url);
    }).catch(() => {
      if (active) setSampleError(true);
    });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => () => {
    generation.current += 1;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
  }, []);

  function clearResult() {
    generation.current += 1;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = "";
    setCard(undefined);
    setWorking(false);
    setSharing(false);
    setShowCopyField(false);
    setMessage("");
  }

  function removePhoto() {
    clearResult();
    setPhoto(undefined);
    setPhotoError("");
    if (photoRef.current) photoRef.current.value = "";
  }

  async function createCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim();
    if (working || sharing || photoError) return;
    if (!displayName) {
      setMessage("請填寫你想顯示的稱呼。");
      return;
    }

    clearResult();
    const attempt = generation.current;
    setWorking(true);
    setMessage("正在製作小卡…");

    try {
      const blob = await renderCard(displayName, photo);
      if (attempt !== generation.current) return;

      const url = URL.createObjectURL(blob);
      resultUrl.current = url;
      setCard({ blob, url, name: displayName });
      setMessage("小卡完成，可以下載 PNG 或開啟分享。");
    } catch (error) {
      if (attempt !== generation.current) return;
      setMessage(error instanceof Error && error.message.startsWith("照片")
        ? error.message
        : "無法製作小卡，請再試一次。");
    } finally {
      if (attempt === generation.current) setWorking(false);
    }
  }

  async function shareCard() {
    if (!card || sharing) return;

    const attempt = generation.current;
    setSharing(true);
    setShowCopyField(false);

    try {
      try {
        const file = new File([card.blob], shareCardFileName, { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "我關心竹北的日常", url: shareUrl });
          if (attempt === generation.current) setMessage("小卡已交給你選擇的分享工具。");
          return;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (attempt === generation.current) setMessage("已取消分享。");
          return;
        }
      }

      if (attempt !== generation.current) return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (attempt === generation.current) setMessage("已複製竹北小卡網址。可下載 PNG 後一併分享。");
      } catch {
        if (attempt === generation.current) {
          setShowCopyField(true);
          setMessage("請複製下方網址，或下載 PNG 分享。");
        }
      }
    } finally {
      if (attempt === generation.current) setSharing(false);
    }
  }

  const preview = card?.url || sampleUrl;

  return (
    <div className={styles.layout}>
      <section className={styles.editor} aria-labelledby="zhubei-share-maker">
        <h3 id="zhubei-share-maker">把你關心的竹北，<br />做成一張小卡。</h3>
        <p className={styles.intro}>加上稱呼和照片，分享你對竹北日常的關心。</p>
        <form onSubmit={(event) => void createCard(event)} aria-busy={working}>
          <fieldset className={styles.fields} disabled={working || sharing}>
            <legend className="sr-only">製卡資料</legend>
            <label htmlFor={nameId}>你想顯示的稱呼</label>
            <input
              id={nameId}
              value={name}
              required
              maxLength={40}
              autoComplete="off"
              placeholder="例如：竹北好鄰居"
              onChange={(event) => {
                clearResult();
                setName(event.currentTarget.value);
              }}
            />
            <label htmlFor={photoId}>選擇照片 <small>（選填）</small></label>
            <input
              ref={photoRef}
              id={photoId}
              type="file"
              accept={photoTypes.join(",")}
              aria-describedby={`${photoId}-help${photoError ? ` ${photoId}-error` : ""}`}
              aria-invalid={Boolean(photoError)}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;

                clearResult();
                if (!photoTypes.includes(file.type) || !file.size || file.size > photoSizeLimit) {
                  event.currentTarget.value = "";
                  setPhoto(undefined);
                  setPhotoError("請選擇 10 MB 以內的 JPG、PNG 或 WebP 照片。");
                  return;
                }
                setPhoto(file);
                setPhotoError("");
              }}
            />
            <p className={styles.help} id={`${photoId}-help`}>支援 JPG、PNG、WebP，限 10 MB，照片會置中裁成圓形。</p>
            {photoError && <p className={styles.error} id={`${photoId}-error`} role="alert">{photoError}</p>}
            {(photo || photoError) && <button type="button" className={styles.textButton} onClick={removePhoto}>移除照片</button>}
            <Button type="submit" className={styles.create} disabled={Boolean(photoError) || working || sharing}>
              {working ? "正在製作…" : card ? "重新製作小卡" : "製作我的小卡"}
              <span aria-hidden="true">↗</span>
            </Button>
          </fieldset>
        </form>
        {card && (
          <div className={styles.actions}>
            <ButtonLink href={card.url} download={shareCardFileName} variant="outline">
              下載 PNG <span aria-hidden="true">↓</span>
            </ButtonLink>
            <Button type="button" variant="outline" disabled={sharing} onClick={() => void shareCard()}>
              {sharing ? "正在開啟分享…" : "分享小卡"} <span aria-hidden="true">↗</span>
            </Button>
          </div>
        )}
        <p className={styles.feedback} role="status">{message}</p>
        {showCopyField && (
          <label className={styles.copyField}>
            竹北小卡網址
            <input type="text" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} />
          </label>
        )}
        {(name || photo || photoError || card) && (
          <button type="button" className={styles.textButton} onClick={() => {
            removePhoto();
            setName("");
            setMessage("已清除小卡資料。");
          }}>清除小卡資料</button>
        )}
        <p className={styles.privacy}>稱呼與照片由瀏覽器處理，關閉小卡後即清除。</p>
      </section>
      <figure className={styles.preview}>
        {preview ? (
          <img
            src={preview}
            width={1080}
            height={1350}
            alt={card ? `${card.name}的竹北小卡，包含劉文軒與網站 QR Code` : "竹北分享小卡範例，包含劉文軒與網站 QR Code"}
          />
        ) : (
          <div className={styles.previewPending}>
            <strong>我關心<br />竹北的日常</strong>
            <span>{sampleError ? "可填寫稱呼製作小卡" : "正在載入範例…"}</span>
          </div>
        )}
        <figcaption>{card ? "個人小卡預覽 · PNG 1080 × 1350" : "分享小卡範例"}</figcaption>
      </figure>
    </div>
  );
}
