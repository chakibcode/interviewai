import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";

function App() {
  useEffect(() => {
    const sendHeight = () => {
      const root = document.getElementById("root");
      if (root) {
        parent.postMessage({ height: root.scrollHeight }, "*");
      }
    };

    const resizeObserver = new ResizeObserver(sendHeight);
    const root = document.getElementById("root");
    if (root) {
      resizeObserver.observe(root);
    }

    return () => {
      if (root) {
        resizeObserver.unobserve(root);
      }
    };
  }, []);

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

export default App;
