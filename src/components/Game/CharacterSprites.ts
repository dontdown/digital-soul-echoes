
import Phaser from 'phaser';

export class CharacterSprites {
  static createPlayerSprites(scene: Phaser.Scene) {
    // Modelo 1 - Aventureiro (marrom/laranja)
    this.createWalkingSprites(scene, 'adventure', {
      hair: 0x8b4513,
      shirt: 0xd2691e,
      pants: 0x8b4513,
      skin: 0xfdbcb4
    });

    // Modelo 2 - Elfo/Mágico (verde)
    this.createWalkingSprites(scene, 'mage', {
      hair: 0x228b22,
      shirt: 0x32cd32,
      pants: 0x006400,
      skin: 0xfdbcb4
    });

    // Modelo 3 - Guerreiro (vermelho)
    this.createWalkingSprites(scene, 'warrior', {
      hair: 0x8b0000,
      shirt: 0xdc143c,
      pants: 0x8b0000,
      skin: 0xfdbcb4
    });

    // Modelo 4 - Nobre (azul)
    this.createWalkingSprites(scene, 'noble', {
      hair: 0x4169e1,
      shirt: 0x1e90ff,
      pants: 0x000080,
      skin: 0xfdbcb4
    });
  }

  static createWalkingSprites(scene: Phaser.Scene, modelType: string, colors: any) {
    const frameWidth = 32;
    const frameHeight = 32;
    const frames = 4;

    // Criar canvas para a texture
    const canvas = scene.textures.createCanvas(`player_${modelType}_walk`, frameWidth * frames, frameHeight);
    const context = canvas.getContext();

    // Desenhar cada frame da animação
    for (let frame = 0; frame < frames; frame++) {
      const offsetX = frame * frameWidth;
      
      if (frame === 0) {
        // Frame parado
        this.drawCharacterOnCanvas(context, offsetX, 0, frameWidth, frameHeight, colors, 'idle');
      } else if (frame === 1) {
        // Pé esquerdo para frente
        this.drawCharacterOnCanvas(context, offsetX, 0, frameWidth, frameHeight, colors, 'left-step');
      } else if (frame === 2) {
        // Frame parado novamente
        this.drawCharacterOnCanvas(context, offsetX, 0, frameWidth, frameHeight, colors, 'idle');
      } else if (frame === 3) {
        // Pé direito para frente
        this.drawCharacterOnCanvas(context, offsetX, 0, frameWidth, frameHeight, colors, 'right-step');
      }
    }

    canvas.refresh();
  }

  static drawCharacterOnCanvas(context: CanvasRenderingContext2D, offsetX: number, offsetY: number, frameWidth: number, frameHeight: number, colors: any, pose: string) {
    // Centralizar o personagem no frame
    const centerX = offsetX + frameWidth / 2;
    const centerY = offsetY + frameHeight / 2;
    const scale = 1;

    // Ajustes de posição baseados no pose
    let leftLegOffset = 0;
    let rightLegOffset = 0;
    let leftArmOffset = 0;
    let rightArmOffset = 0;

    if (pose === 'left-step') {
      leftLegOffset = -2;
      rightArmOffset = 1;
    } else if (pose === 'right-step') {
      rightLegOffset = -2;
      leftArmOffset = 1;
    }

    // Função helper para desenhar retângulos
    const drawRect = (x: number, y: number, w: number, h: number, color: number) => {
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.fillRect(centerX + x - frameWidth/2, centerY + y - frameHeight/2, w * scale, h * scale);
    };

    // Limpar o frame
    context.clearRect(offsetX, offsetY, frameWidth, frameHeight);

    // Cabeça
    drawRect(-4, -12, 8, 6, colors.skin);

    // Cabelo
    drawRect(-6, -16, 12, 4, colors.hair);

    // Torso
    drawRect(-6, -6, 12, 8, colors.shirt);

    // Calça (parte superior)
    drawRect(-5, 2, 10, 6, colors.pants);

    // Braços com movimento
    drawRect(-8, -4 + leftArmOffset, 3, 6, colors.skin); // braço esquerdo
    drawRect(5, -4 + rightArmOffset, 3, 6, colors.skin); // braço direito

    // Pernas com movimento
    drawRect(-3, 8 + leftLegOffset, 3, 6, colors.pants); // perna esquerda
    drawRect(0, 8 + rightLegOffset, 3, 6, colors.pants); // perna direita

    // Pés
    drawRect(-4, 14 + leftLegOffset, 4, 2, 0x654321); // pé esquerdo
    drawRect(0, 14 + rightLegOffset, 4, 2, 0x654321); // pé direito
  }

  static createEchoSprite(scene: Phaser.Scene, mood: string) {
    const colors = {
      hair: 0x4b0082,
      shirt: this.getEchoColorByMood(mood),
      pants: 0x2f1b69,
      skin: 0xfdbcb4
    };

    // Criar sprites de caminhada para o Echo também
    this.createWalkingSprites(scene, `echo_${mood}`, colors);
  }

  static getEchoColorByMood(mood: string): number {
    switch (mood) {
      case 'feliz': return 0xffd700; // dourado
      case 'triste': return 0x4169e1; // azul
      case 'raiva': return 0xdc143c; // vermelho
      case 'calmo': return 0x32cd32; // verde
      case 'misterioso': return 0x8a2be2; // roxo
      default: return 0x9370db; // roxo médio padrão
    }
  }

  static getPlayerModels() {
    return [
      { id: 'adventure', name: 'Aventureiro', description: 'Explorador corajoso', color: '#d2691e' },
      { id: 'mage', name: 'Mágico', description: 'Usuário de magia', color: '#32cd32' },
      { id: 'warrior', name: 'Guerreiro', description: 'Lutador valente', color: '#dc143c' },
      { id: 'noble', name: 'Nobre', description: 'Aristocrata elegante', color: '#1e90ff' }
    ];
  }

  // Método para criar previews em canvas menores (sem animação)
  static createPreviewSprite(canvasId: string, modelId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurar escala para o preview
    const scale = 3;
    ctx.imageSmoothingEnabled = false;

    // Cores baseadas no modelo
    let colors: any = {};
    switch (modelId) {
      case 'adventure':
        colors = { hair: '#8b4513', shirt: '#d2691e', pants: '#8b4513', skin: '#fdbcb4' };
        break;
      case 'mage':
        colors = { hair: '#228b22', shirt: '#32cd32', pants: '#006400', skin: '#fdbcb4' };
        break;
      case 'warrior':
        colors = { hair: '#8b0000', shirt: '#dc143c', pants: '#8b0000', skin: '#fdbcb4' };
        break;
      case 'noble':
        colors = { hair: '#4169e1', shirt: '#1e90ff', pants: '#000080', skin: '#fdbcb4' };
        break;
    }

    // Centralizar no canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Desenhar o sprite pixel por pixel (frame parado)
    ctx.fillStyle = colors.skin;
    ctx.fillRect(centerX - 4 * scale, centerY - 12 * scale, 8 * scale, 6 * scale); // cabeça

    ctx.fillStyle = colors.hair;
    ctx.fillRect(centerX - 6 * scale, centerY - 16 * scale, 12 * scale, 4 * scale); // cabelo

    ctx.fillStyle = colors.shirt;
    ctx.fillRect(centerX - 6 * scale, centerY - 6 * scale, 12 * scale, 8 * scale); // torso

    ctx.fillStyle = colors.pants;
    ctx.fillRect(centerX - 5 * scale, centerY + 2 * scale, 10 * scale, 6 * scale); // calça

    // Braços
    ctx.fillStyle = colors.skin;
    ctx.fillRect(centerX - 8 * scale, centerY - 4 * scale, 3 * scale, 6 * scale); // braço esquerdo
    ctx.fillRect(centerX + 5 * scale, centerY - 4 * scale, 3 * scale, 6 * scale); // braço direito

    // Pernas
    ctx.fillStyle = colors.pants;
    ctx.fillRect(centerX - 3 * scale, centerY + 8 * scale, 3 * scale, 6 * scale); // perna esquerda
    ctx.fillRect(centerX, centerY + 8 * scale, 3 * scale, 6 * scale); // perna direita

    // Pés
    ctx.fillStyle = '#654321';
    ctx.fillRect(centerX - 4 * scale, centerY + 14 * scale, 4 * scale, 2 * scale); // pé esquerdo
    ctx.fillRect(centerX, centerY + 14 * scale, 4 * scale, 2 * scale); // pé direito
  }
}
