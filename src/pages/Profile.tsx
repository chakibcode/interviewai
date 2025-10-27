import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { authService, type AuthUser } from "@/services/authService";
import { supabase } from "@/services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProfileRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  plan_status: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
}

const Profile = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const cvBucket = "cv2interviewBucket"; // Make sure this bucket exists in Supabase Storage
  const cvObjectPath = useMemo(() => (user ? `${user.id}/cv.pdf` : null), [user]);

  useEffect(() => {
    const init = async () => {
      const u = await authService.getUser();
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      const { data: profData } = await supabase
        .from("profiles")
        .select(
          "user_id,email,full_name,avatar_url,plan,plan_status,last_login_at,created_at",
        )
        .eq("user_id", u.id)
        .maybeSingle();
      if (profData) setProfile(profData as ProfileRow);

      if (cvObjectPath) {
        // Try to get a signed URL if the CV exists
        const { data, error } = await supabase.storage
          .from(cvBucket)
          .createSignedUrl(cvObjectPath, 300);
        if (!error && data?.signedUrl) {
          setCvUrl(data.signedUrl);
        }
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const initials = (u: AuthUser | null) => {
    if (!u) return "U";
    if (u.fullName) {
      const parts = u.fullName.trim().split(/\s+/);
      return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
    }
    return u.email?.[0]?.toUpperCase() || "U";
  };

  const handleCvUpload = async (file: File) => {
    if (!user || !cvObjectPath) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from(cvBucket)
        .upload(cvObjectPath, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) throw new Error(uploadError.message);

      const { data, error: urlError } = await supabase.storage
        .from(cvBucket)
        .createSignedUrl(cvObjectPath, 600);
      if (urlError) throw new Error(urlError.message);
      setCvUrl(data.signedUrl);
      toast({ title: "CV uploaded", description: "Your CV has been uploaded successfully." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? "Could not upload CV.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Account Info</h2>
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName || user?.email} />
                <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                  {initials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div>
                  <div className="text-sm text-muted-foreground">Full name</div>
                  <div className="text-sm font-medium">{user?.fullName || profile?.full_name || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-sm font-medium">{user?.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Plan</div>
                  <div className="text-sm font-medium">{profile?.plan ?? "free"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last login</div>
                  <div className="text-sm font-medium">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "—"}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">CV Upload (PDF)</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCvUpload(f);
                  }}
                />
                <Button disabled={uploading} variant="hero" onClick={() => { /* no-op; upload triggers on select */ }}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Accepted format: PDF, max 10MB.</div>
              {cvUrl ? (
                <div className="flex items-center gap-3">
                  <a href={cvUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent underline">
                    View current CV
                  </a>
                  <span className="text-xs text-muted-foreground">(signed link, expires)</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No CV uploaded yet.</div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;