
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Heart, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SymptomQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'scale' | 'text';
  options?: string[];
  required: boolean;
}

const symptomQuestions: SymptomQuestion[] = [
  {
    id: 'main_symptom',
    question: 'What is your main symptom or concern?',
    type: 'text',
    required: true
  },
  {
    id: 'pain_level',
    question: 'On a scale of 1-10, how would you rate your pain/discomfort?',
    type: 'scale',
    required: true
  },
  {
    id: 'duration',
    question: 'How long have you been experiencing this symptom?',
    type: 'multiple-choice',
    options: ['Less than 1 day', '1-3 days', '1 week', '2-4 weeks', 'More than 1 month'],
    required: true
  },
  {
    id: 'severity',
    question: 'How would you describe the severity?',
    type: 'multiple-choice',
    options: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
    required: true
  },
  {
    id: 'additional_symptoms',
    question: 'Do you have any additional symptoms? (Please describe)',
    type: 'text',
    required: false
  }
];

const SymptomChecker: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    const currentQ = symptomQuestions[currentQuestion];
    if (currentQ.required && !responses[currentQ.id]) {
      toast({
        title: "Required Field",
        description: "Please answer this question before proceeding.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentQuestion < symptomQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      analyzeSymptoms();
    }
  };

  const analyzeSymptoms = async () => {
    setIsLoading(true);
    
    try {
      // Create symptom analysis using simple rule-based logic
      const mainSymptom = responses.main_symptom?.toLowerCase() || '';
      const painLevel = parseInt(responses.pain_level) || 0;
      const severity = responses.severity || '';
      const duration = responses.duration || '';
      
      let possibleConditions = [];
      let urgencyLevel = 'low';
      let recommendations = [];

      // Simple symptom analysis logic
      if (mainSymptom.includes('chest pain') || mainSymptom.includes('heart')) {
        possibleConditions.push('Cardiovascular concern');
        urgencyLevel = 'high';
        recommendations.push('Seek immediate medical attention');
      } else if (mainSymptom.includes('headache')) {
        possibleConditions.push('Tension headache', 'Migraine');
        urgencyLevel = painLevel > 7 ? 'medium' : 'low';
        recommendations.push('Rest in a quiet, dark room', 'Stay hydrated');
      } else if (mainSymptom.includes('fever')) {
        possibleConditions.push('Viral infection', 'Bacterial infection');
        urgencyLevel = 'medium';
        recommendations.push('Rest and hydration', 'Monitor temperature');
      } else {
        possibleConditions.push('General symptom assessment needed');
        urgencyLevel = painLevel > 8 ? 'high' : 'low';
        recommendations.push('Monitor symptoms');
      }

      // Adjust urgency based on severity and duration
      if (severity === 'Very Severe' || painLevel > 8) {
        urgencyLevel = 'high';
      }

      const analysisResult = {
        possibleConditions,
        urgencyLevel,
        recommendations: recommendations.concat([
          'This is not a substitute for professional medical advice',
          'Consult with a healthcare provider for proper diagnosis',
          'Call emergency services if symptoms worsen'
        ]),
        confidence: 0.7
      };

      // Save to database
      const { error } = await supabase
        .from('symptom_sessions')
        .insert({
          user_id: user?.id,
          symptoms: { main_symptom: mainSymptom, pain_level: painLevel, severity, duration },
          responses,
          ai_analysis: analysisResult,
          recommendations: analysisResult.recommendations.join('; ')
        });

      if (error) {
        console.error('Error saving symptom session:', error);
      }

      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to analyze symptoms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetChecker = () => {
    setCurrentQuestion(0);
    setResponses({});
    setAnalysis(null);
  };

  if (analysis) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Symptom Analysis Results
          </CardTitle>
          <CardDescription>
            Based on your responses, here's our preliminary assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Important Disclaimer</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  This analysis is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider.
                </p>
              </div>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="flex items-center gap-2">
            <Label>Urgency Level:</Label>
            <Badge 
              variant={analysis.urgencyLevel === 'high' ? 'destructive' : 
                      analysis.urgencyLevel === 'medium' ? 'default' : 'secondary'}
            >
              {analysis.urgencyLevel.toUpperCase()}
            </Badge>
          </div>

          {/* Possible Conditions */}
          <div>
            <Label className="text-base font-semibold">Possible Conditions:</Label>
            <div className="mt-2 space-y-1">
              {analysis.possibleConditions.map((condition: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-blue-500" />
                  <span>{condition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <Label className="text-base font-semibold">Recommendations:</Label>
            <div className="mt-2 space-y-2">
              {analysis.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={resetChecker} variant="outline">
              Start New Assessment
            </Button>
            <Button onClick={() => window.open('tel:911', '_self')} variant="destructive">
              Call Emergency Services
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = symptomQuestions[currentQuestion];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Symptom Checker
        </CardTitle>
        <CardDescription>
          Answer a few questions to get personalized health insights
        </CardDescription>
        <div className="flex items-center gap-2 mt-4">
          <Clock className="h-4 w-4" />
          <span className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {symptomQuestions.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-semibold">{currentQ.question}</Label>
          {currentQ.required && <span className="text-red-500 ml-1">*</span>}
          
          <div className="mt-3">
            {currentQ.type === 'text' && (
              <Textarea
                value={responses[currentQ.id] || ''}
                onChange={(e) => handleResponse(currentQ.id, e.target.value)}
                placeholder="Please describe your symptoms..."
                className="min-h-20"
              />
            )}
            
            {currentQ.type === 'scale' && (
              <div className="space-y-2">
                <Input
                  type="range"
                  min="1"
                  max="10"
                  value={responses[currentQ.id] || '1'}
                  onChange={(e) => handleResponse(currentQ.id, e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 (Minimal)</span>
                  <span>Current: {responses[currentQ.id] || '1'}</span>
                  <span>10 (Severe)</span>
                </div>
              </div>
            )}
            
            {currentQ.type === 'multiple-choice' && (
              <div className="space-y-2">
                {currentQ.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={option}
                      name={currentQ.id}
                      value={option}
                      checked={responses[currentQ.id] === option}
                      onChange={(e) => handleResponse(currentQ.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <Label htmlFor={option} className="cursor-pointer">{option}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {currentQuestion > 0 && (
            <Button 
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              variant="outline"
            >
              Previous
            </Button>
          )}
          <Button 
            onClick={nextQuestion}
            disabled={isLoading}
            className="ml-auto"
          >
            {isLoading ? 'Analyzing...' : 
             currentQuestion === symptomQuestions.length - 1 ? 'Analyze Symptoms' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;
