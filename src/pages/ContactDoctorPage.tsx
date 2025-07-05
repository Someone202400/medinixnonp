
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Globe, AlertTriangle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactDoctorPage = () => {
  const hospitals = [
    // California
    {
      name: "UCLA Medical Center",
      phone: "(310) 825-9111",
      website: "https://www.uclahealth.org",
      location: "Los Angeles, CA",
      specialty: "Multi-specialty"
    },
    {
      name: "Stanford Health Care",
      phone: "(650) 723-4000",
      website: "https://stanfordhealthcare.org",
      location: "Stanford, CA",
      specialty: "Multi-specialty"
    },
    // New York
    {
      name: "NewYork-Presbyterian Hospital",
      phone: "(212) 746-5454",
      website: "https://www.nyp.org",
      location: "New York, NY",
      specialty: "Multi-specialty"
    },
    {
      name: "Mount Sinai Hospital",
      phone: "(212) 241-6500",
      website: "https://www.mountsinai.org",
      location: "New York, NY",
      specialty: "Multi-specialty"
    },
    // Massachusetts
    {
      name: "Massachusetts General Hospital",
      phone: "(617) 726-2000",
      website: "https://www.massgeneral.org",
      location: "Boston, MA",
      specialty: "Multi-specialty"
    },
    {
      name: "Brigham and Women's Hospital",
      phone: "(617) 732-5500",
      website: "https://www.brighamandwomens.org",
      location: "Boston, MA",
      specialty: "Multi-specialty"
    },
    // Maryland
    {
      name: "Johns Hopkins Hospital",
      phone: "(410) 955-5000",
      website: "https://www.hopkinsmedicine.org",
      location: "Baltimore, MD",
      specialty: "Research & Teaching"
    },
    // Ohio
    {
      name: "Cleveland Clinic",
      phone: "(216) 444-2200",
      website: "https://www.clevelandclinic.org",
      location: "Cleveland, OH",
      specialty: "Cardiology & Heart Surgery"
    },
    // Minnesota
    {
      name: "Mayo Clinic",
      phone: "(507) 284-2511",
      website: "https://www.mayoclinic.org",
      location: "Rochester, MN",
      specialty: "Multi-specialty"
    },
    // Texas
    {
      name: "Houston Methodist Hospital",
      phone: "(713) 790-3311",
      website: "https://www.houstonmethodist.org",
      location: "Houston, TX",
      specialty: "Multi-specialty"
    },
    {
      name: "UT Southwestern Medical Center",
      phone: "(214) 633-4000",
      website: "https://www.utsouthwestern.edu",
      location: "Dallas, TX",
      specialty: "Academic Medical Center"
    },
    // Florida
    {
      name: "Mayo Clinic Florida",
      phone: "(904) 953-2000",
      website: "https://www.mayoclinic.org/locations/florida",
      location: "Jacksonville, FL",
      specialty: "Multi-specialty"
    },
    {
      name: "Jackson Memorial Hospital",
      phone: "(305) 585-1111",
      website: "https://www.jacksonhealth.org",
      location: "Miami, FL",
      specialty: "Academic Medical Center"
    },
    // Illinois
    {
      name: "Northwestern Memorial Hospital",
      phone: "(312) 926-2000",
      website: "https://www.nm.org",
      location: "Chicago, IL",
      specialty: "Multi-specialty"
    },
    // Washington
    {
      name: "Seattle Children's Hospital",
      phone: "(206) 987-2000",
      website: "https://www.seattlechildrens.org",
      location: "Seattle, WA",
      specialty: "Pediatrics"
    },
    {
      name: "University of Washington Medical Center",
      phone: "(206) 598-3300",
      website: "https://www.uwmedicine.org",
      location: "Seattle, WA",
      specialty: "Academic Medical Center"
    },
    // Colorado
    {
      name: "National Jewish Health",
      phone: "(303) 388-4461",
      website: "https://www.nationaljewish.org",
      location: "Denver, CO",
      specialty: "Respiratory Medicine"
    },
    // Georgia
    {
      name: "Emory University Hospital",
      phone: "(404) 712-2000",
      website: "https://www.emoryhealthcare.org",
      location: "Atlanta, GA",
      specialty: "Academic Medical Center"
    },
    // Pennsylvania
    {
      name: "Hospital of the University of Pennsylvania",
      phone: "(215) 662-4000",
      website: "https://www.pennmedicine.org",
      location: "Philadelphia, PA",
      specialty: "Academic Medical Center"
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 via-blue-50 to-emerald-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-4 bg-white/80 backdrop-blur-sm border-white/30 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            Contact Healthcare Providers
          </h1>
          <p className="text-gray-600 text-lg bg-white/60 backdrop-blur-sm rounded-lg p-3 inline-block">
            Find contact information for hospitals and emergency services
          </p>
        </div>

        {/* Emergency 911 Alert - More Prominent */}
        <Card className="mb-8 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-full">
                <AlertTriangle className="h-12 w-12 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">🚨 EMERGENCY - CALL 911 🚨</h2>
                <p className="text-xl font-semibold mb-2">
                  Call 911 IMMEDIATELY for life-threatening emergencies:
                </p>
                <ul className="text-lg space-y-1">
                  <li>• Chest pain or heart attack symptoms</li>
                  <li>• Difficulty breathing or choking</li>
                  <li>• Severe bleeding or trauma</li>
                  <li>• Loss of consciousness</li>
                  <li>• Stroke symptoms (face drooping, arm weakness, speech difficulty)</li>
                </ul>
                <div className="mt-4 p-4 bg-white/20 rounded-lg">
                  <a href="tel:911" className="text-4xl font-black hover:text-yellow-200 transition-colors">
                    📞 CALL 911 NOW
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Services */}
        <Card className="mb-8 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100">
            <CardTitle className="flex items-center gap-2 text-red-700 text-2xl">
              <Phone className="h-6 w-6" />
              Emergency & Crisis Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {emergencyServices.map((service, index) => (
                <div key={index} className="p-6 bg-gradient-to-br from-white to-red-50 rounded-xl border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <h3 className="font-bold text-xl text-red-800 mb-2">{service.name}</h3>
                  <a href={`tel:${service.phone}`} className="text-3xl font-black text-red-600 hover:text-red-800 block mb-2 transition-colors">
                    {service.phone}
                  </a>
                  <p className="text-red-700 font-medium">{service.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Famous Hospitals and Clinics */}
        <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 border-2 border-white/50 shadow-2xl backdrop-blur-md">
          <CardHeader className="bg-gradient-to-r from-blue-100 via-purple-100 to-emerald-100">
            <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-700 to-emerald-700 bg-clip-text text-transparent">
              <MapPin className="h-6 w-6 text-blue-600" />
              Major Hospitals & Medical Centers
            </CardTitle>
            <p className="text-gray-700 font-medium">Contact information for renowned healthcare institutions across the United States</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hospitals.map((hospital, index) => (
                <div key={index} className="p-6 bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl border-2 border-white/70 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-1">
                  <h3 className="font-bold text-xl bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-3">{hospital.name}</h3>
                  <p className="text-gray-600 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {hospital.location}
                  </p>
                  <p className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 font-bold">{hospital.specialty}</p>
                  
                  <div className="space-y-4">
                    <a 
                      href={`tel:${hospital.phone}`}
                      className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg text-green-700 hover:from-green-200 hover:to-emerald-200 font-bold transition-all duration-300 transform hover:scale-105"
                    >
                      <Phone className="h-5 w-5" />
                      {hospital.phone}
                    </a>
                    
                    <a 
                      href={hospital.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg text-blue-700 hover:from-blue-200 hover:to-purple-200 font-bold transition-all duration-300 transform hover:scale-105"
                    >
                      <Globe className="h-5 w-5" />
                      Visit Website
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100">
            <CardTitle className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent text-2xl">Additional Healthcare Resources</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 p-6 bg-gradient-to-br from-white to-emerald-50 rounded-xl shadow-lg">
                <h4 className="font-bold text-xl text-emerald-800">Find Local Healthcare</h4>
                <ul className="space-y-3 text-emerald-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Use your insurance provider's website to find in-network doctors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Contact your primary care physician first for non-emergency issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Consider urgent care for non-life-threatening conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Use telehealth services for minor consultations</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4 p-6 bg-gradient-to-br from-white to-teal-50 rounded-xl shadow-lg">
                <h4 className="font-bold text-xl text-teal-800">When to Seek Help</h4>
                <ul className="space-y-3 text-teal-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">🚨</span>
                    <span><strong>911:</strong> Life-threatening emergencies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">🏥</span>
                    <span><strong>ER:</strong> Severe pain, serious injuries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold">⚡</span>
                    <span><strong>Urgent Care:</strong> Minor injuries, illness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">👩‍⚕️</span>
                    <span><strong>Primary Care:</strong> Routine check-ups, medication refills</span>
                  </li>
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
