import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Heart, Phone, Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SymptomData {
  age: string;
  gender: string;
  primarySymptom: string;
  severity: string;
  duration: string;
  additionalSymptoms: string;
}

interface AnalysisResult {
  riskLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendations: string[];
  nextSteps: string[];
  disclaimer: string;
}

const SimpleSymptomChecker: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const [symptoms, setSymptoms] = useState<SymptomData>({
    age: '',
    gender: '',
    primarySymptom: '',
    severity: '',
    duration: '',
    additionalSymptoms: ''
  });

  const updateSymptoms = (field: keyof SymptomData, value: string) => {
    setSymptoms(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const analyzeSymptoms = async () => {
    setLoading(true);
    
    // Simulate analysis with timeout
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simple rule-based analysis
      const severity = parseInt(symptoms.severity) || 0;
      const emergencyKeywords = ['chest pain', 'difficulty breathing', 'severe headache'];
      const hasEmergencySymptom = emergencyKeywords.some(keyword => 
        symptoms.primarySymptom.toLowerCase().includes(keyword) ||
        symptoms.additionalSymptoms.toLowerCase().includes(keyword)
      );
      
      let riskLevel: 'low' | 'medium' | 'high' | 'emergency' = 'low';
      let recommendations: string[] = [];
      let nextSteps: string[] = [];
      
      if (hasEmergencySymptom || severity >= 9) {
        riskLevel = 'emergency';
        recommendations = [
          'Seek immediate emergency medical attention',
          'Call 911 or go to the nearest emergency room',
          'Do not drive yourself - have someone else drive or call an ambulance'
        ];
        nextSteps = [
          'Call emergency services immediately',
          'Stay calm and follow emergency operator instructions',
          'Have someone stay with you if possible'
        ];
      } else if (severity >= 7) {
        riskLevel = 'high';
        recommendations = [
          'Contact your healthcare provider today',
          'Monitor symptoms closely',
          'Consider urgent care if symptoms worsen'
        ];
        nextSteps = [
          'Schedule an appointment with your doctor within 24 hours',
          'Document symptom progression',
          'Prepare a list of current medications'
        ];
      } else if (severity >= 4) {
        riskLevel = 'medium';
        recommendations = [
          'Schedule an appointment with your healthcare provider',
          'Keep track of symptom patterns',
          'Rest and stay hydrated'
        ];
        nextSteps = [
          'Call your doctor\'s office to schedule an appointment',
          'Keep a symptom diary',
          'Continue monitoring for changes'
        ];
      } else {
        riskLevel = 'low';
        recommendations = [
          'Monitor symptoms and rest',
          'Stay hydrated and get adequate sleep',
          'Consider over-the-counter remedies if appropriate'
        ];
        nextSteps = [
          'Continue monitoring symptoms',
          'Contact your healthcare provider if symptoms persist or worsen',
          'Focus on self-care and rest'
        ];
      }
      
      const analysisResult: AnalysisResult = {
        riskLevel,
        recommendations,
        nextSteps,
        disclaimer: 'This analysis is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider for proper medical evaluation.'
      };
      
      setResult(analysisResult);
      setCurrentStep(4);
      
      toast({
        title: 'Analysis Complete',
        description: 'Your symptoms have been analyzed successfully.',
      });
      
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Please try again or consult a healthcare professional.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChecker = () => {
    setCurrentStep(1);
    setResult(null);
    setSymptoms({
      age: '',
      gender: '',
      primarySymptom: '',
      severity: '',
      duration: '',
      additionalSymptoms: ''
    });
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Basic Information</h3>
              <p className="text-muted-foreground">Tell us a bit about yourself</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={symptoms.age}
                  onChange={(e) => updateSymptoms('age', e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={symptoms.gender} onValueChange={(value) => updateSymptoms('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Primary Symptom</h3>
              <p className="text-muted-foreground">Describe your main concern</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-symptom">What is your main symptom or concern?</Label>
                <Input
                  id="primary-symptom"
                  value={symptoms.primarySymptom}
                  onChange={(e) => updateSymptoms('primarySymptom', e.target.value)}
                  placeholder="e.g., headache, stomach pain, cough"
                />
              </div>
              
              <div className="space-y-2">
                <Label>How severe is your discomfort? (1-10 scale)</Label>
                <Select value={symptoms.severity} onValueChange={(value) => updateSymptoms('severity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num <= 3 ? '(Mild)' : num <= 6 ? '(Moderate)' : num <= 8 ? '(Severe)' : '(Very Severe)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>How long have you had these symptoms?</Label>
                <Select value={symptoms.duration} onValueChange={(value) => updateSymptoms('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-than-hour">Less than 1 hour</SelectItem>
                    <SelectItem value="few-hours">A few hours</SelectItem>
                    <SelectItem value="today">Started today</SelectItem>
                    <SelectItem value="few-days">A few days</SelectItem>
                    <SelectItem value="week">About a week</SelectItem>
                    <SelectItem value="longer">Longer than a week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Additional Details</h3>
              <p className="text-muted-foreground">Any other symptoms or concerns?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="additional-symptoms">Other symptoms you're experiencing (optional)</Label>
                <Textarea
                  id="additional-symptoms"
                  value={symptoms.additionalSymptoms}
                  onChange={(e) => updateSymptoms('additionalSymptoms', e.target.value)}
                  placeholder="e.g., fever, nausea, fatigue, etc."
                  rows={4}
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        if (!result) return null;
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Analysis Results</h3>
              <Badge className={`text-lg px-4 py-2 ${getRiskBadgeColor(result.riskLevel)}`}>
                {result.riskLevel.toUpperCase()} PRIORITY
              </Badge>
            </div>
            
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Immediate Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Next Steps
                </h4>
                <ul className="space-y-2">
                  {result.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {result.riskLevel === 'emergency' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Emergency Contact</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button size="lg" className="bg-red-600 hover:bg-red-700" asChild>
                      <a href="tel:911">
                        <Phone className="h-4 w-4 mr-2" />
                        Call 911
                      </a>
                    </Button>
                    <span className="text-red-700">Or go to your nearest emergency room immediately</span>
                  </div>
                </div>
              )}
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium mb-1">Medical Disclaimer:</p>
                <p className="text-sm text-amber-700">{result.disclaimer}</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card/90 backdrop-blur-xl border-2 border-primary/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <Heart className="h-6 w-6 text-primary" />
            AI Symptom Checker
            {currentStep <= 3 && (
              <Badge variant="outline" className="ml-auto">
                Step {currentStep} of 3
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            {currentStep > 1 && currentStep <= 3 && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            
            {currentStep === 1 && <div />}
            
            {currentStep < 3 && (
              <Button onClick={nextStep} className="ml-auto">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 3 && (
              <Button onClick={analyzeSymptoms} disabled={loading} className="ml-auto">
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                {!loading && <Activity className="h-4 w-4 ml-2" />}
              </Button>
            )}
            
            {currentStep === 4 && (
              <Button onClick={resetChecker} variant="outline" className="ml-auto">
                Check New Symptoms
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleSymptomChecker;