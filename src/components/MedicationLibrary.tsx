
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Pill, ExternalLink, Bot, MessageCircle } from 'lucide-react';

interface MedicationInfo {
  name: string;
  genericName?: string;
  description: string;
  uses: string[];
  sideEffects: string[];
  warnings: string[];
  dosage?: string;
  category: string;
}

const MedicationLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<MedicationInfo[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<MedicationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Sample medication data (in a real app, this would come from web scraping)
  const sampleMedications: MedicationInfo[] = [
    {
      name: 'Acetaminophen',
      genericName: 'Paracetamol',
      description: 'A pain reliever and fever reducer commonly used for mild to moderate pain.',
      uses: ['Pain relief', 'Fever reduction', 'Headache', 'Muscle aches'],
      sideEffects: ['Nausea', 'Stomach upset', 'Liver damage (with overdose)'],
      warnings: ['Do not exceed recommended dose', 'Avoid alcohol', 'Consult doctor if pregnant'],
      dosage: '500-1000mg every 4-6 hours, not exceeding 4000mg per day',
      category: 'Analgesic'
    },
    {
      name: 'Aspirin',
      genericName: 'Acetylsalicylic acid',
      description: 'An anti-inflammatory drug used for pain, fever, and inflammation.',
      uses: ['Pain relief', 'Anti-inflammatory', 'Fever reduction', 'Heart attack prevention'],
      sideEffects: ['Stomach irritation', 'Bleeding', 'Tinnitus', 'Allergic reactions'],
      warnings: ['Not for children under 16', 'Avoid if allergic to NSAIDs', 'May increase bleeding risk'],
      dosage: '325-650mg every 4 hours for pain, 81mg daily for heart protection',
      category: 'NSAID'
    },
    {
      name: 'Amoxicillin',
      description: 'A penicillin-type antibiotic used to treat bacterial infections.',
      uses: ['Bacterial infections', 'Pneumonia', 'Bronchitis', 'Ear infections'],
      sideEffects: ['Nausea', 'Diarrhea', 'Abdominal pain', 'Allergic reactions'],
      warnings: ['Complete full course', 'Inform doctor of allergies', 'May reduce birth control effectiveness'],
      dosage: '250-500mg every 8 hours or as prescribed',
      category: 'Antibiotic'
    },
    {
      name: 'Benadryl',
      genericName: 'Diphenhydramine',
      description: 'An antihistamine used for allergies and sleep aid.',
      uses: ['Allergic reactions', 'Hay fever', 'Sleep aid', 'Motion sickness'],
      sideEffects: ['Drowsiness', 'Dry mouth', 'Blurred vision', 'Constipation'],
      warnings: ['May cause drowsiness', 'Avoid alcohol', 'Not recommended for elderly'],
      dosage: '25-50mg every 4-6 hours, maximum 300mg per day',
      category: 'Antihistamine'
    },
    {
      name: 'Calcium Carbonate',
      description: 'A calcium supplement and antacid.',
      uses: ['Calcium deficiency', 'Osteoporosis prevention', 'Heartburn', 'Indigestion'],
      sideEffects: ['Constipation', 'Gas', 'Nausea', 'Kidney stones (rare)'],
      warnings: ['Take with food', 'May interact with other medications', 'Consult doctor if kidney problems'],
      dosage: '500-1200mg with meals',
      category: 'Supplement'
    }
  ];

  useEffect(() => {
    setMedications(sampleMedications);
    filterMedications(sampleMedications, selectedLetter, searchTerm);
  }, []);

  useEffect(() => {
    filterMedications(medications, selectedLetter, searchTerm);
  }, [selectedLetter, searchTerm, medications]);

  const filterMedications = (meds: MedicationInfo[], letter: string, search: string) => {
    let filtered = meds;

    if (search) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(search.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(search.toLowerCase()) ||
        med.category.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      filtered = filtered.filter(med => med.name.charAt(0).toUpperCase() === letter);
    }

    setFilteredMedications(filtered);
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setSearchTerm('');
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setSelectedLetter('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Medication Library</h1>
        <p className="text-gray-600">Comprehensive medication information powered by AI</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search medications, generic names, or categories..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Alphabet Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-1">
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter && !searchTerm ? "default" : "outline"}
              size="sm"
              onClick={() => handleLetterClick(letter)}
              className="w-10 h-10"
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medication List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {searchTerm ? `Search Results (${filteredMedications.length})` : `Letter ${selectedLetter} (${filteredMedications.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredMedications.map((med, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedMedication?.name === med.name ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedMedication(med)}
                    >
                      <CardContent className="p-3">
                        <h3 className="font-semibold">{med.name}</h3>
                        {med.genericName && (
                          <p className="text-sm text-gray-600">({med.genericName})</p>
                        )}
                        <Badge variant="secondary" className="mt-1">
                          {med.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredMedications.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No medications found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Medication Details */}
        <div className="lg:col-span-2">
          {selectedMedication ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h2>{selectedMedication.name}</h2>
                    {selectedMedication.genericName && (
                      <p className="text-sm text-gray-600 font-normal">
                        Generic: {selectedMedication.genericName}
                      </p>
                    )}
                  </div>
                  <Badge>{selectedMedication.category}</Badge>
                </CardTitle>
                <CardDescription>{selectedMedication.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedMedication.dosage && (
                  <div>
                    <h3 className="font-semibold mb-2">Dosage</h3>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg">{selectedMedication.dosage}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Uses</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMedication.uses.map((use, index) => (
                      <Badge key={index} variant="outline">{use}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Side Effects</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedMedication.sideEffects.map((effect, index) => (
                      <li key={index}>{effect}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Warnings & Precautions</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedMedication.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View on Drugs.com
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Medication
                  </h3>
                  <p className="text-gray-600">
                    Choose a medication from the list to view detailed information
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Assistant Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowAIChat(!showAIChat)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          <Bot className="h-8 w-8" />
        </Button>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Medication AI Assistant
              </CardTitle>
              <CardDescription>
                Ask me anything about medications and health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">
                    👋 Hi! I'm your AI medication assistant. I can help you with:
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Drug interactions</li>
                    <li>• Side effects information</li>
                    <li>• Dosage questions</li>
                    <li>• General medication advice</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Input placeholder="Ask me about medications..." />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAIChat(false)}>
                      Close
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                  ⚠️ This AI assistant provides general information only. Always consult healthcare professionals for medical advice.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MedicationLibrary;
