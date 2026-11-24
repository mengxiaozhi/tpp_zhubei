import { projectCopyright } from "@/lib/copyright";

type ShareCardInput = {
  name: string;
  photo?: File;
  qrSource: string;
  siteLabel: string;
};

const width = 1080;
const height = 1350;
const maxPhotoBytes = 10 * 1024 * 1024;
const chineseFont = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif';
const monoFont = 'ui-monospace, "SFMono-Regular", Consolas, monospace';
const colors = {
  ink: "#2b2530",
  teal: "#075e5e",
  tealDark: "#074548",
  copper: "#8a562f",
  cream: "#fff7e9",
  gold: "#ffcf85",
};

function loadImage(source: string) {
  const image = new Image();
  image.src = source;
  return image.decode().then(() => image);
}

async function validatePhoto(photo: File) {
  if (!photo.size || photo.size > maxPhotoBytes) {
    throw new Error("照片需為 10 MB 以內的 JPG、PNG 或 WebP。");
  }

  const bytes = new Uint8Array(await photo.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  if (!png && !jpeg && !webp) {
    throw new Error("照片格式無法讀取，請選擇 JPG、PNG 或 WebP。");
  }
}

function roundedFill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  color: string,
) {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, w, h, radius);
  context.fill();
}

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  options: { weight?: number; font?: string; maxWidth?: number } = {},
) {
  const { weight = 750, font = chineseFont, maxWidth } = options;
  context.font = `${weight} ${size}px ${font}`;
  context.fillStyle = color;

  if (maxWidth && context.measureText(text).width > maxWidth) {
    const characters = Array.from(text);
    while (characters.length && context.measureText(`${characters.join("")}…`).width > maxWidth) {
      characters.pop();
    }
    text = `${characters.join("")}…`;
  }

  context.fillText(text, x, y);
}

function drawAvatar(context: CanvasRenderingContext2D, avatar: HTMLImageElement) {
  const x = 89;
  const y = 572;
  const size = 91;
  const crop = Math.min(avatar.naturalWidth, avatar.naturalHeight);
  const cropX = (avatar.naturalWidth - crop) / 2;
  const cropY = (avatar.naturalHeight - crop) / 2;

  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(avatar, cropX, cropY, crop, crop, x, y, size, size);
  context.restore();
  context.lineWidth = 3;
  context.strokeStyle = "#d7b28f";
  context.stroke();
}

function drawBackground(context: CanvasRenderingContext2D) {
  const paper = context.createLinearGradient(0, 0, 900, 940);
  paper.addColorStop(0, "#fff8ed");
  paper.addColorStop(0.5, "#fbedd8");
  paper.addColorStop(1, "#eac6a5");
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);

  const sunset = context.createRadialGradient(855, 531, 72, 855, 531, 375);
  sunset.addColorStop(0, "#ffd99b");
  sunset.addColorStop(1, "#ffd99b00");
  context.fillStyle = sunset;
  context.fillRect(0, 180, width, 742);

  context.fillStyle = "#b58154";
  context.fillRect(68, 183, 944, 2);
  context.fillRect(69, 239, 32, 5);
}

function drawCampaign(
  context: CanvasRenderingContext2D,
  portrait: HTMLImageElement,
  city: HTMLImageElement,
) {
  roundedFill(context, 68, 64, 69, 69, 15, colors.teal);
  context.textAlign = "center";
  label(context, "9", 102.5, 115, 51, colors.cream, { font: monoFont, weight: 850 });
  context.textAlign = "left";
  label(context, "劉文軒", 155, 111, 48, colors.ink, { weight: 900 });
  label(context, "竹北市民代表・第二選區", 155, 148, 26, colors.copper);
  context.textAlign = "right";
  label(context, "#FFFFFF", 1012, 113, 38, colors.teal, { font: monoFont, weight: 800 });
  context.textAlign = "left";
  label(context, "竹北・6F 行動政見", 116, 253, 30, colors.copper);

  context.save();
  context.beginPath();
  context.rect(0, 265, width, 660);
  context.clip();
  context.drawImage(city, -35, 594, 1150, 1150 * city.naturalHeight / city.naturalWidth);
  context.drawImage(portrait, 501, 365, 584, 584 * portrait.naturalHeight / portrait.naturalWidth);
  context.restore();

  label(context, "我關心", 63, 390, 112, colors.ink, { weight: 900 });
  label(context, "竹北的日常", 64, 506, 104, colors.teal, { weight: 900 });
}

function drawSignature(context: CanvasRenderingContext2D, name: string, avatar?: HTMLImageElement) {
  const textX = avatar ? 200 : 105;

  roundedFill(context, 69, 551, 425, 134, 19, "#fffbf2ed");
  if (avatar) {
    drawAvatar(context, avatar);
  } else {
    roundedFill(context, 84, 578, 4, 81, 2, "#bb8655");
  }

  label(context, "分享人", textX, 592, 26, colors.copper);
  drawName(context, name, textX, 473 - textX);
}

function drawName(context: CanvasRenderingContext2D, name: string, x: number, maxWidth: number) {
  const characters = typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter("zh-Hant", { granularity: "grapheme" }).segment(name), ({ segment }) => segment)
    : Array.from(name);
  let size = 42;
  let lines: string[] = [];

  for (; size >= 16; size -= 2) {
    context.font = `850 ${size}px ${chineseFont}`;
    lines = [];
    let line = "";
    for (const character of characters) {
      if (line && context.measureText(line + character).width > maxWidth) {
        lines.push(line);
        line = "";
      }
      line += character;
    }
    lines.push(line);
    if (lines.length * size * 1.18 <= 72) break;
  }

  const lineHeight = Math.max(size, 16) * 1.18;
  const baseline = 655 - (lines.length - 1) * lineHeight;
  lines.forEach((line, index) => {
    label(context, line, x, baseline + index * lineHeight, Math.max(size, 16), colors.ink, {
      maxWidth,
      weight: 850,
    });
  });
}

function drawFooter(context: CanvasRenderingContext2D, qr: HTMLImageElement, siteLabel: string) {
  const panel = context.createLinearGradient(0, 925, width, 1300);
  panel.addColorStop(0, colors.tealDark);
  panel.addColorStop(1, "#0e6462");
  context.fillStyle = panel;
  context.fillRect(0, 925, width, height - 925);

  context.fillStyle = "#dda767";
  context.fillRect(0, 925, width, 5);

  label(context, "一步一步", 67, 1041, 69, colors.gold, { weight: 850 });
  label(context, "我們並肩向前方", 66, 1132, 65, colors.cream, { weight: 850 });
  context.fillStyle = "#e4bd8d80";
  context.fillRect(70, 1188, 630, 2);
  label(context, siteLabel, 70, 1254, 31, colors.cream, {
    font: monoFont,
    maxWidth: 630,
    weight: 600,
  });
  label(context, `${projectCopyright}｜小卡設計`, 70, 1304, 28, colors.cream, { weight: 650 });

  roundedFill(context, 798, 1002, 214, 214, 16, "#ffffff");
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(qr, 813, 1017, 185, 185);
  context.restore();
  context.textAlign = "center";
  label(context, "掃描前往網站", 905, 1254, 25, colors.cream);
  context.textAlign = "left";
}

export async function drawShareCard({ name, photo, qrSource, siteLabel }: ShareCardInput): Promise<Blob> {
  if (photo) await validatePhoto(photo);
  const photoSource = photo ? URL.createObjectURL(photo) : undefined;

  try {
    const [portrait, city, qr, avatar] = await Promise.all([
      loadImage("/images/liu-wen-hsuan-portrait.webp"),
      loadImage("/images/liu-neighborhood-day.webp"),
      loadImage(qrSource),
      photoSource
        ? loadImage(photoSource).catch(() => { throw new Error("照片無法讀取，請選擇其他照片。"); })
        : undefined,
      document.fonts.ready,
    ]);
    if (avatar && avatar.naturalWidth * avatar.naturalHeight > 50_000_000) {
      throw new Error("照片尺寸太大，請選擇較小的照片。");
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("此瀏覽器無法產生分享卡片。");
    context.imageSmoothingQuality = "high";

    drawBackground(context);
    drawCampaign(context, portrait, city);
    drawSignature(context, name, avatar);
    drawFooter(context, qr, siteLabel);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("分享卡片輸出失敗，請再試一次。"));
      }, "image/png");
    });
  } finally {
    if (photoSource) URL.revokeObjectURL(photoSource);
  }
}
