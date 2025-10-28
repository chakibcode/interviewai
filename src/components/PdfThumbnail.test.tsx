import { render, screen } from "@testing-library/react";
import PdfThumbnail from "./PdfThumbnail";
import * as pdfjs from "pdfjs-dist";

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  getDocument: jest.fn(),
}));

describe("PdfThumbnail", () => {
  it("renders the PDF thumbnail", async () => {
    const getPage = jest.fn().mockResolvedValue({
      getViewport: jest.fn().mockReturnValue({ width: 100, height: 150 }),
      render: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    });
    (pdfjs.getDocument as jest.Mock).mockReturnValue({
      promise: Promise.resolve({ getPage }),
    });

    render(<PdfThumbnail url="/test.pdf" height={100} />);
    const canvas = await screen.findByRole("img");
    expect(document.body.contains(canvas)).toBe(true);
  });
});