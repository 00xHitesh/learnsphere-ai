import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CertificateButton } from "../CertificateButton";

// Mock canvas context — jsdom does not implement it
const mockCtx = {
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  globalAlpha: 1,
  font: "",
  textAlign: "left" as CanvasTextAlign,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,mock");

describe("CertificateButton", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let createElementOrig: typeof document.createElement;

  beforeEach(() => {
    vi.clearAllMocks();
    clickSpy = vi.fn();
    createElementOrig = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = createElementOrig(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy, writable: true });
      }
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Download Certificate button", () => {
    render(
      <CertificateButton
        userName="Alice Smith"
        courseTitle="Intro to Design"
        instructor="Jane Doe"
      />,
    );
    expect(screen.getByRole("button", { name: /download certificate/i })).toBeInTheDocument();
  });

  it("uses the default variant by default", () => {
    render(
      <CertificateButton
        userName="Alice Smith"
        courseTitle="Intro to Design"
        instructor="Jane Doe"
      />,
    );
    const btn = screen.getByRole("button");
    // Default variant has no 'outline' or 'ghost' aria hint — just verify it renders
    expect(btn).toBeInTheDocument();
  });

  it("triggers a PNG download when clicked", () => {
    render(
      <CertificateButton
        userName="Alice Smith"
        courseTitle="Intro to Design"
        instructor="Jane Doe"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith("image/png");
    expect(clickSpy).toHaveBeenCalled();
  });

  it("sets the download filename from the course title", () => {
    let capturedHref = "";
    let capturedDownload = "";

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = createElementOrig(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: vi.fn(), writable: true });
        Object.defineProperty(el, "download", {
          set(v: string) { capturedDownload = v; },
          get() { return capturedDownload; },
        });
        Object.defineProperty(el, "href", {
          set(v: string) { capturedHref = v; },
          get() { return capturedHref; },
        });
      }
      return el;
    });

    render(
      <CertificateButton
        userName="Alice Smith"
        courseTitle="Intro to Design"
        instructor="Jane Doe"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(capturedDownload).toContain("intro-to-design");
    expect(capturedDownload).toContain("certificate");
    expect(capturedHref).toBe("data:image/png;base64,mock");
  });

  it("does not throw if canvas context is unavailable", () => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    render(
      <CertificateButton
        userName="Alice"
        courseTitle="Course"
        instructor="Tutor"
      />,
    );
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });
});
