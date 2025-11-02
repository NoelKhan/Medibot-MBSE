/**
 * Pharmacy Service - Web Adapted
 * ===============================
 * Provides medication recommendations and pharmacy information
 * Adapted from mobile app to use localStorage instead of AsyncStorage
 */

// Web storage adapter
const WebStorage = {
  getItem: async (key: string) => localStorage.getItem(key),
  setItem: async (key: string, value: string) => { localStorage.setItem(key, value); },
  removeItem: async (key: string) => { localStorage.removeItem(key); },
};

import { createLogger } from './Logger';

const logger = createLogger('PharmacyService');

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions: string;
  sideEffects: string[];
  warnings: string[];
  category: 'pain-relief' | 'antibiotic' | 'antihistamine' | 'antacid' | 'fever-reducer' | 'cough-cold' | 'other';
  overTheCounter: boolean;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  distance?: number;
  rating: number;
  services: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface MedicationRecommendation {
  medication: Medication;
  reason: string;
  alternatives: string[];
  pharmacies: Pharmacy[];
  urgency: 1 | 2 | 3 | 4 | 5;
}

class PharmacyService {
  private static instance: PharmacyService;
  private medications: Medication[] = [];
  private pharmacies: Pharmacy[] = [];

  private constructor() {
    this.initializeMedications();
    this.initializePharmacies();
  }

  public static getInstance(): PharmacyService {
    if (!PharmacyService.instance) {
      PharmacyService.instance = new PharmacyService();
    }
    return PharmacyService.instance;
  }

  private initializeMedications(): void {
    this.medications = [
      {
        id: 'med_001',
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 4-6 hours as needed',
        instructions: 'Take with food or milk to reduce stomach irritation. Do not exceed 8 tablets in 24 hours.',
        sideEffects: ['Nausea', 'Stomach upset', 'Rare: liver damage with overdose'],
        warnings: ['Do not exceed recommended dose', 'Consult doctor if symptoms persist over 3 days'],
        category: 'pain-relief',
        overTheCounter: true,
        price: { min: 3, max: 8, currency: 'AUD' }
      },
      {
        id: 'med_002',
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosage: '200mg',
        frequency: 'Every 6-8 hours as needed',
        instructions: 'Take with food to reduce stomach irritation. Drink plenty of water.',
        sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness', 'Headache'],
        warnings: ['Not suitable during pregnancy', 'Consult doctor if you have heart conditions'],
        category: 'pain-relief',
        overTheCounter: true,
        price: { min: 4, max: 12, currency: 'AUD' }
      },
      {
        id: 'med_003',
        name: 'Loratadine',
        genericName: 'Loratadine',
        dosage: '10mg',
        frequency: 'Once daily',
        instructions: 'Take in the morning. Can be taken with or without food.',
        sideEffects: ['Drowsiness', 'Dry mouth', 'Headache'],
        warnings: ['May interact with certain medications'],
        category: 'antihistamine',
        overTheCounter: true,
        price: { min: 6, max: 15, currency: 'AUD' }
      },
      {
        id: 'med_004',
        name: 'Antacid Tablets',
        genericName: 'Calcium Carbonate',
        dosage: '500mg',
        frequency: 'As needed after meals',
        instructions: 'Chew thoroughly before swallowing. Take 1-2 hours after meals.',
        sideEffects: ['Constipation', 'Gas', 'Belching'],
        warnings: ['Do not exceed 6 tablets per day'],
        category: 'antacid',
        overTheCounter: true,
        price: { min: 5, max: 10, currency: 'AUD' }
      },
      {
        id: 'med_005',
        name: 'Cough Syrup',
        genericName: 'Dextromethorphan',
        dosage: '15ml',
        frequency: 'Every 4 hours as needed',
        instructions: 'Measure with provided spoon. Do not exceed recommended dose.',
        sideEffects: ['Drowsiness', 'Nausea', 'Dizziness'],
        warnings: ['Not for children under 6 years', 'May cause drowsiness'],
        category: 'cough-cold',
        overTheCounter: true,
        price: { min: 8, max: 18, currency: 'AUD' }
      }
    ];
  }

  private initializePharmacies(): void {
    this.pharmacies = [
      {
        id: 'pharm_001',
        name: 'Chemist Warehouse',
        address: '123 Collins Street, Melbourne VIC 3000',
        phone: '(03) 9123 4567',
        hours: 'Mon-Fri: 8am-9pm, Sat-Sun: 9am-6pm',
        rating: 4.2,
        services: ['Prescription filling', 'Health checks', 'Vaccinations', 'Home delivery'],
        coordinates: { latitude: -37.8136, longitude: 144.9631 }
      },
      {
        id: 'pharm_002',
        name: 'Priceline Pharmacy',
        address: '456 Bourke Street, Melbourne VIC 3000',
        phone: '(03) 9234 5678',
        hours: 'Mon-Fri: 8:30am-8pm, Sat: 9am-6pm, Sun: 10am-5pm',
        rating: 4.0,
        services: ['Prescription filling', 'Beauty products', 'Health advice', 'Click & collect'],
        coordinates: { latitude: -37.8142, longitude: 144.9633 }
      },
      {
        id: 'pharm_003',
        name: 'Terry White Chemmart',
        address: '789 Flinders Street, Melbourne VIC 3000',
        phone: '(03) 9345 6789',
        hours: 'Mon-Fri: 8am-7pm, Sat: 9am-5pm, Sun: Closed',
        rating: 4.3,
        services: ['Prescription filling', 'Health screenings', 'Medication reviews', 'Webster packs'],
        coordinates: { latitude: -37.8183, longitude: 144.9671 }
      },
      {
        id: 'pharm_004',
        name: 'Discount Drug Stores',
        address: '321 Swanston Street, Melbourne VIC 3000',
        phone: '(03) 9456 7890',
        hours: 'Daily: 8am-10pm',
        rating: 3.9,
        services: ['Prescription filling', 'Budget medications', 'Health products', '24/7 emergency line'],
        coordinates: { latitude: -37.8080, longitude: 144.9633 }
      }
    ];
  }

  // Get medication recommendations based on symptoms
  async getMedicationRecommendations(symptoms: string[]): Promise<MedicationRecommendation[]> {
    const recommendations: MedicationRecommendation[] = [];
    
    for (const symptom of symptoms) {
      const symptomLower = symptom.toLowerCase();
      
      // Pain-related symptoms
      if (symptomLower.includes('pain') || symptomLower.includes('ache') || 
          symptomLower.includes('sore') || symptomLower.includes('headache')) {
        
        const paracetamol = this.medications.find(m => m.name === 'Paracetamol');
        const ibuprofen = this.medications.find(m => m.name === 'Ibuprofen');
        
        if (paracetamol) {
          recommendations.push({
            medication: paracetamol,
            reason: 'Effective for pain relief and fever reduction',
            alternatives: ['Ibuprofen (if no stomach issues)', 'Aspirin (for adults only)'],
            pharmacies: this.getRandomPharmacies(3),
            urgency: 2
          });
        }
        
        if (ibuprofen && !symptomLower.includes('stomach')) {
          recommendations.push({
            medication: ibuprofen,
            reason: 'Anti-inflammatory properties help with pain and swelling',
            alternatives: ['Paracetamol (gentler on stomach)', 'Naproxen'],
            pharmacies: this.getRandomPharmacies(3),
            urgency: 2
          });
        }
      }
      
      // Allergy symptoms
      if (symptomLower.includes('allerg') || symptomLower.includes('itch') || 
          symptomLower.includes('rash') || symptomLower.includes('sneez')) {
        
        const loratadine = this.medications.find(m => m.name === 'Loratadine');
        if (loratadine) {
          recommendations.push({
            medication: loratadine,
            reason: 'Non-drowsy antihistamine for allergy relief',
            alternatives: ['Cetirizine', 'Fexofenadine', 'Chlorpheniramine (may cause drowsiness)'],
            pharmacies: this.getRandomPharmacies(3),
            urgency: 2
          });
        }
      }
      
      // Stomach issues
      if (symptomLower.includes('stomach') || symptomLower.includes('heartburn') || 
          symptomLower.includes('indigestion') || symptomLower.includes('acid')) {
        
        const antacid = this.medications.find(m => m.name === 'Antacid Tablets');
        if (antacid) {
          recommendations.push({
            medication: antacid,
            reason: 'Neutralizes stomach acid for quick relief',
            alternatives: ['Omeprazole (for frequent heartburn)', 'Ranitidine', 'Gaviscon'],
            pharmacies: this.getRandomPharmacies(3),
            urgency: 1
          });
        }
      }
      
      // Cough and cold
      if (symptomLower.includes('cough') || symptomLower.includes('cold') || 
          symptomLower.includes('throat')) {
        
        const coughSyrup = this.medications.find(m => m.name === 'Cough Syrup');
        if (coughSyrup) {
          recommendations.push({
            medication: coughSyrup,
            reason: 'Suppresses dry cough and soothes throat irritation',
            alternatives: ['Throat lozenges', 'Honey and lemon', 'Steam inhalation'],
            pharmacies: this.getRandomPharmacies(3),
            urgency: 1
          });
        }
      }
    }
    
    // Remove duplicates and limit to top 3 recommendations
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.medication.id === rec.medication.id)
    );
    
    return uniqueRecommendations.slice(0, 3);
  }

  private getRandomPharmacies(count: number): Pharmacy[] {
    const shuffled = [...this.pharmacies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Get all pharmacies sorted by distance (mock implementation)
  async getNearbyPharmacies(_userLocation?: { latitude: number; longitude: number }): Promise<Pharmacy[]> {
    // In a real app, this would use GPS and calculate actual distances
    return this.pharmacies.map(pharmacy => ({
      ...pharmacy,
      distance: Math.random() * 10 + 0.5 // Mock distance between 0.5-10.5 km
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Search medications by name or category
  searchMedications(query: string): Medication[] {
    const queryLower = query.toLowerCase();
    return this.medications.filter(med => 
      med.name.toLowerCase().includes(queryLower) ||
      med.genericName?.toLowerCase().includes(queryLower) ||
      med.category.includes(queryLower)
    );
  }

  // Get medication by ID
  getMedicationById(id: string): Medication | undefined {
    return this.medications.find(med => med.id === id);
  }

  // Get pharmacy by ID
  getPharmacyById(id: string): Pharmacy | undefined {
    return this.pharmacies.find(pharm => pharm.id === id);
  }

  // Save user's medication history
  async saveMedicationHistory(userId: string, medicationId: string): Promise<void> {
    try {
      const key = `@medibot_medication_history_${userId}`;
      const existing = await WebStorage.getItem(key);
      const history = existing ? JSON.parse(existing) : [];
      
      const newEntry = {
        medicationId,
        timestamp: new Date().toISOString(),
      };
      
      history.unshift(newEntry);
      
      // Keep only last 20 entries
      const trimmed = history.slice(0, 20);
      
      await WebStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      logger.error('Error saving medication history', error);
    }
  }

  // Get user's medication history
  async getMedicationHistory(userId: string): Promise<{ medication: Medication | undefined; timestamp: string }[]> {
    try {
      const key = `@medibot_medication_history_${userId}`;
      const stored = await WebStorage.getItem(key);
      
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      
      return history.map((entry: any) => ({
        medication: this.getMedicationById(entry.medicationId),
        timestamp: entry.timestamp
      })).filter((entry: any) => entry.medication);
      
    } catch (error) {
      logger.error('Error loading medication history', error);
      return [];
    }
  }

  // Generate medication advice text for chat
  generateMedicationAdvice(recommendations: MedicationRecommendation[]): string {
    if (recommendations.length === 0) {
      return "I don't have specific medication recommendations for your symptoms. It's best to consult with a pharmacist or healthcare provider for personalized advice.";
    }

    let advice = "💊 **Medication Recommendations:**\n\n";
    
    recommendations.forEach((rec, index) => {
      const med = rec.medication;
      advice += `**${index + 1}. ${med.name}** ${med.overTheCounter ? '(Available without prescription)' : '(Prescription required)'}\n`;
      advice += `• **Dosage:** ${med.dosage}\n`;
      advice += `• **How often:** ${med.frequency}\n`;
      advice += `• **Why recommended:** ${rec.reason}\n`;
      advice += `• **Instructions:** ${med.instructions}\n`;
      advice += `• **Price range:** $${med.price?.min}-${med.price?.max} ${med.price?.currency}\n`;
      
      if (med.warnings.length > 0) {
        advice += `• **⚠️ Important:** ${med.warnings.join(', ')}\n`;
      }
      
      advice += `• **Alternatives:** ${rec.alternatives.join(', ')}\n\n`;
    });

    advice += "🏪 **Nearby Pharmacies:**\n";
    const uniquePharmacies = new Map();
    recommendations.forEach(rec => {
      rec.pharmacies.forEach(pharmacy => {
        if (!uniquePharmacies.has(pharmacy.id)) {
          uniquePharmacies.set(pharmacy.id, pharmacy);
        }
      });
    });

    Array.from(uniquePharmacies.values()).slice(0, 3).forEach(pharmacy => {
      advice += `• **${pharmacy.name}** - ${pharmacy.address}\n`;
      advice += `  📞 ${pharmacy.phone} | ⏰ ${pharmacy.hours}\n`;
      advice += `  ⭐ ${pharmacy.rating}/5 | Services: ${pharmacy.services.slice(0, 2).join(', ')}\n\n`;
    });

    advice += "**⚠️ Important Reminders:**\n";
    advice += "• Always read the label and follow dosage instructions\n";
    advice += "• Consult a pharmacist if you have questions or concerns\n";
    advice += "• Seek medical attention if symptoms worsen or persist\n";
    advice += "• Inform your doctor about all medications you're taking\n";

    return advice;
  }
}

export default PharmacyService;
