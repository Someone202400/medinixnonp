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
        title: "Error",
        description: "Please enter your symptoms.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-symptom-analysis', {
        body: {
          symptoms,
          userId: user?.id || 'anonymous'
        }
      });

      if (error) {
        const errorResponse = error?.context?.response ? await error.context.response.json() : null;
        console.log('Supabase function error response:', errorResponse); // Debug log
        throw new Error(errorResponse?.message || error.message || 'Unknown error');
      }

      console.log('Supabase function data:', data); // Debug log
      if (!data?.conditions || !data?.nextSteps || !data?.disclaimer) {
        throw new Error('Invalid response format from AI');
      }

      setResult(data);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error.message.includes('rate_limit_exceeded')
          ? 'Symptom analysis is temporarily unavailable due to API limits. Please try again later.'
          : error.message.includes('No symptoms provided')
          ? 'Please provide symptoms to analyze.'
          : error.message || 'Unable to analyze symptoms. Please try again or consult a healthcare provider.',
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
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <Brain className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Analyzing...</p>
          <p className="text-sm text-muted-foreground mt-2">Processing your symptoms...</p>
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
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Possible Conditions:</h3>
            <div className="grid gap-3">
              {result.conditions.map((condition, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{condition.name}</h4>
                    <Badge variant="secondary">{Math.round(condition.probability * 100)}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{condition.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Next Steps:</h3>
            <ul className="space-y-2">
              {result.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={resetChecker} variant="outline" className="w-full">
            New Analysis
          </Button>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Disclaimer:</strong> {result.disclaimer}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-6 w-6 text-primary" />
          Symptom Checker
        </CardTitle>
        <p className="text-muted-foreground">
          Enter your symptoms for an AI-powered analysis.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-medium">
            Describe your symptoms:
          </label>
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., I have a headache and feel tired"
            className="min-h-[120px]"
          />
          <Button 
            onClick={analyzeSymptoms}
            disabled={loading || !symptoms.trim()}
            className="w-full"
            size="lg"
          >
            <Brain className="h-4 w-4 mr-2" />
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>Disclaimer:</strong> This tool is not a substitute for professional medical advice.
        </div>
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;
