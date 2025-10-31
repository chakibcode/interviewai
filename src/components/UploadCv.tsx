import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/services/supabaseClient";
import { authService, type AuthUser } from "@/services/authService";
import { cvService, type Cv } from "@/services/cvService";
import { BACKEND_URL } from "@/services/api";
import PdfThumbnail from "./PdfThumbnail";

interface UploadCvProps {
  onUploaded?: (url: string) => void;
  onExtracted?: (text: string | null) => void;
  onAnalyzed?: (data: any, cvId: string) => void;
  onUploadChange?: (uploading: boolean) => void;
  previewUrl?: string | null;
}

export default function UploadCv({ onUploaded, onExtracted, onAnalyzed, onUploadChange, previewUrl }: UploadCvProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>(undefined);
  const [extractedPreview, setExtractedPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const u = await authService.getUser();
      setUser(u);
      if (u) {
        const userCvs = await cvService.getCvs(u.id);
        setCvs(userCvs);
      }
    })();
  }, []);

  const handleCvUpload = async (file: File) => {
    // Immediately create a local preview URL for quick thumbnail display
    try {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(objectUrl);
    } catch {}

    if (!user) {
      toast({ title: "Login required", description: "Please login to upload your CV." });
      navigate("/login");
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(10);
    onUploadChange?.(true);
    // Clear any previous extracted text
    onExtracted?.(null);
    setExtractedPreview(null);
    
    try {
      // 1) Upload original PDF to backend (local storage)
      const uploadForm = new FormData();
      uploadForm.append("user_id", user.id);
      uploadForm.append("file", file, file.name);
      const uploadResp = await fetch(`${BACKEND_URL}/cv/upload`, {
        method: "POST",
        body: uploadForm,
      });
      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        throw new Error(text || `HTTP ${uploadResp.status}`);
      }
      const uploadJson: any = await uploadResp.json();
      const cvId = uploadJson?.cv_id ?? user.id;
      const pdfPath = uploadJson?.pdf_storage_path;
      const pdfUrl: string = uploadJson?.original_pdf_url || "";
      setProgress(30);

      // 2) Request extraction via new endpoint (multipart/form-data with the file)
      const extractForm = new FormData();
      extractForm.append("file", file, file.name);
      setExtractedPreview("Extracting text…");
      const extractResp = await fetch(`${BACKEND_URL}/cv/extract`, {
        method: "POST",
        headers: { Accept: "text/plain" },
        body: extractForm,
      });
      if (!extractResp.ok) {
        const text = await extractResp.text();
        setExtractedPreview(text || `Extraction failed (HTTP ${extractResp.status})`);
        throw new Error(text || `HTTP ${extractResp.status}`);
      }
      const extractedText = ((await extractResp.text()) || "").trim();
      onExtracted?.(extractedText);
      setExtractedPreview(extractedText);
      setProgress(60);
      

      // Parsing is handled in Dashboard via extractedText -> /openai/parse
      // Avoid duplicate requests here; just continue the flow

      // 3) Convert the uploaded PDF to JPEG via backend
      const convertForm = new FormData();
      convertForm.append("file", file, file.name);
      const convertUrl = `${BACKEND_URL}/cv/convert-to-image?format=JPEG&width=300&height=300&quality=85`;
      const resp = await fetch(convertUrl, { method: "POST", body: convertForm });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }
      const imageBlob = await resp.blob();

      // 4) Upload JPEG to Supabase Storage (bucket: cv2interviewBucket)
      const imgPath = `cv_image/${cvId}.jpeg`;
      const uploadRes = await supabase.storage
        .from("cv2interviewBucket")
        .upload(imgPath, imageBlob, { upsert: true, contentType: "image/jpeg" });
      if (uploadRes.error) throw new Error(uploadRes.error.message);
      setProgress(90);
  
      // 5) Use backend-served public URL for the uploaded PDF for preview
      if (pdfUrl) {
        onUploaded?.(pdfUrl);
      }
      // Success toast removed per user request: don't show this message again

      // Refresh CV list
      if (user) {
        const userCvs = await cvService.getCvs(user.id);
        setCvs(userCvs);
      }
      setProgress(100);
      
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? "Could not process CV.", variant: "destructive" });
      if (!extractedPreview) setExtractedPreview("Upload or extraction failed.");
    } finally {
      setUploading(false);
      onUploadChange?.(false);
      // Reset progress shortly after finishing
      setTimeout(() => setProgress(0), 600);
    }
  };

  // Revoke previously created local preview URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        try { URL.revokeObjectURL(localPreviewUrl); } catch {}
      }
    };
  }, [localPreviewUrl]);

  const pdfToRender = useMemo(() => {
    if (localPreviewUrl) return localPreviewUrl;
    if (previewUrl) return previewUrl;
    if (cvs.length > 0) return cvs[0].preview_url;
    return undefined;
  }, [localPreviewUrl, cvs, previewUrl]);

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Upload your CV (PDF)</h2>
            {!user && (
              <Link to="/login" className="text-xs text-accent underline">Login</Link>
            )}
          </div>
      <div className="flex items-center gap-3">
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await handleCvUpload(f);
          }}
        />
        <Button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-500 hover:bg-green-600 text-black"
        >
          {uploading ? "Uploading..." : "Upload CV"}
        </Button>
        {uploading && (
          <div className="flex-1">
            <Progress value={progress} className="h-2 bg-slate-200" />
          </div>
        )}
      </div>
          <div className="text-xs text-muted-foreground">Accepted format: PDF, max 10MB.</div>
          {/* Removed extracted text preview per user request */}
        </div>
        <div className="justify-self-end max-h-[200px] overflow-y-auto space-y-2">
          {pdfToRender && (
            <div className="rounded-md p-2">
              <PdfThumbnail url={pdfToRender} height={200} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}