import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import UploadCard from "./components/UploadCard";
import RetrieveCard from "./components/RetrieveCard";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import SuccessView from "./components/SuccessView";
import DownloadView from "./components/DownloadView";
import BackgroundShader from "./components/BackgroundShader";
import { FileMetadata } from "./types";
import { fetchFileInfo } from "./lib/api";
import { AlertTriangle } from "lucide-react";

type ViewState = "main" | "success" | "download" | "error";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("main");

  // Shared States
  const [successFile, setSuccessFile] = useState<FileMetadata | null>(null);
  const [deleteToken, setDeleteToken] = useState<string>("");

  const [downloadFile, setDownloadFile] = useState<FileMetadata | null>(null);
  const [initialCode, setInitialCode] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  // Refs for scrolling to Bento cards
  const bentoRef = useRef<HTMLDivElement>(null);

  // Check URL query parameters on initial mount (e.g. ?code=846251)
  useEffect(() => {
    const handleUrlQuery = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        setInitialCode(code);
        setCurrentView("main");

        try {
          // Look up code immediately on server
          const fileData = await fetchFileInfo(code.toUpperCase());
          setDownloadFile(fileData);
          setCurrentView("download");
        } catch (err: any) {
          setErrorText(
            err.message || "The secure link is invalid or has expired.",
          );
          setCurrentView("error");
        }
      }
    };

    handleUrlQuery();
  }, []);

  const handleNavigate = (view: "main" | "download-input") => {
    setErrorText("");
    if (view === "download-input") {
      setCurrentView("main");
      setTimeout(() => {
        scrollToBento();
      }, 100);
    } else {
      setCurrentView(view);
    }
  };

  const scrollToBento = () => {
    bentoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleUploadSuccess = (file: FileMetadata, delToken: string) => {
    setSuccessFile(file);
    setDeleteToken(delToken);
    setCurrentView("success");
  };

  const handleRetrieveSuccess = (file: FileMetadata) => {
    setDownloadFile(file);
    setCurrentView("download");
  };

  const resetToMain = () => {
    // Clear url query params securely
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setSuccessFile(null);
    setDeleteToken("");
    setDownloadFile(null);
    setInitialCode("");
    setErrorText("");
    setCurrentView("main");
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col relative overflow-x-hidden selection:bg-[#4cd7f6]/30">
      {/* GLOWING WebGL Background shader */}
      <BackgroundShader />

      {/* FIXED Top Header */}
      <Header onNavigate={handleNavigate} currentView={currentView} />

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-16 relative z-10">
        {currentView === "main" && (
          <div className="space-y-16">
            {/* Hero Section */}
            <Hero
              onUploadClick={scrollToBento}
              onRetrieveClick={scrollToBento}
            />

            {/* Interactive Bento Section */}
            <div
              ref={bentoRef}
              className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch pt-8"
            >
              {/* Upload Card - Span 7 */}
              <div className="md:col-span-7">
                <UploadCard onUploadSuccess={handleUploadSuccess} />
              </div>

              {/* Retrieve Card - Span 5 */}
              <div className="md:col-span-5">
                <RetrieveCard
                  onRetrieveSuccess={handleRetrieveSuccess}
                  initialCode={initialCode}
                />
              </div>
            </div>

            {/* How It Works Marketing Panel */}
            <HowItWorks />

            {/* Bento Features Grid */}
            <Features />

            {/* Collapsible FAQ Block */}
            <FAQ />
          </div>
        )}

        {currentView === "success" && successFile && (
          <SuccessView
            file={successFile}
            deleteToken={deleteToken}
            onReset={resetToMain}
          />
        )}

        {currentView === "download" && downloadFile && (
          <DownloadView file={downloadFile} onReset={resetToMain} />
        )}

        {currentView === "error" && (
          <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
            <div className="w-20 h-20 bg-[#93000a]/20 border border-[#93000a]/30 rounded-full flex items-center justify-center mx-auto text-[#ffb4ab]">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#ffb4ab]">
                Code Expired or Invalid
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                {errorText ||
                  "The transient link you are trying to access has been cleared from our systems, or it reached its download limit."}
              </p>
            </div>

            <button
              onClick={resetToMain}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono tracking-wider uppercase transition-all-smooth"
            >
              Return to Home Hub
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
