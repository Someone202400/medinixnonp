
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Phone, Stethoscope, Activity, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'scale' | 'multiple_choice';
  options?: string[];
}

interface SymptomResult {
  severity: 'low' | 'moderate' | 'high' | 'emergency';
  recommendations: string[];
  seekMedicalAttention: boolean;
}

const questions: Question[] = [
  {
    id: 'chest_pain',
    text: 'Are you experiencing chest pain or discomfort?',
    type: 'yes_no'
  },
  {
    id: 'breathing_difficulty',
    text: 'Are you having difficulty breathing or shortness of breath?',
    type: 'yes_no'
  },
  {
    id: 'pain_level',
    text: 'On a scale of 1-10, how would you rate your overall pain level?',
    type: 'scale'
  },
  {
    id: 'fever',
    text: 'Do you have a fever (temperature above 100.4°F/38°C)?',
    type: 'yes_no'
  },
  {
    id: 'duration',
    text: 'How long have you been experiencing these symptoms?',
    type: 'multiple_choice',
    options: ['Less than 1 hour', '1-6 hours', '6-24 hours', 'More than 24 hours']
  },
  {
    id: 'nausea_vomiting',
    text: 'Are you experiencing nausea or vomiting?',
    type: 'yes_no'
  },
  {
    id: 'dizziness',
    text: 'Are you feeling dizzy or lightheaded?',
    type: 'yes_no'
  }
];

const SymptomChecker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleResponse = (response: any) => {
    const newResponses = { ...responses, [currentQuestion.id]: response };
    setResponses(newResponses);

    if (isLastQuestion) {
      analyzeSymptoms(newResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const analyzeSymptoms = async (allResponses: Record<string, any>) => {
    setLoading(true);
    
    try {
      // Simple rule-based analysis
      let severity: SymptomResult['severity'] = 'low';
      const recommendations: string[] = [];
      let seekMedicalAttention = false;

      // Emergency conditions
      if (allResponses.chest_pain === 'yes' && allResponses.breathing_difficulty === 'yes') {
        severity = 'emergency';
        recommendations.push('Call emergency services immediately');
        recommendations.push('These symptoms may indicate a serious cardiac or respiratory emergency');
        seekMedicalAttention = true;
      } else if (allResponses.pain_level >= 8) {
        severity = 'emergency';
        recommendations.push('Seek immediate medical attention');
        recommendations.push('Severe pain requires urgent evaluation');
        seekMedicalAttention = true;
      } else if (allResponses.chest_pain === 'yes' || allResponses.breathing_difficulty === 'yes') {
        severity = 'high';
        recommendations.push('Contact your healthcare provider promptly');
        recommendations.push('Monitor symptoms closely');
        seekMedicalAttention = true;
      } else if (allResponses.fever === 'yes' && allResponses.duration === 'More than 24 hours') {
        severity = 'moderate';
        recommendations.push('Consider contacting your healthcare provider');
        recommendations.push('Continue monitoring your temperature');
        seekMedicalAttention = true;
      } else if (allResponses.pain_level >= 5) {
        severity = 'moderate';
        recommendations.push('Monitor symptoms and consider over-the-counter pain relief');
        recommendations.push('Contact healthcare provider if symptoms worsen');
      } else {
        severity = 'low';
        recommendations.push('Rest and stay hydrated');
        recommendations.push('Monitor symptoms and seek care if they worsen');
      }

      // Additional recommendations based on specific symptoms
      if (allResponses.nausea_vomiting === 'yes') {
        recommendations.push('Stay hydrated with small sips of clear fluids');
      }
      if (allResponses.dizziness === 'yes') {
        recommendations.push('Avoid sudden movements and rest in a safe position');
      }

      const finalResult: SymptomResult = {
        severity,
        recommendations,
        seekMedicalAttention
      };

      setResult(finalResult);

      // Save to database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('symptom_sessions')
          .insert([{
            user_id: user.id,
            symptoms: Object.keys(allResponses).filter(key => allResponses[key] === 'yes'),
            responses: allResponses,
            recommendations: recommendations.join('; '),
            ai_analysis: {
              severity,
              seek_medical_attention: seekMedicalAttention
            }
          }]);

        if (error) {
          console.error('Error saving symptom session:', error);
        }
      }

    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your symptoms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChecker = () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setResult(null);
  };

  const handleEmergencyServices = () => {
    // Navigate to contact doctor page
    navigate('/contact-doctor');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'moderate': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
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
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium">Analyzing your symptoms...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className={`w-full max-w-2xl mx-auto border-2 ${getSeverityColor(result.severity)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            {getSeverityIcon(result.severity)}
            Symptom Analysis Results
            <Badge variant={result.severity === 'emergency' ? 'destructive' : 'default'}>
              {result.severity.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Recommendations:</h3>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {result.severity === 'emergency' && (
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

          {result.seekMedicalAttention && result.severity !== 'emergency' && (
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
              Take Another Assessment
            </Button>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Disclaimer:</strong> This symptom checker is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions you may have regarding a medical condition.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Heart className="h-6 w-6 text-blue-600" />
          Symptom Checker
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-3">{currentQuestion.text}</h3>
          
          <div className="space-y-3">
            {currentQuestion.type === 'yes_no' && (
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleResponse('yes')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Yes
                </Button>
                <Button 
                  onClick={() => handleResponse('no')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                >
                  No
                </Button>
              </div>
            )}

            {currentQuestion.type === 'scale' && (
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleResponse(num)}
                    variant={num <= 3 ? 'default' : num <= 6 ? 'secondary' : 'destructive'}
                    className="aspect-square"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleResponse(option)}
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {currentQuestionIndex > 0 && (
          <Button 
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            variant="outline"
          >
            Previous Question
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;
