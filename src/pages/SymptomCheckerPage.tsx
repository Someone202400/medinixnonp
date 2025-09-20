
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EnhancedSymptomChecker from '@/components/EnhancedSymptomChecker';

const SymptomCheckerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-4 pb-20 md:pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex justify-center">
          <EnhancedSymptomChecker />
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerPage;
