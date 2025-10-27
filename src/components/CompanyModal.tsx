import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

type CompanyModalProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreate?: (data: {
    name: string;
    legal: string;
    description: string;
    industry: string;
    location: string;
    logo?: string;
  }) => void;
};

export default function CompanyModal({ open, onOpenChange, onCreate }: CompanyModalProps) {
  const [name, setName] = useState("");
  const [legal, setLegal] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setLogoUrl(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate?.({ name, legal, description, industry, location, logo: logoUrl });
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>Fill the fields and click Create.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={logoUrl} />
              <AvatarFallback>Logo</AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload Company Logo
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              placeholder="Enter company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_legal">Company Legal</Label>
            <Input
              id="company_legal"
              placeholder="Enter company legal here"
              value={legal}
              onChange={(e) => setLegal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_desc">Input Label</Label>
            <Textarea
              id="company_desc"
              placeholder="Enter company description here"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="text-xs text-muted-foreground text-right">0/50</div>
          </div>

          <div className="space-y-2">
            <Label>Company Industry</Label>
            <Input
              placeholder="Enter company industry fields here"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Company Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select company location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="San Francisco">San Francisco</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="Paris">Paris</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}