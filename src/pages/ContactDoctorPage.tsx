
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Globe, AlertTriangle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactDoctorPage = () => {
  const hospitals = [
    {
      name: "Mayo Clinic",
      phone: "(507) 284-2511",
      website: "https://www.mayoclinic.org",
      location: "Rochester, MN",
      specialty: "Multi-specialty"
    },
    {
      name: "Cleveland Clinic",
      phone: "(216) 444-2200",
      website: "https://www.clevelandclinic.org",
      location: "Cleveland, OH",
      specialty: "Cardiology & Heart Surgery"
    },
    {
      name: "Johns Hopkins Hospital",
      phone: "(410) 955-5000",
      website: "https://www.hopkinsmedicine.org",
      location: "Baltimore, MD",
      specialty: "Research & Teaching"
    },
    {
      name: "Massachusetts General Hospital",
      phone: "(617) 726-2000",
      website: "https://www.massgeneral.org",
      location: "Boston, MA",
      specialty: "Multi-specialty"
    },
    {
      name: "UCLA Medical Center",
      phone: "(310) 825-9111",
      website: "https://www.uclahealth.org",
      location: "Los Angeles, CA",
      specialty: "Multi-specialty"
    },
    {
      name: "NewYork-Presbyterian Hospital",
      phone: "(212) 746-5454",
      website: "https://www.nyp.org",
      location: "New York, NY",
      specialty: "Multi-specialty"
    }
  ];

  const emergencyServices = [
    {
      name: "Emergency (911)",
      phone: "911",
      description: "Life-threatening emergencies"
    },
    {
      name: "Poison Control",
      phone: "1-800-222-1222",
      description: "Poisoning emergencies"
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "Mental health crisis support"
    },
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "Suicide prevention and mental health crisis"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-4 hover:bg-indigo-50 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Contact Healthcare Providers
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Find contact information for hospitals and emergency services</p>
        </div>

        {/* Emergency Alert */}
        <Card className="mb-8 bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h2 className="text-xl font-bold text-red-800">Emergency Alert</h2>
                <p className="text-red-700">
                  <strong>Call 911 immediately</strong> if you are experiencing a life-threatening emergency such as:
                  chest pain, difficulty breathing, severe bleeding, loss of consciousness, or stroke symptoms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Services */}
        <Card className="mb-8 bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Phone className="h-5 w-5" />
              Emergency Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyServices.map((service, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800">{service.name}</h3>
                  <a href={`tel:${service.phone}`} className="text-2xl font-bold text-red-600 hover:text-red-800">
                    {service.phone}
                  </a>
                  <p className="text-sm text-red-700 mt-1">{service.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Famous Hospitals and Clinics */}
        <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <MapPin className="h-5 w-5" />
              Major Hospitals & Medical Centers
            </CardTitle>
            <p className="text-gray-600">Contact information for renowned healthcare institutions</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hospital, index) => (
                <div key={index} className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{hospital.name}</h3>
                  <p className="text-gray-600 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {hospital.location}
                  </p>
                  <p className="text-sm text-indigo-600 mb-4 font-medium">{hospital.specialty}</p>
                  
                  <div className="space-y-3">
                    <a 
                      href={`tel:${hospital.phone}`}
                      className="flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold"
                    >
                      <Phone className="h-4 w-4" />
                      {hospital.phone}
                    </a>
                    
                    <a 
                      href={hospital.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="mt-8 bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-indigo-700">Additional Healthcare Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Find Local Healthcare</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Use your insurance provider's website to find in-network doctors</li>
                  <li>• Contact your primary care physician first for non-emergency issues</li>
                  <li>• Consider urgent care for non-life-threatening conditions</li>
                  <li>• Use telehealth services for minor consultations</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">When to Seek Help</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>911:</strong> Life-threatening emergencies</li>
                  <li>• <strong>ER:</strong> Severe pain, serious injuries</li>
                  <li>• <strong>Urgent Care:</strong> Minor injuries, illness</li>
                  <li>• <strong>Primary Care:</strong> Routine check-ups, medication refills</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactDoctorPage;
