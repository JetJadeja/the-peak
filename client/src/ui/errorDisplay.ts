import { ERROR_DISPLAY_DURATION } from '../config/gameConstants';

export class ErrorDisplay {
  private container: HTMLDivElement;

  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.background = 'rgba(220, 38, 38, 0.9)';
    container.style.color = 'white';
    container.style.padding = '15px 25px';
    container.style.borderRadius = '8px';
    container.style.fontSize = '16px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '9999';
    container.style.display = 'none';
    container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
    return container;
  }

  show(message: string, duration: number = ERROR_DISPLAY_DURATION): void {
    this.container.textContent = message;
    this.container.style.display = 'block';

    setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  dispose(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
