import {
  KEY_FORWARD,
  KEY_BACKWARD,
  KEY_LEFT,
  KEY_RIGHT,
} from '../config/gameConstants';

export class InputHandler {
  private keys: Map<string, boolean> = new Map();
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      this.keys.set(e.key.toLowerCase(), true);
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      this.keys.set(e.key.toLowerCase(), false);
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }

  getMovementInput(): { forward: number; turn: number } {
    let forward = 0;
    let turn = 0;

    if (this.isKeyPressed(KEY_FORWARD)) forward += 1;
    if (this.isKeyPressed(KEY_BACKWARD)) forward -= 1;
    if (this.isKeyPressed(KEY_LEFT)) turn += 1;
    if (this.isKeyPressed(KEY_RIGHT)) turn -= 1;

    return { forward, turn };
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys.clear();
  }
}
