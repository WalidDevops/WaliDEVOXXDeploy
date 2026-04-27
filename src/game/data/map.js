/**
 * map.js
 * Définition de la carte 20×15 (grille de cases de 48px).
 *
 * Tuiles :
 *   0 = herbe (franchissable)
 *   1 = chemin (franchissable)
 *   2 = mur bâtiment (non franchissable)
 *   3 = intérieur bâtiment (non franchissable)
 *   4 = arbre (non franchissable)
 *   5 = zone quiz (franchissable, déclenche un quiz)
 *
 * Carte :
 *  - Bâtiment gauche   : cols 0-3,  rows 2-5
 *  - Bâtiment central  : cols 7-12, rows 0-4
 *  - Bâtiment droit    : cols 16-19, rows 2-5
 *  - Jardin + chemins  : reste de la carte
 *  - 5 zones quiz      : positions marquées par 5
 */
export const TILE_SIZE = 48;
export const MAP_COLS  = 20;
export const MAP_ROWS  = 15;

//prettier-ignore
export const TILE_MAP = [
//  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
  [ 4, 0, 0, 0, 4, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 4, 0, 0, 0, 4 ], // row  0
  [ 0, 0, 0, 0, 0, 0, 0, 2, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0 ], // row  1
  [ 2, 2, 2, 2, 0, 0, 0, 2, 3, 3, 3, 3, 2, 0, 0, 0, 2, 2, 2, 2 ], // row  2
  [ 2, 3, 3, 2, 0, 0, 0, 2, 3, 3, 3, 3, 2, 0, 0, 0, 2, 3, 3, 2 ], // row  3
  [ 2, 3, 3, 2, 0, 0, 0, 2, 2, 1, 1, 2, 2, 0, 0, 0, 2, 3, 3, 2 ], // row  4
  [ 2, 2, 2, 2, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 2, 2, 2 ], // row  5
  [ 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 1, 0, 0, 0, 4, 0, 0, 0, 0, 0 ], // row  6
  [ 0, 0, 5, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 5, 0, 0 ], // row  7 (quiz 0,1)
  [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ], // row  8
  [ 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4 ], // row  9
  [ 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0 ], // row 10
  [ 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0 ], // row 11 (quiz 2,3)
  [ 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4 ], // row 12
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], // row 13 (quiz 4)
  [ 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0 ], // row 14
];

/** Positions [col, row] des 5 zones quiz */
export const QUIZ_ZONES = [
  { col: 2,  row: 7,  questionId: 0 },
  { col: 17, row: 7,  questionId: 1 },
  { col: 5,  row: 11, questionId: 2 },
  { col: 14, row: 11, questionId: 3 },
  { col: 9,  row: 13, questionId: 4 },
];

/** Positions de spawn des joueurs (franchissables, hors quiz) */
export const SPAWN_POSITIONS = [
  { col: 9,  row: 11 },  // joueur local
  { col: 3,  row: 7  },  // bot 1
  { col: 16, row: 7  },  // bot 2
  { col: 6,  row: 12 },  // bot 3
];

/** Renvoie true si la case (col, row) est franchissable */
export function isWalkable(col, row) {
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
  const t = TILE_MAP[row][col];
  return t === 0 || t === 1 || t === 5;
}

/** Renvoie le type de la tuile */
export function getTile(col, row) {
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return -1;
  return TILE_MAP[row][col];
}

// ── Projection isométrique ───────────────────────────────────────────────────
/** Largeur d'une tuile iso en pixels */
export const ISO_TILE_W   = 64;
/** Hauteur de la face supérieure d'une tuile iso */
export const ISO_TILE_H   = 32;
/** Hauteur des murs 3D des bâtiments */
export const ISO_WALL_H   = 30;
/** Origine X de la carte iso dans le monde (décalage horizontal) */
export const ISO_ORIGIN_X = 490;
/** Origine Y de la carte iso dans le monde (sous le HUD) */
export const ISO_ORIGIN_Y = 80;
/** Largeur totale du monde (bounds caméra) */
export const ISO_WORLD_W  = 1200;
/** Hauteur totale du monde (bounds caméra) */
export const ISO_WORLD_H  = 760;

/**
 * Convertit des coordonnées grille → point HAUT du losange isométrique.
 * @param {number} col
 * @param {number} row
 * @returns {{ x: number, y: number }}
 */
export function toIso(col, row) {
  return {
    x: ISO_ORIGIN_X + (col - row) * (ISO_TILE_W / 2),
    y: ISO_ORIGIN_Y + (col + row) * (ISO_TILE_H / 2),
  };
}
