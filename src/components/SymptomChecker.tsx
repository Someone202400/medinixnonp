import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Condition {
  name: string;
  probability: number;
  description: string;
}

interface AnalysisResult {
  conditions: Condition[];
  nextSteps: string[];
  disclaimer: string;
}

const SymptomChecker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Please enter symptoms",
        description: "Describe your symptoms to get an AI analysis.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-symptom-analysis', {
        body: {
          symptoms,
          userId: user?.id
        }
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to analyze symptoms. Please try again or contact a healthcare provider.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChecker = () => {
    setSymptoms('');
    setResult(null);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <Brain className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium">{t('symptomChecker.analyzing')}</p>
            <p className="text-sm text-muted-foreground mt-2">AI is analyzing your symptoms...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Brain className="h-6 w-6 text-primary" />
            AI Symptom Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Possible Conditions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Possible Conditions:</h3>
            <div className="grid gap-3">
              {result.conditions.map((condition, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{condition.name}</h4>
                    <Badge variant="secondary">{condition.probability}% likelihood</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{condition.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Next Steps:</h3>
            <ul className="space-y-2">
              {result.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={resetChecker} variant="outline" className="flex-1">
              New Analysis
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Disclaimer:</strong> {result.disclaimer}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initial symptom input stage
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-6 w-6 text-primary" />
          {t('symptomChecker.title')}
        </CardTitle>
        <p className="text-muted-foreground">
          {t('symptomChecker.description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-medium">
            {t('symptomChecker.enterSymptoms')}
          </label>
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., I have a headache and feel dizzy"
            className="min-h-[120px]"
          />
          <Button 
            onClick={analyzeSymptoms}
            disabled={!symptoms.trim() || loading}
            className="w-full"
            size="lg"
          >
            <Brain className="h-4 w-4 mr-2" />
            {loading ? t('symptomChecker.analyzing') : t('symptomChecker.analyze')}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>Disclaimer:</strong> {t('symptomChecker.disclaimer')}
        </div>
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;
