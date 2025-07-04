
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, Info, Clock, Pill, Bot, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MedicationChatbot from './MedicationChatbot';

// Comprehensive medication data
const medicationData = [
  {
    id: '1',
    name: 'Acetaminophen',
    genericName: 'Acetaminophen',
    brandNames: ['Tylenol', 'Panadol'],
    category: 'Pain Relief',
    description: 'Pain relief and fever reduction. Not anti-inflammatory.',
    dosage: '325-650mg every 4-6 hours, maximum 3000mg daily',
    sideEffects: ['Rare liver damage if overdosed', 'nausea', 'rash'],
    warnings: ['Do not exceed recommended dose', 'Avoid alcohol', 'Check other medications for acetaminophen'],
    interactions: ['Warfarin', 'Isoniazid', 'Carbamazepine'],
    uses: ['Pain relief', 'Fever reduction', 'Headache', 'Muscle aches']
  },
  {
    id: '2',
    name: 'Albuterol',
    genericName: 'Albuterol',
    brandNames: ['ProAir', 'Ventolin'],
    category: 'Respiratory',
    description: 'Quick-relief inhaler for asthma and breathing difficulties.',
    dosage: '2 puffs every 4-6 hours as needed',
    sideEffects: ['Tremor', 'nervousness', 'headache', 'increased heart rate'],
    warnings: ['Do not exceed prescribed dose', 'Monitor heart rate', 'Rinse mouth after use'],
    interactions: ['Beta-blockers', 'MAO inhibitors', 'Tricyclic antidepressants'],
    uses: ['Asthma', 'COPD', 'Bronchospasm', 'Exercise-induced bronchospasm']
  },
  {
    id: '3',
    name: 'Alprazolam',
    genericName: 'Alprazolam',
    brandNames: ['Xanax'],
    category: 'Anti-anxiety',
    description: 'Treats anxiety and panic disorders (benzodiazepine).',
    dosage: '0.25-0.5mg 2-3 times daily',
    sideEffects: ['Drowsiness', 'dizziness', 'dependence risk', 'fatigue'],
    warnings: ['High dependence risk', 'Avoid alcohol', 'Do not stop suddenly', 'Can be habit-forming'],
    interactions: ['Alcohol', 'Opioids', 'Other CNS depressants'],
    uses: ['Anxiety disorders', 'Panic disorder', 'Short-term anxiety relief']
  },
  {
    id: '4',
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    brandNames: ['Norvasc'],
    category: 'Blood Pressure',
    description: 'High blood pressure and chest pain (calcium channel blocker).',
    dosage: '2.5-10mg once daily',
    sideEffects: ['Swelling (edema)', 'dizziness', 'flushing', 'fatigue'],
    warnings: ['Monitor blood pressure', 'Rise slowly from sitting/lying', 'May cause ankle swelling'],
    interactions: ['Simvastatin', 'CYP3A4 inhibitors', 'Grapefruit juice'],
    uses: ['High blood pressure', 'Angina', 'Coronary artery disease']
  },
  {
    id: '5',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Trimox'],
    category: 'Antibiotic',
    description: 'Common antibiotic for ear, sinus, and throat infections.',
    dosage: '250-500mg every 8 hours or 500-875mg every 12 hours',
    sideEffects: ['Diarrhea', 'nausea', 'rash', 'allergic reactions'],
    warnings: ['Complete full course', 'Tell doctor about penicillin allergies', 'May reduce birth control effectiveness'],
    interactions: ['Methotrexate', 'Probenecid', 'Allopurinol'],
    uses: ['Ear infections', 'Sinus infections', 'Throat infections', 'Pneumonia', 'UTIs']
  },
  {
    id: '6',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin',
    brandNames: ['Lipitor'],
    category: 'Cholesterol',
    description: 'Lowers LDL cholesterol and prevents heart disease.',
    dosage: '10-80mg once daily, usually in the evening',
    sideEffects: ['Muscle pain', 'liver enzyme changes', 'digestive upset'],
    warnings: ['Avoid grapefruit juice', 'Report muscle pain immediately', 'Regular liver function tests needed'],
    interactions: ['Warfarin', 'Digoxin', 'Cyclosporine', 'Gemfibrozil'],
    uses: ['High cholesterol', 'Heart disease prevention', 'Stroke prevention']
  },
  {
    id: '7',
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    brandNames: ['Z-Pak', 'Zithromax'],
    category: 'Antibiotic',
    description: 'Respiratory infections and STDs.',
    dosage: '500mg on day 1, then 250mg daily for 4 days',
    sideEffects: ['Diarrhea', 'nausea', 'abdominal pain', 'rash'],
    warnings: ['Complete full course', 'May cause irregular heartbeat', 'Take on empty stomach'],
    interactions: ['Warfarin', 'Digoxin', 'Antacids'],
    uses: ['Respiratory infections', 'STDs', 'Skin infections', 'Pneumonia']
  },
  {
    id: '8',
    name: 'Benadryl',
    genericName: 'Diphenhydramine',
    brandNames: ['Benadryl'],
    category: 'Antihistamine',
    description: 'Antihistamine for allergies, colds, motion sickness (diphenhydramine).',
    dosage: '25-50mg every 4-6 hours',
    sideEffects: ['Drowsiness', 'dry mouth', 'dizziness'],
    warnings: ['Causes drowsiness', 'Avoid alcohol', 'May cause confusion in elderly'],
    interactions: ['Alcohol', 'Other sedatives', 'MAO inhibitors'],
    uses: ['Allergies', 'Sleep aid', 'Motion sickness', 'Itching']
  },
  {
    id: '9',
    name: 'Bupropion',
    genericName: 'Bupropion',
    brandNames: ['Wellbutrin', 'Zyban'],
    category: 'Antidepressant',
    description: 'Depression and smoking cessation.',
    dosage: '150-300mg daily, divided doses',
    sideEffects: ['Insomnia', 'dry mouth', 'tremor', 'risk of seizures at high dose'],
    warnings: ['Risk of seizures', 'May increase suicidal thoughts', 'Avoid alcohol'],
    interactions: ['MAO inhibitors', 'Other antidepressants', 'Tramadol'],
    uses: ['Depression', 'Smoking cessation', 'Seasonal affective disorder']
  },
  {
    id: '10',
    name: 'Carvedilol',
    genericName: 'Carvedilol',
    brandNames: ['Coreg'],
    category: 'Blood Pressure',
    description: 'Beta-blocker for heart failure and high blood pressure.',
    dosage: '3.125-25mg twice daily',
    sideEffects: ['Fatigue', 'dizziness', 'slow heartbeat', 'low blood pressure'],
    warnings: ['Monitor heart rate and blood pressure', 'Rise slowly', 'Do not stop suddenly'],
    interactions: ['Insulin', 'Digoxin', 'Calcium channel blockers'],
    uses: ['Heart failure', 'High blood pressure', 'Post-heart attack care']
  },
  // Continue with remaining medications...
  {
    id: '11',
    name: 'Cephalexin',
    genericName: 'Cephalexin',
    brandNames: ['Keflex'],
    category: 'Antibiotic',
    description: 'Skin and urinary tract infections (antibiotic).',
    dosage: '250-500mg every 6 hours',
    sideEffects: ['Diarrhea', 'rash', 'nausea'],
    warnings: ['Complete full course', 'Tell doctor about penicillin allergies'],
    interactions: ['Metformin', 'Probenecid'],
    uses: ['Skin infections', 'UTIs', 'Respiratory infections']
  },
  {
    id: '12',
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin',
    brandNames: ['Cipro'],
    category: 'Antibiotic',
    description: 'UTIs and gastrointestinal infections (antibiotic).',
    dosage: '250-750mg every 12 hours',
    sideEffects: ['Nausea', 'diarrhea', 'tendon pain (rare)', 'dizziness'],
    warnings: ['Avoid dairy products', 'May cause tendon rupture', 'Stay hydrated'],
    interactions: ['Antacids', 'Iron supplements', 'Warfarin'],
    uses: ['UTIs', 'Gastrointestinal infections', 'Anthrax exposure']
  },
  {
    id: '13',
    name: 'Clonazepam',
    genericName: 'Clonazepam',
    brandNames: ['Klonopin'],
    category: 'Anti-anxiety',
    description: 'Anxiety and seizures.',
    dosage: '0.25-2mg daily, divided doses',
    sideEffects: ['Drowsiness', 'dizziness', 'coordination problems'],
    warnings: ['High dependence risk', 'Avoid alcohol', 'Do not stop suddenly'],
    interactions: ['Alcohol', 'Opioids', 'Other CNS depressants'],
    uses: ['Seizure disorders', 'Panic disorder', 'Anxiety']
  },
  {
    id: '14',
    name: 'Clopidogrel',
    genericName: 'Clopidogrel',
    brandNames: ['Plavix'],
    category: 'Blood Thinner',
    description: 'Prevents blood clots after stroke or heart attack.',
    dosage: '75mg once daily',
    sideEffects: ['Bleeding', 'bruising', 'rash'],
    warnings: ['Increased bleeding risk', 'Inform doctors before surgery', 'Monitor for bleeding'],
    interactions: ['Warfarin', 'Aspirin', 'Proton pump inhibitors'],
    uses: ['Stroke prevention', 'Heart attack prevention', 'Peripheral artery disease']
  },
  {
    id: '15',
    name: 'Diphenhydramine',
    genericName: 'Diphenhydramine',
    brandNames: ['Benadryl'],
    category: 'Antihistamine',
    description: 'Allergies and sleep aid (same ingredient as Benadryl).',
    dosage: '25-50mg every 4-6 hours',
    sideEffects: ['Drowsiness', 'dry mouth', 'dizziness'],
    warnings: ['Causes drowsiness', 'Avoid alcohol', 'May cause confusion in elderly'],
    interactions: ['Alcohol', 'Other sedatives', 'MAO inhibitors'],
    uses: ['Allergies', 'Sleep aid', 'Motion sickness', 'Itching']
  },
  {
    id: '16',
    name: 'Metformin',
    genericName: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    category: 'Diabetes',
    description: 'First-line treatment for type 2 diabetes.',
    dosage: '500-850mg twice daily with meals, maximum 2550mg daily',
    sideEffects: ['Diarrhea', 'nausea', 'upset stomach'],
    warnings: ['Take with food', 'Stay hydrated', 'Monitor kidney function'],
    interactions: ['Furosemide', 'Nifedipine', 'Cationic drugs'],
    uses: ['Type 2 diabetes', 'Prediabetes', 'PCOS']
  },
  {
    id: '17',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    category: 'Blood Pressure',
    description: 'ACE inhibitor for high blood pressure and heart failure.',
    dosage: '5-40mg once daily',
    sideEffects: ['Dry cough', 'dizziness', 'high potassium'],
    warnings: ['May cause dizziness when standing', 'Avoid potassium supplements', 'Not safe during pregnancy'],
    interactions: ['Potassium supplements', 'Lithium', 'NSAIDs'],
    uses: ['High blood pressure', 'Heart failure', 'Post-heart attack treatment']
  },
  {
    id: '18',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    brandNames: ['Prilosec'],
    category: 'Stomach Acid',
    description: 'Acid reflux and ulcers (proton pump inhibitor).',
    dosage: '20-40mg once daily before eating',
    sideEffects: ['Headache', 'diarrhea', 'nausea'],
    warnings: ['Long-term use may affect bone health', 'May interact with blood thinners'],
    interactions: ['Warfarin', 'Clopidogrel', 'Digoxin'],
    uses: ['GERD', 'Peptic ulcers', 'Acid reflux', 'H. pylori infection']
  }
];

const MedicationLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredMedications = useMemo(() => {
    let filtered = medicationData;

    if (searchTerm) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.brandNames.some(brand => brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        med.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.uses.some(use => use.toLowerCase().includes(searchTerm.toLowerCase()))
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
    <div className="space-y-6 relative">
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowChatbot(!showChatbot)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="sm"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>

      {/* Chatbot Modal */}
      {showChatbot && (
        <MedicationChatbot 
          onClose={() => setShowChatbot(false)}
          medicationData={medicationData}
        />
      )}

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by medication name, brand, condition, or symptoms..."
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

          {/* Search Results Count */}
          {searchTerm && (
            <div className="text-sm text-gray-600">
              Found {filteredMedications.length} medication{filteredMedications.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </div>
          )}
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
                      <div className="flex-1">
                        <h3 className="font-semibold">{medication.name}</h3>
                        <p className="text-sm text-gray-600">
                          Generic: {medication.genericName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {medication.description}
                        </p>
                        <div className="flex gap-1 mt-2">
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
                {filteredMedications.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No medications found. Try adjusting your search terms.
                  </div>
                )}
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
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{selectedMedication.category}</Badge>
                      {selectedMedication.brandNames.map(brand => (
                        <Badge key={brand} variant="secondary" className="text-xs">
                          {brand}
                        </Badge>
                      ))}
                    </div>
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
