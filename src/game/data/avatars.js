/**
 * avatars.js
 * Système complet de personnalisation d'avatars humanisés
 * Genre, couleur de peau, cheveux, barbe, lunettes, vêtements
 */

// Couleurs de peau
export const SKIN_COLORS = [
  { id: 0, name: "Claire", color: 0xfde4c7 },
  { id: 1, name: "Beige", color: 0xe8b995 },
  { id: 2, name: "Bronzée", color: 0xd19a6c },
  { id: 3, name: "Mate", color: 0xb07850 },
  { id: 4, name: "Foncée", color: 0x8d5524 },
  { id: 5, name: "Très foncée", color: 0x5d3a1a },
];

// Styles de cheveux
export const HAIR_STYLES = [
  { id: 0, name: "Courts", type: "short" },
  { id: 1, name: "Mi-longs", type: "medium" },
  { id: 2, name: "Longs", type: "long" },
  { id: 3, name: "Bouclés", type: "curly" },
  { id: 4, name: "Chauve", type: "bald" },
  { id: 5, name: "Queue de cheval", type: "ponytail" },
];

// Couleurs de cheveux
export const HAIR_COLORS = [
  { id: 0, name: "Noir", color: 0x1a1a1a },
  { id: 1, name: "Brun", color: 0x4a2511 },
  { id: 2, name: "Châtain", color: 0x8b5a3c },
  { id: 3, name: "Blond", color: 0xf4d03f },
  { id: 4, name: "Roux", color: 0xc0392b },
  { id: 5, name: "Blanc", color: 0xf0f0f0 },
  { id: 6, name: "Coloré", color: 0x9b59b6 },
];

// Styles de barbe (pour hommes)
export const BEARD_STYLES = [
  { id: 0, name: "Aucune", type: "none" },
  { id: 1, name: "Courte", type: "short" },
  { id: 2, name: "Longue", type: "long" },
  { id: 3, name: "Bouc", type: "goatee" },
  { id: 4, name: "Moustache", type: "mustache" },
];

// Styles de lunettes
export const GLASSES_STYLES = [
  { id: 0, name: "Aucune", type: "none" },
  { id: 1, name: "Rondes", type: "round" },
  { id: 2, name: "Rectangulaires", type: "rect" },
  { id: 3, name: "Soleil", type: "sun" },
];

// Couleurs de vêtements
export const CLOTHING_COLORS = [
  { id: 0, name: "Rouge", color: 0xe74c3c },
  { id: 1, name: "Bleu", color: 0x3498db },
  { id: 2, name: "Vert", color: 0x2ecc71 },
  { id: 3, name: "Jaune", color: 0xf1c40f },
  { id: 4, name: "Violet", color: 0x9b59b6 },
  { id: 5, name: "Orange", color: 0xe67e22 },
  { id: 6, name: "Rose", color: 0xe91e63 },
  { id: 7, name: "Noir", color: 0x2c3e50 },
  { id: 8, name: "Blanc", color: 0xecf0f1 },
];

// Avatar par défaut
export const DEFAULT_AVATAR = {
  gender: "male", // "male" ou "female"
  skinColor: 0,
  hairStyle: 0,
  hairColor: 0,
  beardStyle: 0,
  glassesStyle: 0,
  clothingColor: 1, // Bleu par défaut
};

// Pour compatibilité avec l'ancien système
export const AVATARS = [
  { id: 0, ...DEFAULT_AVATAR, clothingColor: 0 },
  { id: 1, ...DEFAULT_AVATAR, clothingColor: 1 },
  { id: 2, ...DEFAULT_AVATAR, clothingColor: 2 },
  { id: 3, ...DEFAULT_AVATAR, clothingColor: 3 },
  { id: 4, ...DEFAULT_AVATAR, clothingColor: 4 },
  { id: 5, ...DEFAULT_AVATAR, clothingColor: 5 },
];
