export class NameInputUI {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private button: HTMLButtonElement;
  private onSubmit?: (name: string) => void;

  constructor() {
    this.container = this.createContainer();
    this.input = this.createInput();
    this.button = this.createButton();

    this.container.appendChild(this.createTitle());
    this.container.appendChild(this.input);
    this.container.appendChild(this.button);

    document.body.appendChild(this.container);

    this.setupEventListeners();
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.background = 'rgba(0, 0, 0, 0.8)';
    container.style.padding = '30px';
    container.style.borderRadius = '10px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '15px';
    container.style.zIndex = '1000';
    container.style.fontFamily = 'Arial, sans-serif';
    return container;
  }

  private createTitle(): HTMLHeadingElement {
    const title = document.createElement('h2');
    title.textContent = 'Enter Your Name';
    title.style.color = 'white';
    title.style.margin = '0';
    title.style.fontSize = '24px';
    title.style.textAlign = 'center';
    return title;
  }

  private createInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Your name...';
    input.maxLength = 20;
    input.style.padding = '10px';
    input.style.fontSize = '16px';
    input.style.borderRadius = '5px';
    input.style.border = 'none';
    input.style.outline = 'none';
    return input;
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'Join Game';
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.borderRadius = '5px';
    button.style.border = 'none';
    button.style.background = '#4CAF50';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.transition = 'background 0.3s';

    button.addEventListener('mouseenter', () => {
      button.style.background = '#45a049';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#4CAF50';
    });

    return button;
  }

  private setupEventListeners(): void {
    const handleSubmit = () => {
      const name = this.input.value.trim();
      if (name.length > 0) {
        this.onSubmit?.(name);
      }
    };

    this.button.addEventListener('click', handleSubmit);

    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });
  }

  setOnSubmit(callback: (name: string) => void): void {
    this.onSubmit = callback;
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  show(): void {
    this.container.style.display = 'flex';
    this.input.focus();
  }

  dispose(): void {
    document.body.removeChild(this.container);
  }
}
