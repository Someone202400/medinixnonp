
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, Info, Clock, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sample medication data based on drugs.com and other healthcare websites
const medicationData = [
  {
    id: '1',
    name: 'Acetaminophen',
    genericName: 'Acetaminophen',
    brandNames: ['Tylenol', 'Panadol'],
    category: 'Pain Relief',
    description: 'Used to treat mild to moderate pain and reduce fever.',
    dosage: '325-650mg every 4-6 hours, maximum 3000mg daily',
    sideEffects: ['Nausea', 'Stomach pain', 'Loss of appetite', 'Rash'],
    warnings: ['Do not exceed recommended dose', 'Avoid alcohol', 'Check other medications for acetaminophen'],
    interactions: ['Warfarin', 'Isoniazid', 'Carbamazepine'],
    uses: ['Pain relief', 'Fever reduction', 'Headache', 'Muscle aches']
  },
  {
    id: '2',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Trimox'],
    category: 'Antibiotic',
    description: 'Penicillin antibiotic used to treat bacterial infections.',
    dosage: '250-500mg every 8 hours or 500-875mg every 12 hours',
    sideEffects: ['Diarrhea', 'Nausea', 'Vomiting', 'Rash', 'Abdominal pain'],
    warnings: ['Complete full course', 'Tell doctor about penicillin allergies', 'May reduce birth control effectiveness'],
    interactions: ['Methotrexate', 'Probenecid', 'Allopurinol'],
    uses: ['Ear infections', 'Strep throat', 'Pneumonia', 'Urinary tract infections']
  },
  {
    id: '3',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin',
    brandNames: ['Lipitor'],
    category: 'Cholesterol',
    description: 'Statin medication used to lower cholesterol and reduce cardiovascular risk.',
    dosage: '10-80mg once daily, usually in the evening',
    sideEffects: ['Muscle pain', 'Headache', 'Nausea', 'Diarrhea', 'Joint pain'],
    warnings: ['Avoid grapefruit juice', 'Report muscle pain immediately', 'Regular liver function tests needed'],
    interactions: ['Warfarin', 'Digoxin', 'Cyclosporine', 'Gemfibrozil'],
    uses: ['High cholesterol', 'Heart disease prevention', 'Stroke prevention']
  },
  // Add more medications covering different letters
  {
    id: '4',
    name: 'Metformin',
    genericName: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    category: 'Diabetes',
    description: 'First-line medication for type 2 diabetes that helps control blood sugar.',
    dosage: '500-850mg twice daily with meals, maximum 2550mg daily',
    sideEffects: ['Diarrhea', 'Nausea', 'Vomiting', 'Gas', 'Metallic taste'],
    warnings: ['Take with food', 'Stay hydrated', 'Monitor kidney function'],
    interactions: ['Furosemide', 'Nifedipine', 'Cationic drugs'],
    uses: ['Type 2 diabetes', 'Prediabetes', 'PCOS']
  },
  {
    id: '5',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    category: 'Blood Pressure',
    description: 'ACE inhibitor used to treat high blood pressure and heart failure.',
    dosage: '5-40mg once daily',
    sideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue', 'Nausea'],
    warnings: ['May cause dizziness when standing', 'Avoid potassium supplements', 'Not safe during pregnancy'],
    interactions: ['Potassium supplements', 'Lithium', 'NSAIDs'],
    uses: ['High blood pressure', 'Heart failure', 'Post-heart attack treatment']
  }
];

const MedicationLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredMedications = useMemo(() => {
    let filtered = medicationData;

    if (searchTerm) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.brandNames.some(brand => brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter(med =>
        med.name.charAt(0).toUpperCase() === selectedLetter
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, selectedLetter]);

  const medicationsByLetter = useMemo(() => {
    const grouped = {};
    alphabet.forEach(letter => {
      grouped[letter] = medicationData.filter(med =>
        med.name.charAt(0).toUpperCase() === letter
      );
    });
    return grouped;
  }, []);

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medications, brands, or conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Alphabet Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedLetter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLetter('')}
            >
              All
            </Button>
            {alphabet.map(letter => (
              <Button
                key={letter}
                variant={selectedLetter === letter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLetter(letter)}
                disabled={medicationsByLetter[letter].length === 0}
                className="w-10 h-10 p-0"
              >
                {letter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Medications ({filteredMedications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredMedications.map(medication => (
                  <div
                    key={medication.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMedication?.id === medication.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMedication(medication)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{medication.name}</h3>
                        <p className="text-sm text-gray-600">
                          Generic: {medication.genericName}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {medication.brandNames.slice(0, 2).map(brand => (
                            <Badge key={brand} variant="secondary" className="text-xs">
                              {brand}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline">{medication.category}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Medication Details */}
        <Card>
          <CardHeader>
            <CardTitle>Medication Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMedication ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedMedication.name}</h2>
                    <p className="text-gray-600">{selectedMedication.description}</p>
                  </div>

                  <Tabs defaultValue="dosage" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="dosage">Dosage</TabsTrigger>
                      <TabsTrigger value="side-effects">Side Effects</TabsTrigger>
                      <TabsTrigger value="warnings">Warnings</TabsTrigger>
                      <TabsTrigger value="interactions">Interactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dosage" className="space-y-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Typical Dosage
                        </h4>
                        <p className="text-sm text-gray-700">{selectedMedication.dosage}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Uses</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedMedication.uses.map(use => (
                            <Badge key={use} variant="secondary">{use}</Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="side-effects" className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Common Side Effects
                      </h4>
                      <ul className="space-y-1">
                        {selectedMedication.sideEffects.map(effect => (
                          <li key={effect} className="text-sm text-gray-700 flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="warnings" className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Important Warnings
                      </h4>
                      <ul className="space-y-1">
                        {selectedMedication.warnings.map(warning => (
                          <li key={warning} className="text-sm text-red-700 flex items-center gap-2">
                            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="interactions" className="space-y-3">
                      <h4 className="font-semibold">Drug Interactions</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedMedication.interactions.map(interaction => (
                          <Badge key={interaction} variant="destructive" className="text-xs">
                            {interaction}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Always consult your healthcare provider about potential drug interactions.
                      </p>
                    </TabsContent>
                  </Tabs>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Medical Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Always consult your healthcare provider before starting or changing medications.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a medication to view detailed information
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicationLibrary;
