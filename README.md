# InterviewAI

InterviewAI is a web application designed to help users practice for job interviews. It provides a platform where users can upload their CV, practice interview questions, and receive feedback. The application is built with a modern tech stack, featuring a React frontend and a Python backend.

## Features

- **User Authentication:** Secure login and signup functionality.
- **Dashboard:** A personalized dashboard for each user.
- **CV Upload:** Users can upload their CV for analysis and personalized feedback.
- **Interview Practice:** An interactive interface to practice interview questions.
- **Theme Switcher:** A theme switcher for light and dark modes.

## Tech Stack

### Frontend

- **React:** A JavaScript library for building user interfaces.
- **Vite:** A fast build tool for modern web development.
- **TypeScript:** A typed superset of JavaScript.
- **Tailwind CSS:** A utility-first CSS framework.
- **Shadcn/ui:** A collection of reusable UI components.
- **Supabase:** Used for authentication and database management.

### Backend

- **Python:** A versatile programming language.
- **FastAPI:** A modern, fast (high-performance) web framework for building APIs with Python.

## Getting Started

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. **Navigate to the project directory:**
   ```sh
   cd interviewai
   ```

3. **Install the frontend dependencies:**
   ```sh
   npm install
   ```

4. **Start the frontend development server:**
   ```sh
   npm run dev
   ```

5. **Navigate to the backend directory:**
    ```sh
    cd backend
    ```

6. **Install the backend dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

7. **Start the backend server:**
    ```sh
    uvicorn app.main:app --reload
    ```

## Project Structure

The project is organized into two main directories:

- **`src/`:** Contains the frontend code, including components, pages, services, and styles.
- **`backend/`:** Contains the backend code, including the FastAPI application and related modules.
