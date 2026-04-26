import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

interface Props {
  userName: string;
  courseTitle: string;
  instructor: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
  className?: string;
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseSize: number,
  style: string,
): string {
  for (let s = baseSize; s >= 16; s -= 2) {
    ctx.font = `${style} ${s}px Georgia, serif`;
    if (ctx.measureText(text).width <= maxWidth) return ctx.font;
  }
  ctx.font = `${style} 16px Georgia, serif`;
  return ctx.font;
}

function drawCertificate(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  { userName, courseTitle, instructor }: Omit<Props, "variant" | "size" | "className">,
) {
  const cx = W / 2;

  // ── Background ──────────────────────────────────────────────────
  ctx.fillStyle = "#FDFCF7";
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "rgba(255,248,210,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Borders ──────────────────────────────────────────────────────
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // ── Corner diamonds ───────────────────────────────────────────────
  const diamond = (x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = "#B8860B";
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  };
  diamond(25, 25);
  diamond(W - 25, 25);
  diamond(25, H - 25);
  diamond(W - 25, H - 25);

  // ── Horizontal rules ──────────────────────────────────────────────
  const hline = (x1: number, y: number, x2: number) => {
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  };

  hline(80, 96, W - 80);

  // ── Brand ─────────────────────────────────────────────────────────
  ctx.fillStyle = "#B8860B";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("L E A R N S P H E R E   A I", cx, 75);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "20px serif";
  ctx.fillText("✦", cx, 112);

  // ── Certificate title ─────────────────────────────────────────────
  ctx.fillStyle = "#1C1C1C";
  ctx.font = "italic 54px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Certificate of Completion", cx, 195);

  hline(100, 215, cx - 26);
  hline(cx + 26, 215, W - 100);
  ctx.fillStyle = "#B8860B";
  ctx.font = "14px serif";
  ctx.textAlign = "center";
  ctx.fillText("✦", cx, 221);

  // ── Preamble ──────────────────────────────────────────────────────
  ctx.fillStyle = "#888";
  ctx.font = "18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("This is to certify that", cx, 280);

  // ── Student name ──────────────────────────────────────────────────
  ctx.fillStyle = "#1A1A1A";
  fitText(ctx, userName, W - 160, 68, "bold italic");
  ctx.textAlign = "center";
  ctx.fillText(userName, cx, 370);

  const nw = ctx.measureText(userName).width;
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - nw / 2, 385);
  ctx.lineTo(cx + nw / 2, 385);
  ctx.stroke();

  // ── Body copy ─────────────────────────────────────────────────────
  ctx.fillStyle = "#888";
  ctx.font = "18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("has successfully completed the course", cx, 430);

  // ── Course title ──────────────────────────────────────────────────
  fitText(ctx, courseTitle, W - 200, 38, "bold");
  ctx.fillStyle = "#1C1C1C";
  ctx.textAlign = "center";
  ctx.fillText(courseTitle, cx, 490);

  // ── Bottom rule ───────────────────────────────────────────────────
  hline(80, 528, W - 80);

  // ── Signature lines ───────────────────────────────────────────────
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1;
  hline(120, 562, 270);
  hline(cx - 85, 562, cx + 85);
  hline(W - 270, 562, W - 120);

  // ── Footer labels ─────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const certId = `LS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const cols: Array<{ label: string; value: string; align: CanvasTextAlign; x: number }> = [
    { label: "INSTRUCTOR", value: instructor, align: "left", x: 120 },
    { label: "DATE ISSUED", value: today, align: "center", x: cx },
    { label: "CERTIFICATE ID", value: certId, align: "right", x: W - 120 },
  ];

  cols.forEach(({ label, value, align, x }) => {
    ctx.textAlign = align;
    ctx.fillStyle = "#AAA";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(label, x, 577);
    ctx.fillStyle = "#333";
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillText(value, x, 600);
  });

  // ── Watermark seal ────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#B8860B";
  ctx.font = "bold 220px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("✦", cx, 530);
  ctx.restore();
}

export function CertificateButton({
  userName,
  courseTitle,
  instructor,
  variant = "default",
  size,
  className,
}: Props) {
  function handleDownload() {
    const W = 1200;
    const H = 848;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCertificate(ctx, W, H, { userName, courseTitle, instructor });

    const link = document.createElement("a");
    link.download = `${courseTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleDownload}>
      <Award className="mr-2 h-4 w-4" /> Download Certificate
    </Button>
  );
}
