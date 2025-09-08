import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Heart, Phone, Clock, MapPin, Activity, Brain, ChevronRight, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Condition {
  name: string;
  probability: number;
  description: string;
}

interface AnalysisResult {
  conditions: Condition[];
  nextSteps: string[];
  disclaimer: string;
  riskLevel: 'low' | 'medium' | 'high' | 'emergency';
}

interface QuestionnaireData {
  // Basic info
  age: string;
  gender: string;
  primarySymptomLocation: string;
  severityRating: string;
  
  // Pain assessment
  painTypes: string[];
  painRadiation: boolean;
  
  // Timing
  symptomDuration: string;
  symptomProgression: string;
  timing: string;
  
  // Associated symptoms
  associatedSymptoms: string[];
  
  // Activity limitations
  activityLimitations: string[];
  
  // Medical history
  currentMedications: string;
  allergies: string;
  chronicConditions: string;
  
  // Recent events
  recentEvents: string[];
  
  // Additional details
  additionalDetails: string;
}

const PAIN_TYPES = [
  'Sharp/Stabbing', 'Dull/Aching', 'Throbbing', 'Burning', 'Cramping', 
  'Shooting', 'Pressure', 'Tingling', 'Numbness'
];

const ASSOCIATED_SYMPTOMS = [
  'Fever', 'Nausea', 'Vomiting', 'Dizziness', 'Fatigue', 'Shortness of breath',
  'Chest pain', 'Headache', 'Changes in vision', 'Difficulty swallowing',
  'Loss of appetite', 'Weight loss', 'Swelling', 'Skin changes'
];

const ACTIVITY_LIMITATIONS = [
  'Difficulty walking', 'Cannot sleep', 'Cannot eat normally', 'Cannot work',
  'Difficulty concentrating', 'Cannot exercise', 'Difficulty with daily tasks',
  'Pain interferes with relationships'
];

const RECENT_EVENTS = [
  'Recent travel', 'Recent injury', 'Started new medication', 'Increased stress',
  'Recent illness', 'Dietary changes', 'Sleep pattern changes', 'Physical overexertion'
];

const EnhancedSymptomChecker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    age: '',
    gender: '',
    primarySymptomLocation: '',
    severityRating: '',
    painTypes: [],
    painRadiation: false,
    symptomDuration: '',
    symptomProgression: '',
    timing: '',
    associatedSymptoms: [],
    activityLimitations: [],
    currentMedications: '',
    allergies: '',
    chronicConditions: '',
    recentEvents: [],
    additionalDetails: ''
  });

  const updateQuestionnaire = (field: string, value: any) => {
    setQuestionnaire(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setQuestionnaire(prev => {
      const currentValue = prev[field as keyof QuestionnaireData];
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [field]: currentValue.includes(item)
            ? currentValue.filter(i => i !== item)
            : [...currentValue, item]
        };
      }
      return prev;
    });
  };

  const nextStep = () => {
    if (currentStep < 7) {
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
    try {
      console.log('Starting symptom analysis...');
      
      // Save questionnaire data
      const { error: questionnaireError } = await supabase
        .from('symptom_questionnaires')
        .insert({
          user_id: user?.id || 'anonymous',
          session_id: crypto.randomUUID(),
          age: parseInt(questionnaire.age) || null,
          gender: questionnaire.gender,
          primary_symptom_location: questionnaire.primarySymptomLocation,
          severity_rating: parseInt(questionnaire.severityRating) || null,
          pain_type: questionnaire.painTypes,
          pain_radiation: questionnaire.painRadiation,
          symptom_duration: questionnaire.symptomDuration,
          symptom_progression: questionnaire.symptomProgression,
          associated_symptoms: questionnaire.associatedSymptoms,
          activity_limitations: questionnaire.activityLimitations,
          recent_events: questionnaire.recentEvents,
          questionnaire_data: questionnaire as any,
          completed_at: new Date().toISOString()
        });

      if (questionnaireError) {
        console.error('Error saving questionnaire:', questionnaireError);
      }

      // Create comprehensive symptom description
      const symptomDescription = `
        Patient: ${questionnaire.age} year old ${questionnaire.gender}
        Primary symptom: ${questionnaire.primarySymptomLocation}
        Severity: ${questionnaire.severityRating}/10
        Duration: ${questionnaire.symptomDuration}
        Progression: ${questionnaire.symptomProgression}
        Pain types: ${questionnaire.painTypes.join(', ')}
        Pain radiation: ${questionnaire.painRadiation ? 'Yes' : 'No'}
        Associated symptoms: ${questionnaire.associatedSymptoms.join(', ')}
        Activity limitations: ${questionnaire.activityLimitations.join(', ')}
        Recent events: ${questionnaire.recentEvents.join(', ')}
        Current medications: ${questionnaire.currentMedications}
        Chronic conditions: ${questionnaire.chronicConditions}
        Additional details: ${questionnaire.additionalDetails}
      `;

      console.log('Calling AI analysis function...');
      
      // Call the AI analysis function with timeout
      const analysisPromise = supabase.functions.invoke('ai-symptom-analysis', {
        body: { 
          symptoms: symptomDescription,
          userId: user?.id || 'anonymous'
        }
      });

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout - please try again')), 30000)
      );

      const { data, error } = await Promise.race([analysisPromise, timeoutPromise]) as any;

      if (error) {
        console.error('AI analysis error:', error);
        throw error;
      }

      console.log('AI analysis completed:', data);

      // Determine risk level based on symptoms
      const riskLevel = determineRiskLevel(questionnaire);
      
      const analysisResult: AnalysisResult = {
        conditions: data?.conditions || [
          {
            name: "Analysis Complete",
            probability: 85,
            description: "Based on your symptoms, here are some general recommendations."
          }
        ],
        nextSteps: data?.nextSteps || [
          "Monitor symptoms closely",
          "Rest and stay hydrated",
          "Contact healthcare provider if symptoms worsen",
          "Consider over-the-counter treatments if appropriate"
        ],
        disclaimer: data?.disclaimer || "This analysis is for informational purposes only and should not replace professional medical advice.",
        riskLevel
      };

      setResult(analysisResult);
      setCurrentStep(8); // Results step
      
      toast({
        title: 'Analysis Complete',
        description: 'Your symptoms have been analyzed successfully.',
      });
      
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      
      // Provide fallback analysis if AI fails
      const fallbackResult: AnalysisResult = {
        conditions: [
          {
            name: "Symptom Assessment",
            probability: 75,
            description: "Based on your reported symptoms, we recommend consulting with a healthcare professional for proper evaluation."
          }
        ],
        nextSteps: [
          "Document your symptoms with dates and severity",
          "Monitor for any changes or worsening",
          "Schedule an appointment with your healthcare provider",
          "Keep a symptom diary for better tracking"
        ],
        disclaimer: "This analysis is generated when our AI service is unavailable. Please consult a healthcare professional for proper medical advice.",
        riskLevel: determineRiskLevel(questionnaire)
      };
      
      setResult(fallbackResult);
      setCurrentStep(8);
      
      toast({
        title: 'Analysis Complete (Offline Mode)',
        description: 'Basic symptom assessment provided. Consider consulting a healthcare professional.',
        variant: 'default'
      });
    } finally {
      setLoading(false);
    }
  };

  const determineRiskLevel = (data: QuestionnaireData): 'low' | 'medium' | 'high' | 'emergency' => {
    const severity = parseInt(data.severityRating) || 0;
    const emergencySymptoms = ['Chest pain', 'Shortness of breath', 'Difficulty swallowing'];
    const hasEmergencySymptom = data.associatedSymptoms.some(s => emergencySymptoms.includes(s));
    
    if (hasEmergencySymptom || severity >= 9) return 'emergency';
    if (severity >= 7 || data.associatedSymptoms.includes('Fever')) return 'high';
    if (severity >= 5) return 'medium';
    return 'low';
  };

  const resetChecker = () => {
    setCurrentStep(1);
    setResult(null);
    setQuestionnaire({
      age: '',
      gender: '',
      primarySymptomLocation: '',
      severityRating: '',
      painTypes: [],
      painRadiation: false,
      symptomDuration: '',
      symptomProgression: '',
      timing: '',
      associatedSymptoms: [],
      activityLimitations: [],
      currentMedications: '',
      allergies: '',
      chronicConditions: '',
      recentEvents: [],
      additionalDetails: ''
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
              <p className="text-muted-foreground">Let's start with some basic details about you</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={questionnaire.age}
                  onChange={(e) => updateQuestionnaire('age', e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={questionnaire.gender} onValueChange={(value) => updateQuestionnaire('gender', value)}>
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
            
            <div className="space-y-2">
              <Label htmlFor="location">Primary symptom location</Label>
              <Input
                id="location"
                value={questionnaire.primarySymptomLocation}
                onChange={(e) => updateQuestionnaire('primarySymptomLocation', e.target.value)}
                placeholder="e.g., head, chest, abdomen, back, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Pain/Discomfort severity (1-10 scale)</Label>
              <RadioGroup 
                className="flex flex-wrap gap-4"
                value={questionnaire.severityRating}
                onValueChange={(value) => updateQuestionnaire('severityRating', value)}
              >
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={num.toString()} id={`severity-${num}`} />
                    <Label htmlFor={`severity-${num}`}>{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Pain Assessment</h3>
              <p className="text-muted-foreground">Describe the characteristics of your pain or discomfort</p>
            </div>
            
            <div className="space-y-4">
              <Label>What type of pain/discomfort are you experiencing? (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PAIN_TYPES.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={questionnaire.painTypes.includes(type)}
                      onCheckedChange={() => toggleArrayItem('painTypes', type)}
                    />
                    <Label htmlFor={type} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Does the pain/discomfort spread to other areas?</Label>
              <RadioGroup 
                value={questionnaire.painRadiation.toString()}
                onValueChange={(value) => updateQuestionnaire('painRadiation', value === 'true')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="radiation-yes" />
                  <Label htmlFor="radiation-yes">Yes, it spreads to other areas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="radiation-no" />
                  <Label htmlFor="radiation-no">No, it stays in one area</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Timing & Duration</h3>
              <p className="text-muted-foreground">Help us understand when and how your symptoms started</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How long have you had these symptoms?</Label>
                <Select value={questionnaire.symptomDuration} onValueChange={(value) => updateQuestionnaire('symptomDuration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-than-hour">Less than 1 hour</SelectItem>
                    <SelectItem value="few-hours">A few hours</SelectItem>
                    <SelectItem value="today">Started today</SelectItem>
                    <SelectItem value="few-days">A few days</SelectItem>
                    <SelectItem value="week">About a week</SelectItem>
                    <SelectItem value="few-weeks">A few weeks</SelectItem>
                    <SelectItem value="month">About a month</SelectItem>
                    <SelectItem value="longer">Longer than a month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>How have your symptoms changed over time?</Label>
                <RadioGroup 
                  value={questionnaire.symptomProgression}
                  onValueChange={(value) => updateQuestionnaire('symptomProgression', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="getting-worse" id="worse" />
                    <Label htmlFor="worse">Getting worse</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="getting-better" id="better" />
                    <Label htmlFor="better">Getting better</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staying-same" id="same" />
                    <Label htmlFor="same">Staying the same</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comes-and-goes" id="intermittent" />
                    <Label htmlFor="intermittent">Comes and goes</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Associated Symptoms</h3>
              <p className="text-muted-foreground">Are you experiencing any other symptoms along with your main concern?</p>
            </div>
            
            <div className="space-y-4">
              <Label>Select any additional symptoms you're experiencing:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ASSOCIATED_SYMPTOMS.map(symptom => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={questionnaire.associatedSymptoms.includes(symptom)}
                      onCheckedChange={() => toggleArrayItem('associatedSymptoms', symptom)}
                    />
                    <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Activity Impact</h3>
              <p className="text-muted-foreground">How are your symptoms affecting your daily life?</p>
            </div>
            
            <div className="space-y-4">
              <Label>What activities are difficult or impossible because of your symptoms?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ACTIVITY_LIMITATIONS.map(limitation => (
                  <div key={limitation} className="flex items-center space-x-2">
                    <Checkbox
                      id={limitation}
                      checked={questionnaire.activityLimitations.includes(limitation)}
                      onCheckedChange={() => toggleArrayItem('activityLimitations', limitation)}
                    />
                    <Label htmlFor={limitation} className="text-sm">{limitation}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Medical History</h3>
              <p className="text-muted-foreground">Tell us about your medical background</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medications">Current medications (include supplements and over-the-counter drugs)</Label>
                <Textarea
                  id="medications"
                  value={questionnaire.currentMedications}
                  onChange={(e) => updateQuestionnaire('currentMedications', e.target.value)}
                  placeholder="List your current medications, dosages if known..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allergies">Known allergies</Label>
                <Textarea
                  id="allergies"
                  value={questionnaire.allergies}
                  onChange={(e) => updateQuestionnaire('allergies', e.target.value)}
                  placeholder="List any drug allergies, food allergies, etc..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conditions">Chronic conditions or ongoing health issues</Label>
                <Textarea
                  id="conditions"
                  value={questionnaire.chronicConditions}
                  onChange={(e) => updateQuestionnaire('chronicConditions', e.target.value)}
                  placeholder="Diabetes, heart disease, arthritis, etc..."
                />
              </div>
            </div>
          </div>
        );
      
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Recent Events & Final Details</h3>
              <p className="text-muted-foreground">Any recent changes or additional information?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-4">
                <Label>Have any of these events happened recently?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {RECENT_EVENTS.map(event => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={event}
                        checked={questionnaire.recentEvents.includes(event)}
                        onCheckedChange={() => toggleArrayItem('recentEvents', event)}
                      />
                      <Label htmlFor={event} className="text-sm">{event}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additional">Additional details or concerns</Label>
                <Textarea
                  id="additional"
                  value={questionnaire.additionalDetails}
                  onChange={(e) => updateQuestionnaire('additionalDetails', e.target.value)}
                  placeholder="Anything else you think might be relevant..."
                />
              </div>
            </div>
          </div>
        );
      
      case 8:
        return result && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary mb-2">Analysis Results</h3>
              <Badge className={`${getRiskBadgeColor(result.riskLevel)} text-lg px-4 py-2`}>
                {result.riskLevel.toUpperCase()} PRIORITY
              </Badge>
            </div>
            
            {result.riskLevel === 'emergency' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                  <div>
                    <h4 className="font-bold text-red-800">EMERGENCY SYMPTOMS DETECTED</h4>
                    <p className="text-red-700">Call 911 immediately or go to the nearest emergency room.</p>
                    <Button 
                      className="mt-3 bg-red-600 hover:bg-red-700" 
                      onClick={() => window.open('tel:911')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call 911
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <h4 className="text-xl font-semibold">Possible Conditions</h4>
              {result.conditions.map((condition, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-lg">{condition.name}</h5>
                    <Badge variant="outline">{Math.round(condition.probability * 100)}% match</Badge>
                  </div>
                  <p className="text-muted-foreground">{condition.description}</p>
                </Card>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xl font-semibold">Recommended Next Steps</h4>
              <ul className="space-y-2">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-bold text-yellow-800 mb-2">Important Disclaimer</h4>
              <p className="text-yellow-700 text-sm">{result.disclaimer}</p>
            </div>
            
            <div className="text-center">
              <Button onClick={resetChecker} variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Start New Assessment
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center justify-center gap-2 text-3xl">
            <Brain className="h-8 w-8 text-primary" />
            Enhanced AI Symptom Checker
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Comprehensive health assessment with AI-powered analysis
          </p>
          
          {currentStep <= 7 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of 7
              </div>
              <div className="w-48 bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-8">
          {loading ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
              <h3 className="text-xl font-semibold mb-2">Analyzing Your Symptoms</h3>
              <p className="text-muted-foreground">AI is processing your health information...</p>
            </div>
          ) : (
            <>
              {renderStep()}
              
              {currentStep <= 7 && (
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  {currentStep === 7 ? (
                    <Button onClick={analyzeSymptoms} disabled={loading}>
                      <Activity className="h-4 w-4 mr-2" />
                      Analyze Symptoms
                    </Button>
                  ) : (
                    <Button onClick={nextStep}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>⚠️ This tool is for informational purposes only and should not replace professional medical advice.</p>
        <p>In case of emergency, call 911 immediately.</p>
      </div>
    </div>
  );
};

export default EnhancedSymptomChecker;