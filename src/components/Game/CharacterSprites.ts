
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
    const frameWidth = 20;
    const frameHeight = 30;
    const frames = 4;

    // Criar uma textura com múltiplos frames para animação
    const graphics = scene.add.graphics();
    
    for (let frame = 0; frame < frames; frame++) {
      const offsetX = frame * frameWidth;
      
      // Frame base (parado)
      if (frame === 0) {
        this.drawCharacterFrame(graphics, offsetX, 0, colors, 'idle');
      }
      // Frame 1 - pé esquerdo para frente
      else if (frame === 1) {
        this.drawCharacterFrame(graphics, offsetX, 0, colors, 'left-step');
      }
      // Frame 2 - posição neutra
      else if (frame === 2) {
        this.drawCharacterFrame(graphics, offsetX, 0, colors, 'idle');
      }
      // Frame 3 - pé direito para frente
      else if (frame === 3) {
        this.drawCharacterFrame(graphics, offsetX, 0, colors, 'right-step');
      }
    }

    graphics.generateTexture(`player_${modelType}_walk`, frameWidth * frames, frameHeight);
    graphics.destroy();
  }

  static drawCharacterFrame(graphics: Phaser.GameObjects.Graphics, offsetX: number, offsetY: number, colors: any, pose: string) {
    // Ajustes de posição baseados no pose
    let leftLegOffset = 0;
    let rightLegOffset = 0;
    let leftArmOffset = 0;
    let rightArmOffset = 0;

    if (pose === 'left-step') {
      leftLegOffset = -1;
      rightArmOffset = 1;
    } else if (pose === 'right-step') {
      rightLegOffset = -1;
      leftArmOffset = 1;
    }

    // Cabeça
    graphics.fillStyle(colors.skin);
    graphics.fillRect(offsetX + 6, offsetY + 2, 8, 6);

    // Cabelo
    graphics.fillStyle(colors.hair);
    graphics.fillRect(offsetX + 4, offsetY + 0, 12, 4);

    // Torso
    graphics.fillStyle(colors.shirt);
    graphics.fillRect(offsetX + 4, offsetY + 8, 12, 8);

    // Calça (parte superior)
    graphics.fillStyle(colors.pants);
    graphics.fillRect(offsetX + 5, offsetY + 16, 10, 6);

    // Braços com movimento
    graphics.fillStyle(colors.skin);
    graphics.fillRect(offsetX + 2, offsetY + 10 + leftArmOffset, 3, 6); // braço esquerdo
    graphics.fillRect(offsetX + 15, offsetY + 10 + rightArmOffset, 3, 6); // braço direito

    // Pernas com movimento
    graphics.fillStyle(colors.pants);
    graphics.fillRect(offsetX + 6, offsetY + 22 + leftLegOffset, 3, 6); // perna esquerda
    graphics.fillRect(offsetX + 11, offsetY + 22 + rightLegOffset, 3, 6); // perna direita

    // Pés
    graphics.fillStyle(0x654321);
    graphics.fillRect(offsetX + 5, offsetY + 28 + leftLegOffset, 4, 2); // pé esquerdo
    graphics.fillRect(offsetX + 11, offsetY + 28 + rightLegOffset, 4, 2); // pé direito
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

    // Desenhar o sprite pixel por pixel (frame parado)
    ctx.fillStyle = colors.skin;
    ctx.fillRect(6 * scale, 2 * scale, 8 * scale, 6 * scale); // cabeça

    ctx.fillStyle = colors.hair;
    ctx.fillRect(4 * scale, 0 * scale, 12 * scale, 4 * scale); // cabelo

    ctx.fillStyle = colors.shirt;
    ctx.fillRect(4 * scale, 8 * scale, 12 * scale, 8 * scale); // torso

    ctx.fillStyle = colors.pants;
    ctx.fillRect(5 * scale, 16 * scale, 10 * scale, 6 * scale); // calça

    // Braços
    ctx.fillStyle = colors.skin;
    ctx.fillRect(2 * scale, 10 * scale, 3 * scale, 6 * scale); // braço esquerdo
    ctx.fillRect(15 * scale, 10 * scale, 3 * scale, 6 * scale); // braço direito

    // Pernas
    ctx.fillStyle = colors.pants;
    ctx.fillRect(6 * scale, 22 * scale, 3 * scale, 6 * scale); // perna esquerda
    ctx.fillRect(11 * scale, 22 * scale, 3 * scale, 6 * scale); // perna direita

    // Pés
    ctx.fillStyle = '#654321';
    ctx.fillRect(5 * scale, 28 * scale, 4 * scale, 2 * scale); // pé esquerdo
    ctx.fillRect(11 * scale, 28 * scale, 4 * scale, 2 * scale); // pé direito
  }
}
