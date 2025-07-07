
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationManager from "./components/NotificationManager";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SymptomCheckerPage from "./pages/SymptomCheckerPage";
import MedicationLibraryPage from "./pages/MedicationLibraryPage";
import AddMedicationPage from "./pages/AddMedicationPage";
import ContactDoctorPage from "./pages/ContactDoctorPage";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationManager>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/symptom-checker" element={
                <ProtectedRoute>
                  <SymptomCheckerPage />
                </ProtectedRoute>
              } />
              <Route path="/medication-library" element={
                <ProtectedRoute>
                  <MedicationLibraryPage />
                </ProtectedRoute>
              } />
              <Route path="/add-medication" element={
                <ProtectedRoute>
                  <AddMedicationPage />
                </ProtectedRoute>
              } />
              <Route path="/contact-doctor" element={
                <ProtectedRoute>
                  <ContactDoctorPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationManager>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
