export const ALL_SECTORS = [
  { id: 'support_it', icon: '🖧', label: 'Support IT & Réseaux', color: '#6366f1', type: 'service' as const },
  { id: 'tech', icon: '💻', label: 'Technologie & Informatique', color: '#818cf8', type: 'sale' as const },
  { id: 'telecom', icon: '📡', label: 'Télécommunications', color: '#8b5cf6', type: 'sale' as const },
  { id: 'retail', icon: '🛍️', label: 'Commerce & Vente au détail', color: '#ec4899', type: 'sale' as const },
  { id: 'food', icon: '🍽️', label: 'Restauration & Alimentation', color: '#f59e0b', type: 'sale' as const },
  { id: 'transport', icon: '🚗', label: 'Transport & Logistique', color: '#10b981', type: 'sale' as const },
  { id: 'construction', icon: '🏗️', label: 'BTP & Construction', color: '#f97316', type: 'sale' as const },
  { id: 'fashion', icon: '👗', label: 'Mode & Habillement', color: '#a855f7', type: 'sale' as const },
  { id: 'beauty', icon: '💄', label: 'Beauté & Cosmétiques', color: '#fb7185', type: 'sale' as const },
  { id: 'health', icon: '🏥', label: 'Santé & Pharmacie', color: '#06b6d4', type: 'sale' as const },
  { id: 'education', icon: '📚', label: 'Éducation & Formation', color: '#84cc16', type: 'sale' as const },
  { id: 'agriculture', icon: '🌾', label: 'Agriculture & Élevage', color: '#22c55e', type: 'sale' as const },
  { id: 'immobilier', icon: '🏠', label: 'Immobilier', color: '#14b8a6', type: 'sale' as const },
  { id: 'finance', icon: '💰', label: 'Finance & Assurance', color: '#eab308', type: 'sale' as const },
  { id: 'artisanat', icon: '🎨', label: 'Artisanat & Art', color: '#ef4444', type: 'sale' as const },
  { id: 'evenement', icon: '🎉', label: 'Événementiel', color: '#8b5cf6', type: 'sale' as const },
  { id: 'medias', icon: '📰', label: 'Médias & Communication', color: '#3b82f6', type: 'sale' as const },
  { id: 'energie', icon: '⚡', label: 'Énergie & Solaire', color: '#f59e0b', type: 'sale' as const },
  { id: 'peche', icon: '🐟', label: 'Pêche & Maritime', color: '#06b6d4', type: 'sale' as const },
  { id: 'tourisme', icon: '✈️', label: 'Tourisme & Hôtellerie', color: '#a3e635', type: 'sale' as const },
  { id: 'services', icon: '🔧', label: 'Services & Maintenance', color: '#94a3b8', type: 'sale' as const },
]

export type SectorId = typeof ALL_SECTORS[number]['id']

// Sectors that work as services (interventions, not product sales)
export const SERVICE_SECTORS = ['support_it']

export const SECTOR_CATEGORIES: Record<string, string[]> = {
  support_it: [
    'Câblage Réseau',
    'Installation Caméra / CCTV',
    'Dépannage Informatique',
    'Installation WiFi',
    'Intervention sur site',
    'Configuration Réseau',
    'Maintenance Parc Informatique',
    'Installation Serveur',
    'Fibre Optique',
    'Sécurité Informatique',
    'Formation Utilisateur',
    'Récupération de données',
  ],
  tech: ['Ordinateurs', 'Smartphones', 'Tablettes', 'Accessoires', 'Réseau', 'Logiciels', 'Gaming', 'Audio/Vidéo', 'Imprimantes', 'Stockage'],
  telecom: ['Cartes SIM', 'Forfaits Mobile', 'WiFi Zone', 'Équipements Réseau', 'Antennes', 'Câbles', 'Routeurs', 'IPTV'],
  retail: ['Électroménager', 'Vêtements', 'Alimentation', 'Articles maison', 'Jouets', 'Cosmétiques', 'Quincaillerie'],
  food: ['Restauration', 'Boissons', 'Épicerie', 'Pâtisserie', 'Traiteur', 'Livraison repas', 'Café'],
  transport: ['Location véhicule', 'Livraison marchandise', 'Taxi/VTC', 'Fret', 'Carburant', 'Transport scolaire'],
  construction: ['Matériaux', 'Outillage', "Main d'œuvre", 'Finition', 'Électricité bâtiment', 'Plomberie', 'Peinture'],
  fashion: ['Vêtements homme', 'Vêtements femme', 'Enfants', 'Chaussures', 'Sacs & Maroquinerie', 'Bijoux', 'Accessoires'],
  beauty: ['Soins visage', 'Soins cheveux', 'Parfums', 'Maquillage', 'Onglerie', 'Épilation', 'Tresses & Coiffure'],
  health: ['Médicaments', 'Consultations', 'Équipements médicaux', 'Compléments alimentaires', 'Optique', 'Dentaire'],
  education: ['Cours particuliers', 'Formations professionnelles', 'Livres scolaires', 'Fournitures', 'E-learning'],
  agriculture: ['Semences', 'Engrais', 'Bétail', 'Matériel agricole', 'Produits récoltés', 'Irrigation', 'Volaille'],
  immobilier: ['Location appartement', 'Location maison', 'Vente terrain', 'Vente villa', 'Gérance', 'Bureau/Commercial'],
  finance: ["Transfert d'argent", 'Assurance vie', 'Assurance auto', 'Épargne', 'Crédit/Microcrédit', 'Change devises'],
  artisanat: ['Sculpture bois', 'Tissage', 'Poterie', 'Bijoux artisanaux', 'Tableaux', 'Couture sur mesure', 'Maroquinerie'],
  evenement: ['Location salle', 'Sonorisation', 'Décoration', 'Traiteur événement', 'Animation', 'Photo/Vidéo événement'],
  medias: ['Publicité print', 'Publicité digitale', 'Impression', 'Photo/Vidéo', 'Web & Apps', 'Graphisme', 'Réseaux sociaux'],
  energie: ['Panneaux solaires', 'Batteries', 'Installation solaire', 'Maintenance', 'Éclairage LED', 'Groupes électrogènes'],
  peche: ['Poisson frais', 'Poisson séché/Fumé', 'Équipements pêche', 'Location pirogue', 'Filets', 'Glacières'],
  tourisme: ['Hébergement', 'Excursions', 'Restauration touristique', 'Transport touristique', 'Guides touristiques', 'Circuits'],
  services: ['Réparation électronique', 'Nettoyage', 'Gardiennage', 'Climatisation', 'Plomberie', 'Informatique/Dépannage'],
}

export const fmtCFA = (n: number) =>
  `${new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(n || 0)} FCFA`

export const fmt = (n: number) =>
  new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(n || 0)

export const initials = (name: string) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

export const avatarColor = (name: string) => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4','#ef4444','#a855f7','#f97316','#14b8a6']
  let h = 0
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

export const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86400000)
}

// Password strength rules
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}

export const checkPassword = (pwd: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (pwd.length < 8) errors.push('Au moins 8 caractères')
  if (!/[A-Z]/.test(pwd)) errors.push('Une lettre majuscule')
  if (!/[a-z]/.test(pwd)) errors.push('Une lettre minuscule')
  if (!/[0-9]/.test(pwd)) errors.push('Un chiffre')
  if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('Un caractère spécial (!@#$...)')
  return { valid: errors.length === 0, errors }
}

export const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 2) return { score, label: 'Très faible', color: '#ef4444' }
  if (score <= 3) return { score, label: 'Faible', color: '#f97316' }
  if (score <= 4) return { score, label: 'Moyen', color: '#f59e0b' }
  if (score <= 5) return { score, label: 'Fort', color: '#10b981' }
  return { score, label: 'Très fort', color: '#06b6d4' }
}
