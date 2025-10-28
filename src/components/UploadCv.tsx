import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/services/supabaseClient";
import { authService, type AuthUser } from "@/services/authService";
import { cvService, type Cv } from "@/services/cvService";
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
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>(undefined);
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
    onUploadChange?.(true);
    // Clear any previous extracted text
    onExtracted?.(null);
    
    try {
      // 1) Upload original PDF to backend (local storage)
      const uploadForm = new FormData();
      uploadForm.append("user_id", user.id);
      uploadForm.append("file", file, file.name);
      const uploadResp = await fetch("http://localhost:8001/cv/upload", {
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
      const pdfUrl = `${supabase.storage.from("cv2interviewBucket").getPublicUrl(pdfPath).data.publicUrl}`;

      // 2) Request extraction via new endpoint
      const extractResp = await fetch("http://localhost:8001/cv/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, cv_id: cvId, pdf_url: pdfUrl }),
      });
      if (!extractResp.ok) {
        const text = await extractResp.text();
        throw new Error(text || `HTTP ${extractResp.status}`);
      }
      const extractJson = await extractResp.json();
      // Prefer plain text extracted from backend when available
      const plainText = (extractJson?.text_extracted ?? "").trim();
      let extractedText: string;
      if (plainText && plainText.length > 0) {
        extractedText = plainText;
      } else {
        const payload = extractJson?.extracted_data && Object.keys(extractJson.extracted_data).length
          ? extractJson.extracted_data
          : (extractJson?.extracted_raw ?? extractJson);
        extractedText = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
      }
      onExtracted?.(extractedText);

      // 2b) Analyze structured fields by sending plain text to /openai/parse_cv
      try {
        const parseResp = await fetch("http://localhost:8001/openai/parse_cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText || plainText || "" }),
        });
        if (parseResp.ok) {
          const parsedJson = await parseResp.json();
          const structured = parsedJson ?? {};
          onAnalyzed?.(structured, cvId);
        } else {
          const text = await parseResp.text();
          console.warn("Parse CV failed:", text || parseResp.status);
        }
      } catch (err) {
        console.warn("Parse CV error:", err);
      }

      // 3) Convert the uploaded PDF to JPEG via backend
      const convertForm = new FormData();
      convertForm.append("file", file, file.name);
      const convertUrl = "http://localhost:8001/cv/convert-to-image?format=JPEG&width=300&height=300&quality=85";
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
  
      // 5) Get a signed URL for the PDF for display
      const { data, error } = await supabase.storage
        .from("cv2interviewBucket")
        .createSignedUrl(pdfPath, 600);
      if (error || !data?.signedUrl) throw new Error(error?.message || "Could not create PDF URL");
  
      onUploaded?.(data.signedUrl);
      toast({ title: "CV processed", description: "Text extracted and thumbnail created." });

      // Refresh CV list
      if (user) {
        const userCvs = await cvService.getCvs(user.id);
        setCvs(userCvs);
      }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? "Could not process CV.", variant: "destructive" });
    } finally {
      setUploading(false);
      onUploadChange?.(false);
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
          </div>
          <div className="text-xs text-muted-foreground">Accepted format: PDF, max 10MB.</div>
        </div>
        <div className="justify-self-end max-h-[50px] overflow-y-auto space-y-2">
          {pdfToRender && (
            <div className="border rounded-md p-2">
              <PdfThumbnail url={pdfToRender} height={50} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}