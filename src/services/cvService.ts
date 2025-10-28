import { supabase } from './supabaseClient';

export interface Cv {
  cv_id: string;
  preview_url: string;
}

export const cvService = {
  async getCvs(userId: string): Promise<Cv[]> {
    const { data, error } = await supabase
      .from('cvs')
      .select('cv_id, pdf_storage_path')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching CVs:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    const cvsWithUrls = await Promise.all(
      data
        .filter(cv => cv.pdf_storage_path)
        .map(async cv => {
          const { data: publicUrlData } = await supabase.storage
            .from("cv2interviewBucket")
            .createSignedUrl(cv.pdf_storage_path, 600);

          return {
            cv_id: cv.cv_id,
            preview_url: publicUrlData?.signedUrl || "",
          };
        })
    );

    return cvsWithUrls.filter(cv => cv.preview_url);
  },
};