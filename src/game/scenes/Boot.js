/**
 * Boot.js
 * Première scène chargée. Toutes les textures sont générées
 * programmatiquement dans Preloader — pas d'assets distants.
 */
import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Preloader');
  }
}
