import Phaser from 'phaser';

export class CharacterSprites {
  static createPlayerSprites(scene: Phaser.Scene) {
    // Modelo 1 - Casual (cinza e azul)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(12, 4, 8, 8) // cabeça
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(10, 0, 12, 6)
      .fillStyle(0x4a4a4a) // camisa cinza
      .fillRect(8, 12, 16, 12)
      .fillStyle(0x1e3a8a) // calça azul
      .fillRect(10, 24, 12, 8)
      // braços
      .fillStyle(0xf4d1ae)
      .fillRect(4, 14, 4, 8) // braço esquerdo
      .fillRect(24, 14, 4, 8) // braço direito
      // pernas
      .fillStyle(0x1e3a8a)
      .fillRect(12, 32, 4, 8) // perna esquerda
      .fillRect(16, 32, 4, 8) // perna direita
      // pés
      .fillStyle(0x000000)
      .fillRect(11, 40, 6, 3) // pé esquerdo
      .fillRect(15, 40, 6, 3) // pé direito
      .generateTexture('player_casual', 32, 44);

    // Modelo 2 - Esportivo (vermelho e verde)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(12, 4, 8, 8) // cabeça
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(10, 0, 12, 6)
      .fillStyle(0xdc2626) // camisa vermelha
      .fillRect(8, 12, 16, 12)
      .fillStyle(0x059669) // calça verde
      .fillRect(10, 24, 12, 8)
      // braços
      .fillStyle(0xf4d1ae)
      .fillRect(4, 14, 4, 8) // braço esquerdo
      .fillRect(24, 14, 4, 8) // braço direito
      // pernas
      .fillStyle(0x059669)
      .fillRect(12, 32, 4, 8) // perna esquerda
      .fillRect(16, 32, 4, 8) // perna direita
      // pés
      .fillStyle(0x000000)
      .fillRect(11, 40, 6, 3) // pé esquerdo
      .fillRect(15, 40, 6, 3) // pé direito
      .generateTexture('player_sport', 32, 44);

    // Modelo 3 - Formal (azul e preto)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(12, 4, 8, 8) // cabeça
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(10, 0, 12, 6)
      .fillStyle(0x1e40af) // camisa azul
      .fillRect(8, 12, 16, 12)
      .fillStyle(0x1f2937) // calça preta
      .fillRect(10, 24, 12, 8)
      // braços
      .fillStyle(0xf4d1ae)
      .fillRect(4, 14, 4, 8) // braço esquerdo
      .fillRect(24, 14, 4, 8) // braço direito
      // pernas
      .fillStyle(0x1f2937)
      .fillRect(12, 32, 4, 8) // perna esquerda
      .fillRect(16, 32, 4, 8) // perna direita
      // pés
      .fillStyle(0x000000)
      .fillRect(11, 40, 6, 3) // pé esquerdo
      .fillRect(15, 40, 6, 3) // pé direito
      .generateTexture('player_formal', 32, 44);

    // Modelo 4 - Aventureiro (marrom e bege)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(12, 4, 8, 8) // cabeça
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(10, 0, 12, 6)
      .fillStyle(0x92400e) // jaqueta marrom
      .fillRect(8, 12, 16, 12)
      .fillStyle(0x6b7280) // calça cinza
      .fillRect(10, 24, 12, 8)
      // braços
      .fillStyle(0xf4d1ae)
      .fillRect(4, 14, 4, 8) // braço esquerdo
      .fillRect(24, 14, 4, 8) // braço direito
      // pernas
      .fillStyle(0x6b7280)
      .fillRect(12, 32, 4, 8) // perna esquerda
      .fillRect(16, 32, 4, 8) // perna direita
      // pés
      .fillStyle(0x000000)
      .fillRect(11, 40, 6, 3) // pé esquerdo
      .fillRect(15, 40, 6, 3) // pé direito
      .generateTexture('player_adventure', 32, 44);
  }

  static createEchoSprite(scene: Phaser.Scene, mood: string) {
    // Echo sempre usa o modelo laranja/roxo (mais místico)
    const baseColor = this.getEchoColorByMood(mood);
    
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(12, 4, 8, 8) // cabeça
      .fillStyle(0x8b4513) // cabelo
      .fillRect(10, 0, 12, 6)
      .fillStyle(baseColor) // camisa baseada no humor
      .fillRect(8, 12, 16, 12)
      .fillStyle(0x1f2937) // calça preta
      .fillRect(10, 24, 12, 8)
      // braços
      .fillStyle(0xf4d1ae)
      .fillRect(4, 14, 4, 8) // braço esquerdo
      .fillRect(24, 14, 4, 8) // braço direito
      // pernas
      .fillStyle(0x1f2937)
      .fillRect(12, 32, 4, 8) // perna esquerda
      .fillRect(16, 32, 4, 8) // perna direita
      // pés
      .fillStyle(0x000000)
      .fillRect(11, 40, 6, 3) // pé esquerdo
      .fillRect(15, 40, 6, 3) // pé direito
      // Adicionar um brilho místico
      .fillStyle(0xffffff, 0.4)
      .fillRect(10, 14, 12, 2) // brilho superior
      .fillRect(6, 16, 4, 2) // brilho braço esquerdo
      .fillRect(22, 16, 4, 2) // brilho braço direito
      .generateTexture(`echo_${mood}`, 32, 44);
  }

  static getEchoColorByMood(mood: string): number {
    switch (mood) {
      case 'feliz': return 0xfbbf24; // amarelo/dourado
      case 'triste': return 0x3b82f6; // azul
      case 'raiva': return 0xef4444; // vermelho
      case 'calmo': return 0x10b981; // verde
      case 'misterioso': return 0x8b5cf6; // roxo
      default: return 0xf97316; // laranja padrão
    }
  }

  static getPlayerModels() {
    return [
      { id: 'casual', name: 'Casual', description: 'Estilo descontraído' },
      { id: 'sport', name: 'Esportivo', description: 'Ativo e energético' },
      { id: 'formal', name: 'Formal', description: 'Elegante e profissional' },
      { id: 'adventure', name: 'Aventureiro', description: 'Explorador corajoso' }
    ];
  }
}
