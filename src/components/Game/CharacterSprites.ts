
import Phaser from 'phaser';

export class CharacterSprites {
  static createPlayerSprites(scene: Phaser.Scene) {
    // Modelo 1 - Aventureiro (marrom/laranja como na imagem)
    scene.add.graphics()
      .fillStyle(0xfdbcb4) // pele rosada
      .fillRect(6, 2, 8, 6) // cabeça
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(4, 0, 12, 4) // cabelo
      .fillStyle(0xd2691e) // roupa laranja/marrom
      .fillRect(4, 8, 12, 8) // torso
      .fillStyle(0x8b4513) // calça marrom
      .fillRect(5, 16, 10, 6) // calça
      // braços
      .fillStyle(0xfdbcb4) // pele
      .fillRect(2, 10, 3, 6) // braço esquerdo
      .fillRect(15, 10, 3, 6) // braço direito
      // pernas
      .fillStyle(0x8b4513) // calça
      .fillRect(6, 22, 3, 6) // perna esquerda
      .fillRect(11, 22, 3, 6) // perna direita
      // pés
      .fillStyle(0x654321)
      .fillRect(5, 28, 4, 2) // pé esquerdo
      .fillRect(11, 28, 4, 2) // pé direito
      .generateTexture('player_adventure', 20, 30);

    // Modelo 2 - Elfo/Mágico (verde como na imagem)
    scene.add.graphics()
      .fillStyle(0xfdbcb4) // pele
      .fillRect(6, 2, 8, 6) // cabeça
      .fillStyle(0x228b22) // cabelo verde
      .fillRect(4, 0, 12, 4) // cabelo
      .fillStyle(0x32cd32) // roupa verde
      .fillRect(4, 8, 12, 8) // torso
      .fillStyle(0x006400) // calça verde escura
      .fillRect(5, 16, 10, 6) // calça
      // braços
      .fillStyle(0xfdbcb4)
      .fillRect(2, 10, 3, 6) // braço esquerdo
      .fillRect(15, 10, 3, 6) // braço direito
      // pernas
      .fillStyle(0x006400)
      .fillRect(6, 22, 3, 6) // perna esquerda
      .fillRect(11, 22, 3, 6) // perna direita
      // pés
      .fillStyle(0x654321)
      .fillRect(5, 28, 4, 2) // pé esquerdo
      .fillRect(11, 28, 4, 2) // pé direito
      .generateTexture('player_mage', 20, 30);

    // Modelo 3 - Guerreiro (vermelho como na imagem)
    scene.add.graphics()
      .fillStyle(0xfdbcb4) // pele
      .fillRect(6, 2, 8, 6) // cabeça
      .fillStyle(0x8b0000) // cabelo vermelho escuro
      .fillRect(4, 0, 12, 4) // cabelo
      .fillStyle(0xdc143c) // roupa vermelha
      .fillRect(4, 8, 12, 8) // torso
      .fillStyle(0x8b0000) // calça vermelha escura
      .fillRect(5, 16, 10, 6) // calça
      // braços
      .fillStyle(0xfdbcb4)
      .fillRect(2, 10, 3, 6) // braço esquerdo
      .fillRect(15, 10, 3, 6) // braço direito
      // pernas
      .fillStyle(0x8b0000)
      .fillRect(6, 22, 3, 6) // perna esquerda
      .fillRect(11, 22, 3, 6) // perna direita
      // pés
      .fillStyle(0x654321)
      .fillRect(5, 28, 4, 2) // pé esquerdo
      .fillRect(11, 28, 4, 2) // pé direito
      .generateTexture('player_warrior', 20, 30);

    // Modelo 4 - Nobre (azul como na imagem)
    scene.add.graphics()
      .fillStyle(0xfdbcb4) // pele
      .fillRect(6, 2, 8, 6) // cabeça
      .fillStyle(0x4169e1) // cabelo azul
      .fillRect(4, 0, 12, 4) // cabelo
      .fillStyle(0x1e90ff) // roupa azul
      .fillRect(4, 8, 12, 8) // torso
      .fillStyle(0x000080) // calça azul escura
      .fillRect(5, 16, 10, 6) // calça
      // braços
      .fillStyle(0xfdbcb4)
      .fillRect(2, 10, 3, 6) // braço esquerdo
      .fillRect(15, 10, 3, 6) // braço direito
      // pernas
      .fillStyle(0x000080)
      .fillRect(6, 22, 3, 6) // perna esquerda
      .fillRect(11, 22, 3, 6) // perna direita
      // pés
      .fillStyle(0x654321)
      .fillRect(5, 28, 4, 2) // pé esquerdo
      .fillRect(11, 28, 4, 2) // pé direito
      .generateTexture('player_noble', 20, 30);
  }

  static createEchoSprite(scene: Phaser.Scene, mood: string) {
    // Echo sempre usa o modelo roxo/místico
    const baseColor = this.getEchoColorByMood(mood);
    
    scene.add.graphics()
      .fillStyle(0xfdbcb4) // pele
      .fillRect(6, 2, 8, 6) // cabeça
      .fillStyle(0x4b0082) // cabelo roxo
      .fillRect(4, 0, 12, 4) // cabelo
      .fillStyle(baseColor) // roupa baseada no humor
      .fillRect(4, 8, 12, 8) // torso
      .fillStyle(0x2f1b69) // calça roxa escura
      .fillRect(5, 16, 10, 6) // calça
      // braços
      .fillStyle(0xfdbcb4)
      .fillRect(2, 10, 3, 6) // braço esquerdo
      .fillRect(15, 10, 3, 6) // braço direito
      // pernas
      .fillStyle(0x2f1b69)
      .fillRect(6, 22, 3, 6) // perna esquerda
      .fillRect(11, 22, 3, 6) // perna direita
      // pés
      .fillStyle(0x654321)
      .fillRect(5, 28, 4, 2) // pé esquerdo
      .fillRect(11, 28, 4, 2) // pé direito
      // Brilho místico
      .fillStyle(0xffffff, 0.4)
      .fillRect(4, 10, 12, 1) // brilho superior
      .generateTexture(`echo_${mood}`, 20, 30);
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

  // Método para criar previews em canvas menores
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

    // Desenhar o sprite pixel por pixel
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
