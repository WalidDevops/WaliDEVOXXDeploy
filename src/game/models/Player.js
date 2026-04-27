/**
 * Player.js
 * Modèle de données d'un joueur.
 */
export class Player {
  /**
   * @param {object} opts
   * @param {string}  opts.id
   * @param {string}  opts.nickname
   * @param {number}  opts.avatarId
   * @param {object}  [opts.avatarConfig] - Configuration détaillée de l'avatar
   * @param {boolean} [opts.isLocal=false]
   * @param {boolean} [opts.isBot=false]
   * @param {number}  [opts.col=9]
   * @param {number}  [opts.row=11]
   */
  constructor({ id, nickname, avatarId, avatarConfig = null, isLocal = false, isBot = false, col = 9, row = 11 }) {
    this.id       = id;
    this.nickname = nickname;
    this.avatarId = avatarId;
    this.avatarConfig = avatarConfig;
    this.isLocal  = isLocal;
    this.isBot    = isBot;

    this.score = 0;
    this.col   = col;
    this.row   = row;

    /** Timestamp jusqu'auquel le joueur est ralenti */
    this.slowedUntil = 0;
    /** Set des questionId déjà répondues par ce joueur */
    this.answeredQuizzes = new Set();
  }

  /** Vrai si le joueur est actuellement ralenti */
  get isSlowed() {
    return Date.now() < this.slowedUntil;
  }

  /** Applique un effet de ralentissement (ms) */
  applySlowEffect(duration = 3000) {
    this.slowedUntil = Date.now() + duration;
  }

  /** Ajoute des points au score */
  addScore(points) {
    this.score += points;
  }

  /** Sérialisation pour envoi réseau */
  toJSON() {
    return {
      id:           this.id,
      nickname:     this.nickname,
      avatarId:     this.avatarId,
      avatarConfig: this.avatarConfig,
      score:        this.score,
      col:          this.col,
      row:          this.row,
    };
  }
}
