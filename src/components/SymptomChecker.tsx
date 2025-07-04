
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Heart, Stethoscope, Brain } from 'lucide-react';
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
    id: 'location',
    question: 'Where is the symptom located?',
    type: 'text',
    required: false
  },
  {
    id: 'triggers',
    question: 'What makes it better or worse?',
    type: 'text',
    required: false
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
      const mainSymptom = responses.main_symptom?.toLowerCase() || '';
      const painLevel = parseInt(responses.pain_level) || 0;
      const severity = responses.severity || '';
      const duration = responses.duration || '';
      const location = responses.location?.toLowerCase() || '';
      const triggers = responses.triggers?.toLowerCase() || '';
      
      let possibleConditions = [];
      let urgencyLevel = 'low';
      let recommendations = [];
      let confidence = 0.6;

      // Enhanced symptom analysis with more conditions
      if (mainSymptom.includes('chest pain') || mainSymptom.includes('heart') || mainSymptom.includes('cardiac')) {
        possibleConditions.push('Cardiac concerns', 'Angina pectoris', 'Costochondritis');
        urgencyLevel = 'high';
        recommendations.push('Seek immediate medical attention', 'Call emergency services if severe');
        confidence = 0.8;
      } else if (mainSymptom.includes('headache') || mainSymptom.includes('head pain')) {
        if (severity === 'Very Severe' || painLevel > 8) {
          possibleConditions.push('Migraine', 'Cluster headache', 'Secondary headache');
          urgencyLevel = 'medium';
          confidence = 0.75;
        } else {
          possibleConditions.push('Tension headache', 'Stress headache', 'Dehydration headache');
          urgencyLevel = 'low';
          confidence = 0.7;
        }
        recommendations.push('Rest in quiet, dark room', 'Stay hydrated', 'Consider over-the-counter pain relief');
      } else if (mainSymptom.includes('fever') || mainSymptom.includes('high temperature')) {
        possibleConditions.push('Viral infection', 'Bacterial infection', 'Inflammatory condition');
        if (painLevel > 7) {
          urgencyLevel = 'medium';
          recommendations.push('Monitor temperature closely', 'Seek medical attention if fever persists');
        } else {
          urgencyLevel = 'low';
          recommendations.push('Rest and hydration', 'Monitor symptoms');
        }
        confidence = 0.65;
      } else if (mainSymptom.includes('cough') || mainSymptom.includes('throat')) {
        if (duration.includes('More than 1 month')) {
          possibleConditions.push('Chronic cough', 'Post-viral cough', 'Respiratory condition');
          urgencyLevel = 'medium';
        } else {
          possibleConditions.push('Upper respiratory infection', 'Common cold', 'Viral pharyngitis');
          urgencyLevel = 'low';
        }
        recommendations.push('Stay hydrated', 'Rest voice', 'Consider throat lozenges');
        confidence = 0.7;
      } else if (mainSymptom.includes('stomach') || mainSymptom.includes('abdominal') || mainSymptom.includes('nausea')) {
        possibleConditions.push('Gastroenteritis', 'Indigestion', 'Food intolerance');
        if (severity === 'Very Severe') {
          urgencyLevel = 'medium';
          recommendations.push('Stay hydrated', 'Seek medical attention if symptoms worsen');
        } else {
          urgencyLevel = 'low';
          recommendations.push('Bland diet', 'Stay hydrated', 'Rest');
        }
        confidence = 0.65;
      } else if (mainSymptom.includes('joint') || mainSymptom.includes('muscle') || mainSymptom.includes('pain')) {
        possibleConditions.push('Musculoskeletal strain', 'Arthritis', 'Overuse injury');
        urgencyLevel = painLevel > 7 ? 'medium' : 'low';
        recommendations.push('Rest affected area', 'Apply ice or heat', 'Gentle movement when tolerated');
        confidence = 0.6;
      } else {
        possibleConditions.push('General symptom assessment needed', 'Non-specific symptoms');
        urgencyLevel = painLevel > 8 ? 'high' : 'low';
        recommendations.push('Monitor symptoms', 'Track changes');
        confidence = 0.5;
      }

      // Adjust urgency based on severity and duration
      if (severity === 'Very Severe' || painLevel > 8) {
        urgencyLevel = urgencyLevel === 'low' ? 'medium' : 'high';
      }

      if (duration.includes('More than 1 month') && urgencyLevel === 'low') {
        urgencyLevel = 'medium';
        recommendations.push('Consider consultation for persistent symptoms');
      }

      const analysisResult = {
        possibleConditions,
        urgencyLevel,
        recommendations: recommendations.concat([
          'This analysis is based on reported symptoms only',
          'Not a substitute for professional medical diagnosis',
          'Consult healthcare provider for proper evaluation',
          'Seek immediate care if symptoms suddenly worsen'
        ]),
        confidence
      };

      // Save to database
      const { error } = await supabase
        .from('symptom_sessions')
        .insert({
          user_id: user?.id,
          symptoms: { main_symptom: mainSymptom, pain_level: painLevel, severity, duration, location, triggers },
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
            <Brain className="h-5 w-5 text-blue-600" />
            AI Symptom Analysis Results
          </CardTitle>
          <CardDescription>
            Advanced analysis based on your responses (Confidence: {Math.round(analysis.confidence * 100)}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Medical Disclaimer */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Important Medical Disclaimer</h4>
                <p className="text-red-700 text-sm mt-1">
                  This AI analysis is for informational purposes only and should NOT replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for proper medical evaluation.
                </p>
              </div>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="flex items-center gap-2">
            <Label>Urgency Assessment:</Label>
            <Badge 
              variant={analysis.urgencyLevel === 'high' ? 'destructive' : 
                      analysis.urgencyLevel === 'medium' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {analysis.urgencyLevel.toUpperCase()} PRIORITY
            </Badge>
          </div>

          {/* Possible Conditions */}
          <div>
            <Label className="text-base font-semibold">Possible Conditions to Consider:</Label>
            <div className="mt-2 space-y-2">
              {analysis.possibleConditions.map((condition: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Stethoscope className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{condition}</span>
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

          <div className="flex gap-2 pt-4">
            <Button onClick={resetChecker} variant="outline">
              New Assessment
            </Button>
            <Button onClick={() => window.open('tel:911', '_self')} variant="destructive">
              Emergency Services
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
          <Brain className="h-5 w-5 text-blue-600" />
          AI Symptom Checker
        </CardTitle>
        <CardDescription>
          Advanced AI-powered symptom analysis with personalized insights
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
                placeholder="Please describe in detail..."
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
            {isLoading ? 'Analyzing with AI...' : 
             currentQuestion === symptomQuestions.length - 1 ? 'Analyze Symptoms' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;
