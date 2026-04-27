// Stub conservé pour rétrocompatibilité — la logique est dans MainMenuScene.js
import { Scene } from "phaser";
export class MainMenu extends Scene {
  constructor() { super("MainMenu"); }
  create() { this.scene.start("MainMenuScene"); }
}
