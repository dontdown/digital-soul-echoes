
import Phaser from 'phaser';

export class CharacterSprites {
  static createPlayerSprites(scene: Phaser.Scene) {
    // Modelo 1 - Casual (cinza e azul)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(0, 0, 32, 32)
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(8, 0, 16, 8)
      .fillStyle(0x4a4a4a) // camisa cinza
      .fillRect(0, 8, 32, 16)
      .fillStyle(0x1e3a8a) // calça azul
      .fillRect(0, 24, 32, 8)
      .generateTexture('player_casual', 32, 32);

    // Modelo 2 - Esportivo (vermelho e verde)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(0, 0, 32, 32)
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(8, 0, 16, 8)
      .fillStyle(0xdc2626) // camisa vermelha
      .fillRect(0, 8, 32, 16)
      .fillStyle(0x059669) // calça verde
      .fillRect(0, 24, 32, 8)
      .generateTexture('player_sport', 32, 32);

    // Modelo 3 - Formal (azul e preto)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(0, 0, 32, 32)
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(8, 0, 16, 8)
      .fillStyle(0x1e40af) // camisa azul
      .fillRect(0, 8, 32, 16)
      .fillStyle(0x1f2937) // calça preta
      .fillRect(0, 24, 32, 8)
      .generateTexture('player_formal', 32, 32);

    // Modelo 4 - Aventureiro (marrom e bege)
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(0, 0, 32, 32)
      .fillStyle(0x8b4513) // cabelo castanho
      .fillRect(8, 0, 16, 8)
      .fillStyle(0x92400e) // jaqueta marrom
      .fillRect(0, 8, 32, 16)
      .fillStyle(0x6b7280) // calça cinza
      .fillRect(0, 24, 32, 8)
      .generateTexture('player_adventure', 32, 32);
  }

  static createEchoSprite(scene: Phaser.Scene, mood: string) {
    // Echo sempre usa o modelo laranja/roxo (mais místico)
    const baseColor = this.getEchoColorByMood(mood);
    
    scene.add.graphics()
      .fillStyle(0xf4d1ae) // pele
      .fillRect(0, 0, 32, 32)
      .fillStyle(0x8b4513) // cabelo
      .fillRect(8, 0, 16, 8)
      .fillStyle(baseColor) // camisa baseada no humor
      .fillRect(0, 8, 32, 16)
      .fillStyle(0x1f2937) // calça preta
      .fillRect(0, 24, 32, 8)
      // Adicionar um brilho místico
      .fillStyle(0xffffff, 0.3)
      .fillRect(2, 10, 28, 2)
      .generateTexture(`echo_${mood}`, 32, 32);
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
