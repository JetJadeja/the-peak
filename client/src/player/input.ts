export class InputHandler {
  private keys: Map<string, boolean> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.key.toLowerCase(), true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.key.toLowerCase(), false);
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }

  getMovementInput(): { forward: number; turn: number } {
    let forward = 0;
    let turn = 0;

    if (this.isKeyPressed('w')) forward += 1;
    if (this.isKeyPressed('s')) forward -= 1;
    if (this.isKeyPressed('a')) turn += 1;
    if (this.isKeyPressed('d')) turn -= 1;

    return { forward, turn };
  }
}
