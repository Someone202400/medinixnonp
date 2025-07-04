
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, Info, Clock, Pill, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MedicationChatbot from './MedicationChatbot';
import { medicationDatabase } from '@/data/medicationDatabase';

const MedicationLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredMedications = useMemo(() => {
    let filtered = medicationDatabase;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchLower) ||
        med.genericName.toLowerCase().includes(searchLower) ||
        med.brandNames.some(brand => brand.toLowerCase().includes(searchLower)) ||
        med.description.toLowerCase().includes(searchLower) ||
        med.uses.some(use => use.toLowerCase().includes(searchLower)) ||
        med.category.toLowerCase().includes(searchLower)
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
      grouped[letter] = medicationDatabase.filter(med =>
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
          medicationData={medicationDatabase}
        />
      )}

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Library ({medicationDatabase.length} Medications)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by medication name, brand, condition, symptoms, or category..."
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
                          {medication.brandNames.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{medication.brandNames.length - 2} more
                            </Badge>
                          )}
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
                    <div className="flex gap-2 mt-2 flex-wrap">
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
                        {selectedMedication.sideEffects.map((effect, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
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
                        {selectedMedication.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="interactions" className="space-y-3">
                      <h4 className="font-semibold">Drug Interactions</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedMedication.interactions.map((interaction, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
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
