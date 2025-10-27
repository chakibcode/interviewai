-- Storage policies for cv2interviewBucket
-- IMPORTANT: Run this in your Supabase SQL Editor with the service role key
-- Go to Settings > API > Copy the service_role key and use it in the SQL Editor

-- First, create the bucket if it doesn't exist (run this in Storage section or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cv2interviewBucket', 'cv2interviewBucket', false);

-- Storage policies for cv2interviewBucket
-- These policies allow authenticated users to manage files in the cv2interviewBucket

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to cv2interviewBucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cv2interviewBucket' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to view files
CREATE POLICY "Allow authenticated reads from cv2interviewBucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cv2interviewBucket' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to cv2interviewBucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cv2interviewBucket' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'cv2interviewBucket' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from cv2interviewBucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cv2interviewBucket' 
  AND auth.role() = 'authenticated'
);