#!/usr/bin/env python3
"""
Test script for the PDF to image conversion endpoint
"""
import requests
import os

def test_pdf_to_image_endpoint():
    """Test the PDF to image conversion endpoint"""
    
    # API endpoint
    url = "http://localhost:8000/cv/convert-to-image"
    
    # Check if we have any PDF files in uploads directory
    uploads_dir = "uploads"
    pdf_files = []
    
    if os.path.exists(uploads_dir):
        pdf_files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found in uploads directory.")
        print("Please upload a CV first using the /cv/upload endpoint or place a PDF file in the uploads directory.")
        return
    
    # Use the first PDF file found
    pdf_file = pdf_files[0]
    pdf_path = os.path.join(uploads_dir, pdf_file)
    
    print(f"Testing with PDF file: {pdf_path}")
    
    # Test different configurations
    test_configs = [
        {"page": 1, "width": 300, "height": 400, "format": "PNG"},
        {"page": 1, "width": 200, "height": 300, "format": "JPEG"},
        {"page": 1, "width": 150, "height": 200, "format": "WEBP"},
    ]
    
    for i, config in enumerate(test_configs):
        print(f"\nTest {i+1}: {config}")
        
        try:
            with open(pdf_path, 'rb') as f:
                files = {'file': (pdf_file, f, 'application/pdf')}
                params = config
                
                response = requests.post(url, files=files, params=params)
                
                if response.status_code == 200:
                    # Save the image
                    output_filename = f"test_output_{i+1}.{config['format'].lower()}"
                    with open(output_filename, 'wb') as img_file:
                        img_file.write(response.content)
                    
                    print(f"✅ Success! Image saved as {output_filename}")
                    print(f"   Content-Type: {response.headers.get('content-type')}")
                    print(f"   File size: {len(response.content)} bytes")
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"   Response: {response.text}")
                    
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_pdf_to_image_endpoint()