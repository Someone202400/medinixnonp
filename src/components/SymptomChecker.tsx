import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

interface Diagnosis {
  condition: string;
  probability: number;
  treatment: string;
}

const SymptomChecker: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState<Diagnosis[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setResults([]);
    setLoading(true);

    if (!symptoms.trim()) {
      setError('Please enter at least one symptom (e.g., fever, cough).');
      setLoading(false);
      return;
    }

    const symptomList = symptoms.split(',').map(s => s.trim()).filter(s => s);
    console.log('Submitting symptoms:', symptomList);

    try {
      // Option 1: Infermedica API (uncomment and configure with your credentials)
      /*
      const response = await axios.post(
        'https://api.infermedica.com/v3/diagnosis',
        {
          sex: 'unknown', // Adjust or collect from user
          age: { value: 30 }, // Default or collect from user
          symptoms: symptomList.map(s => ({
            id: mapSymptomToId(s), // Map symptom to Infermedica ID
            choice_id: 'present',
          })),
        },
        {
          headers: {
            'App-Id': import.meta.env.VITE_INFERMEDICA_APP_ID,
            'App-Key': import.meta.env.VITE_INFERMEDICA_APP_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      const diagnoses = response.data.conditions.map((c: any) => ({
        condition: c.name,
        probability: c.probability,
        treatment: getTreatmentForCondition(c.name), // Custom function to map treatments
      }));

      if (diagnoses.length === 0) {
        throw new Error('No conditions found for the provided symptoms.');
      }

      setResults(diagnoses);
      */

      // Option 2: Rule-Based Fallback (use if no API)
      const diagnoses = symptomList.includes('fever') && symptomList.includes('cough')
        ? [
            { condition: 'Flu', probability: 0.8, treatment: 'Rest, hydration, over-the-counter flu medication (e.g., DayQuil). Consult a doctor if symptoms worsen.' },
            { condition: 'COVID-19', probability: 0.6, treatment: 'Isolate, monitor symptoms, test for COVID-19. Seek medical advice if breathing difficulties occur.' },
          ]
        : symptomList.includes('fever')
        ? [{ condition: 'Infection', probability: 0.7, treatment: 'Rest, hydration, possibly antibiotics if bacterial. Consult a doctor for diagnosis.' }]
        : symptomList.includes('cough')
        ? [{ condition: 'Respiratory Issue', probability: 0.65, treatment: 'Use a humidifier, over-the-counter cough syrup. See a doctor if persistent.' }]
        : [{ condition: 'Unknown Condition', probability: 0.5, treatment: 'Consult a doctor for a professional evaluation.' }];

      setResults(diagnoses);
    } catch (error) {
      console.error('Symptom Checker error:', error);
      setError('Cannot check symptoms at this time. Please try again later or consult a doctor.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map symptoms to Infermedica IDs (simplified)
  const mapSymptomToId = (symptom: string): string => {
    const symptomMap: { [key: string]: string } = {
      fever: 's_10',
      cough: 's_11',
      headache: 's_12',
      // Add more mappings based on Infermedica's symptom database
    };
    return symptomMap[symptom.toLowerCase()] || 'unknown';
  };

  // Helper function to map conditions to treatments (simplified)
  const getTreatmentForCondition = (condition: string): string => {
    const treatmentMap: { [key: string]: string } = {
      Flu: 'Rest, hydration, over-the-counter flu medication (e.g., DayQuil). Consult a doctor if symptoms worsen.',
      'COVID-19': 'Isolate, monitor symptoms, test for COVID-19. Seek medical advice if breathing difficulties occur.',
      Infection: 'Rest, hydration, possibly antibiotics if bacterial. Consult a doctor for diagnosis.',
      'Respiratory Issue': 'Use a humidifier, over-the-counter cough syrup. See a doctor if persistent.',
      // Add more mappings based on your needs
    };
    return treatmentMap[condition] || 'Consult a doctor for a professional evaluation.';
  };

  return (
    <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-indigo-600">
          AI Symptom Checker
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter your symptoms to find possible conditions and treatments. This tool is for informational purposes only and not a substitute for professional medical advice. Always consult a doctor for a definitive diagnosis.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Enter symptoms (e.g., fever, cough, headache)"
            className="w-full"
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Checking...' : 'Check Symptoms'}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700">Possible Conditions and Treatments:</h3>
              <ul className="list-disc pl-5 mt-2 text-gray-600">
                {results.map((result, index) => (
                  <li key={index}>
                    <strong>{result.condition}</strong> (Probability: {(result.probability * 100).toFixed(1)}%): {result.treatment}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;
