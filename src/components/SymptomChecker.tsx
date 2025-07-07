
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Phone, Stethoscope, Activity, Heart, Brain, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PossibleCondition {
  condition: string;
  probability: number;
  description: string;
}

interface SymptomResult {
  possibleConditions: PossibleCondition[];
  urgency: 'low' | 'moderate' | 'high' | 'emergency';
  recommendations: string[];
  followUpQuestions?: string[];
  seekImmediateCare: boolean;
  disclaimer: string;
}

interface FollowUpQuestion {
  question: string;
  answer: string;
}

const SymptomChecker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [symptoms, setSymptoms] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [currentFollowUpAnswer, setCurrentFollowUpAnswer] = useState('');
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(-1);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'input' | 'followup' | 'results'>('input');

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
          followUpQuestions,
          userId: user?.id
        }
      });

      if (error) throw error;

      setResult(data);
      setStage('results');

      // If there are follow-up questions and we haven't answered them yet
      if (data.followUpQuestions && data.followUpQuestions.length > 0 && followUpQuestions.length === 0) {
        setStage('followup');
        setCurrentFollowUpIndex(0);
      }
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

  const handleFollowUpAnswer = () => {
    if (!currentFollowUpAnswer.trim()) return;

    const newFollowUp = {
      question: result?.followUpQuestions?.[currentFollowUpIndex] || '',
      answer: currentFollowUpAnswer
    };

    const updatedFollowUps = [...followUpQuestions, newFollowUp];
    setFollowUpQuestions(updatedFollowUps);
    setCurrentFollowUpAnswer('');

    if (currentFollowUpIndex < (result?.followUpQuestions?.length || 0) - 1) {
      setCurrentFollowUpIndex(currentFollowUpIndex + 1);
    } else {
      // Re-analyze with follow-up answers
      analyzeWithFollowUp(updatedFollowUps);
    }
  };

  const analyzeWithFollowUp = async (followUps: FollowUpQuestion[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-symptom-analysis', {
        body: {
          symptoms,
          followUpQuestions: followUps,
          userId: user?.id
        }
      });

      if (error) throw error;
      setResult(data);
      setStage('results');
    } catch (error) {
      console.error('Error analyzing with follow-up:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to complete analysis. Please contact a healthcare provider.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChecker = () => {
    setSymptoms('');
    setFollowUpQuestions([]);
    setCurrentFollowUpAnswer('');
    setCurrentFollowUpIndex(-1);
    setResult(null);
    setStage('input');
  };


  const handleEmergencyServices = () => {
    // Navigate to contact doctor page
    navigate('/contact-doctor');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'moderate': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'high': return <Heart className="h-6 w-6 text-orange-600" />;
      case 'moderate': return <Activity className="h-6 w-6 text-yellow-600" />;
      default: return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
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

  if (stage === 'followup' && result?.followUpQuestions) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-6 w-6 text-primary" />
            Follow-up Questions
          </CardTitle>
          <p className="text-muted-foreground">
            Please answer these questions for a more accurate analysis
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-3">
              {result.followUpQuestions[currentFollowUpIndex]}
            </h3>
            <Textarea
              value={currentFollowUpAnswer}
              onChange={(e) => setCurrentFollowUpAnswer(e.target.value)}
              placeholder="Please provide details..."
              className="mb-4"
            />
            <Button 
              onClick={handleFollowUpAnswer}
              disabled={!currentFollowUpAnswer.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {currentFollowUpIndex < result.followUpQuestions.length - 1 ? 'Next Question' : 'Complete Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stage === 'results' && result) {
    return (
      <Card className={`w-full max-w-4xl mx-auto border-2 ${getUrgencyColor(result.urgency)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            {getUrgencyIcon(result.urgency)}
            AI Symptom Analysis Results
            <Badge variant={result.urgency === 'emergency' ? 'destructive' : 'default'}>
              {result.urgency.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Possible Conditions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Possible Conditions:</h3>
            <div className="grid gap-3">
              {result.possibleConditions.map((condition, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{condition.condition}</h4>
                    <Badge variant="secondary">{condition.probability}% likelihood</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{condition.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Recommendations:</h3>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Alert */}
          {result.urgency === 'emergency' && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Emergency Alert</span>
              </div>
              <p className="text-red-700 mb-3">
                Your symptoms may indicate a serious medical emergency. Please seek immediate medical attention.
              </p>
              <Button 
                onClick={handleEmergencyServices}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Emergency Services
              </Button>
            </div>
          )}

          {/* Medical Attention Recommended */}
          {result.seekImmediateCare && result.urgency !== 'emergency' && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Medical Attention Recommended</span>
              </div>
              <p className="text-yellow-700 mb-3">
                Based on your symptoms, we recommend contacting your healthcare provider.
              </p>
              <Button 
                onClick={handleEmergencyServices}
                variant="outline" 
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 w-full"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Contact Your Doctor
              </Button>
            </div>
          )}

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
            placeholder={t('symptomChecker.placeholder')}
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
