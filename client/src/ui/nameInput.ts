import { CAR_COLORS, DEFAULT_CAR_COLOR } from '../config/gameConstants';

export class NameInputUI {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private button: HTMLButtonElement;
  private colorSwatchesContainer: HTMLDivElement;
  private selectedColor: string = DEFAULT_CAR_COLOR;
  private onSubmit?: (name: string, color: string) => void;

  constructor() {
    this.container = this.createContainer();
    this.input = this.createInput();
    this.colorSwatchesContainer = this.createColorSelector();
    this.button = this.createButton();

    this.container.appendChild(this.createTitle());
    this.container.appendChild(this.input);
    this.container.appendChild(this.colorSwatchesContainer);
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

  private createColorSelector(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const label = document.createElement('label');
    label.textContent = 'Choose your car color:';
    label.style.color = 'white';
    label.style.fontSize = '14px';
    label.style.textAlign = 'center';

    const swatchesGrid = document.createElement('div');
    swatchesGrid.style.display = 'grid';
    swatchesGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    swatchesGrid.style.gap = '8px';
    swatchesGrid.style.justifyContent = 'center';

    CAR_COLORS.forEach((colorOption) => {
      const swatch = document.createElement('div');
      swatch.style.width = '40px';
      swatch.style.height = '40px';
      swatch.style.borderRadius = '5px';
      swatch.style.backgroundColor = colorOption.hex;
      swatch.style.cursor = 'pointer';
      swatch.style.border = '3px solid transparent';
      swatch.style.transition = 'border 0.2s, transform 0.2s';
      swatch.title = colorOption.name;
      swatch.dataset.color = colorOption.hex;

      // Set default selection
      if (colorOption.hex === DEFAULT_CAR_COLOR) {
        swatch.style.border = '3px solid white';
        swatch.style.transform = 'scale(1.1)';
      }

      swatch.addEventListener('mouseenter', () => {
        if (this.selectedColor !== colorOption.hex) {
          swatch.style.transform = 'scale(1.05)';
        }
      });

      swatch.addEventListener('mouseleave', () => {
        if (this.selectedColor !== colorOption.hex) {
          swatch.style.transform = 'scale(1)';
        }
      });

      swatch.addEventListener('click', () => {
        // Deselect all swatches
        swatchesGrid.querySelectorAll('div').forEach((s) => {
          (s as HTMLDivElement).style.border = '3px solid transparent';
          (s as HTMLDivElement).style.transform = 'scale(1)';
        });

        // Select this swatch
        swatch.style.border = '3px solid white';
        swatch.style.transform = 'scale(1.1)';
        this.selectedColor = colorOption.hex;
      });

      swatchesGrid.appendChild(swatch);
    });

    container.appendChild(label);
    container.appendChild(swatchesGrid);

    return container;
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
        this.onSubmit?.(name, this.selectedColor);
      }
    };

    this.button.addEventListener('click', handleSubmit);

    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });
  }

  setOnSubmit(callback: (name: string, color: string) => void): void {
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
