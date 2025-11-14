
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ScanPage from "./pages/ScanPage";
import BatchScanPage from "./pages/BatchScanPage";
import CoursesPage from "./pages/CoursesPage";
import SettingsPage from "./pages/SettingsPage";
import ManualAttendancePage from "./pages/ManualAttendancePage";
import StockPredictionPage from "./pages/StockPredictionPage";
import BacktestingPage from "./pages/BacktestingPage";
import OpportunityScannerPage from "./pages/OpportunityScannerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/batch-scan" element={<BatchScanPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/manual-attendance" element={<ManualAttendancePage />} />
          <Route path="/stock-prediction" element={<StockPredictionPage />} />
          <Route path="/backtesting" element={<BacktestingPage />} />
          <Route path="/opportunity-scanner" element={<OpportunityScannerPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
