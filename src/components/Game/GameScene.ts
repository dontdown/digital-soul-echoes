import Phaser from 'phaser';

export interface GameState {
  playerName: string;
  playerMood: string;
  playerPreference: string;
  echoPersonality: string;
  echoMood: string;
  echoSprite: string;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private echo!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private eKey!: Phaser.Input.Keyboard.Key;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private isNearEcho = false;
  private isChatting = false;
  private gameState: GameState;
  private onChatToggle: (show: boolean) => void;
  private onMemoryTrigger: (memory: string) => void;
  private echoTarget = { x: 400, y: 300 };
  private echoMoveTimer = 0;
  private isSceneReady = false;
  private proximityIndicator!: Phaser.GameObjects.Text;
  private echoMovementTimer!: Phaser.Time.TimerEvent;

  constructor(gameState: GameState, onChatToggle: (show: boolean) => void, onMemoryTrigger: (memory: string) => void) {
    super({ key: 'GameScene' });
    this.gameState = gameState;
    this.onChatToggle = onChatToggle;
    this.onMemoryTrigger = onMemoryTrigger;
  }

  preload() {
    // Criar sprites do jogador e Echo
    this.add.graphics()
      .fillStyle(0x4ade80)
      .fillRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);

    const echoColor = this.getEchoColor();
    this.add.graphics()
      .fillStyle(echoColor)
      .fillRect(0, 0, 32, 32)
      .generateTexture('echo', 32, 32);

    this.createRealisticTextures();
  }

  create() {
    this.createRealisticBackground();
    this.obstacles = this.physics.add.staticGroup();
    this.createObstaclesWithProperCollision();

    // Criar jogador e Echo
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1);

    this.echo = this.physics.add.sprite(400, 300, 'echo');
    this.echo.setCollideWorldBounds(true);
    this.echo.setScale(1);

    // Configurar física com colisões mais precisas
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.echo, this.obstacles);

    // Configurar controles
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D');
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.createAnimations();

    // Criar indicador de proximidade
    this.proximityIndicator = this.add.text(0, 0, 'Pressione E para conversar', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.proximityIndicator.setVisible(false);

    // Timer para movimento do Echo com logs de debug
    this.echoMovementTimer = this.time.addEvent({
      delay: 3000,
      callback: () => {
        console.log('🎯 Atualizando target do Echo. Estado atual:', {
          echoPosition: { x: this.echo.x, y: this.echo.y },
          currentTarget: this.echoTarget,
          isChatting: this.isChatting,
          personality: this.gameState.echoPersonality
        });
        this.updateEchoTarget();
      },
      callbackScope: this,
      loop: true
    });

    this.isSceneReady = true;
    console.log('🎮 GameScene criada. Echo inicial em:', { x: this.echo.x, y: this.echo.y });
  }

  update() {
    this.handlePlayerMovement();
    this.handleEchoMovement();
    this.checkProximity();
    this.handleInteraction();
    this.updateProximityIndicator();
  }

  private createRealisticTextures() {
    // Grama base com textura mais detalhada
    const grassGraphics = this.add.graphics();
    grassGraphics.fillStyle(0x2d5016);
    grassGraphics.fillRect(0, 0, 64, 64);
    // Adicionar detalhes de grama
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, 64);
      const y = Phaser.Math.Between(0, 64);
      grassGraphics.fillStyle(0x3a6b1c);
      grassGraphics.fillRect(x, y, 2, 4);
    }
    grassGraphics.generateTexture('realistic-grass', 64, 64);
    grassGraphics.destroy();

    // Árvores grandes mais realistas
    const treeGraphics = this.add.graphics();
    // Tronco marrom
    treeGraphics.fillStyle(0x654321);
    treeGraphics.fillRect(28, 45, 8, 25);
    // Copa verde com múltiplas camadas
    treeGraphics.fillStyle(0x1a4d00);
    treeGraphics.fillCircle(32, 35, 25);
    treeGraphics.fillStyle(0x2d5016);
    treeGraphics.fillCircle(32, 30, 20);
    treeGraphics.fillStyle(0x3a6b1c);
    treeGraphics.fillCircle(32, 25, 15);
    treeGraphics.generateTexture('realistic-tree-large', 64, 70);
    treeGraphics.destroy();

    // Árvores médias
    const mediumTreeGraphics = this.add.graphics();
    mediumTreeGraphics.fillStyle(0x654321);
    mediumTreeGraphics.fillRect(22, 35, 4, 15);
    mediumTreeGraphics.fillStyle(0x2d5016);
    mediumTreeGraphics.fillCircle(24, 25, 15);
    mediumTreeGraphics.fillStyle(0x3a6b1c);
    mediumTreeGraphics.fillCircle(24, 22, 10);
    mediumTreeGraphics.generateTexture('realistic-tree-medium', 48, 50);
    mediumTreeGraphics.destroy();

    // Arbustos detalhados
    const bushGraphics = this.add.graphics();
    bushGraphics.fillStyle(0x2d5016);
    bushGraphics.fillCircle(16, 20, 12);
    bushGraphics.fillStyle(0x3a6b1c);
    bushGraphics.fillCircle(16, 18, 8);
    bushGraphics.fillStyle(0x4d7c1e);
    bushGraphics.fillCircle(16, 16, 5);
    bushGraphics.generateTexture('realistic-bush', 32, 32);
    bushGraphics.destroy();

    // Pedras com sombras e detalhes
    const rockGraphics = this.add.graphics();
    // Sombra
    rockGraphics.fillStyle(0x3a3a3a);
    rockGraphics.fillEllipse(34, 36, 50, 35);
    // Pedra principal
    rockGraphics.fillStyle(0x6b7280);
    rockGraphics.fillEllipse(32, 32, 45, 35);
    // Highlights
    rockGraphics.fillStyle(0x9ca3af);
    rockGraphics.fillEllipse(30, 28, 30, 25);
    rockGraphics.fillStyle(0xd1d5db);
    rockGraphics.fillEllipse(28, 25, 15, 12);
    rockGraphics.generateTexture('realistic-rock-large', 64, 64);
    rockGraphics.destroy();

    // Pedras pequenas
    const smallRockGraphics = this.add.graphics();
    smallRockGraphics.fillStyle(0x4b5563);
    smallRockGraphics.fillCircle(17, 17, 12);
    smallRockGraphics.fillStyle(0x6b7280);
    smallRockGraphics.fillCircle(16, 16, 10);
    smallRockGraphics.fillStyle(0x9ca3af);
    smallRockGraphics.fillCircle(15, 14, 6);
    smallRockGraphics.generateTexture('realistic-rock-small', 32, 32);
    smallRockGraphics.destroy();

    // Flores mais coloridas e detalhadas
    const flowerTypes = [
      { color: 0xfbbf24, center: 0xf59e0b, name: 'realistic-flower-yellow' },
      { color: 0xf472b6, center: 0xec4899, name: 'realistic-flower-pink' },
      { color: 0x3b82f6, center: 0x2563eb, name: 'realistic-flower-blue' },
      { color: 0x8b5cf6, center: 0x7c3aed, name: 'realistic-flower-purple' }
    ];

    flowerTypes.forEach(flower => {
      const flowerGraphics = this.add.graphics();
      // Caule
      flowerGraphics.fillStyle(0x16a34a);
      flowerGraphics.fillRect(7, 10, 2, 8);
      // Pétalas
      flowerGraphics.fillStyle(flower.color);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = 8 + Math.cos(angle) * 4;
        const y = 8 + Math.sin(angle) * 4;
        flowerGraphics.fillCircle(x, y, 2);
      }
      // Centro
      flowerGraphics.fillStyle(flower.center);
      flowerGraphics.fillCircle(8, 8, 2);
      flowerGraphics.generateTexture(flower.name, 16, 18);
      flowerGraphics.destroy();
    });

    // Caminhos de terra mais realistas
    const pathGraphics = this.add.graphics();
    pathGraphics.fillStyle(0x8b4513);
    pathGraphics.fillRect(0, 0, 64, 32);
    // Adicionar pedrinhas no caminho
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(0, 64);
      const y = Phaser.Math.Between(0, 32);
      pathGraphics.fillStyle(0xa0522d);
      pathGraphics.fillCircle(x, y, 1);
    }
    pathGraphics.generateTexture('realistic-path', 64, 32);
    pathGraphics.destroy();

    // Água/lago
    const waterGraphics = this.add.graphics();
    waterGraphics.fillStyle(0x3b82f6);
    waterGraphics.fillEllipse(40, 30, 70, 50);
    waterGraphics.fillStyle(0x60a5fa);
    waterGraphics.fillEllipse(38, 28, 60, 40);
    waterGraphics.fillStyle(0x93c5fd);
    waterGraphics.fillEllipse(36, 26, 45, 30);
    waterGraphics.generateTexture('realistic-water', 80, 60);
    waterGraphics.destroy();
  }

  private createRealisticBackground() {
    // Fundo base com gradiente
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x2d5016, 0x2d5016, 0x4d7c1e, 0x4d7c1e, 1);
    graphics.fillRect(0, 0, 800, 600);

    // Adicionar grama base
    for (let x = 0; x < 800; x += 64) {
      for (let y = 0; y < 600; y += 64) {
        this.add.image(x, y, 'realistic-grass').setOrigin(0).setAlpha(0.8);
      }
    }

    // Criar caminhos principais
    this.add.image(150, 280, 'realistic-path').setOrigin(0).setScale(3, 2);
    this.add.image(350, 150, 'realistic-path').setOrigin(0).setScale(2, 3).setRotation(Math.PI / 2);
    this.add.image(500, 420, 'realistic-path').setOrigin(0).setScale(3, 1.5);

    // Adicionar lago central
    this.add.image(350, 250, 'realistic-water').setOrigin(0).setScale(1.5);

    // Distribuir árvores de forma mais natural
    const treePositions = [
      { x: 50, y: 50, type: 'large' },
      { x: 680, y: 80, type: 'large' },
      { x: 720, y: 480, type: 'large' },
      { x: 30, y: 500, type: 'large' },
      { x: 280, y: 60, type: 'medium' },
      { x: 580, y: 320, type: 'medium' },
      { x: 120, y: 380, type: 'medium' },
      { x: 620, y: 420, type: 'medium' },
      { x: 200, y: 500, type: 'medium' },
      { x: 700, y: 200, type: 'medium' }
    ];

    treePositions.forEach(pos => {
      const textureKey = pos.type === 'large' ? 'realistic-tree-large' : 'realistic-tree-medium';
      this.add.image(pos.x, pos.y, textureKey).setOrigin(0);
    });

    // Adicionar arbustos em posições estratégicas
    const bushPositions = [
      { x: 180, y: 120 }, { x: 420, y: 100 }, { x: 550, y: 180 },
      { x: 80, y: 350 }, { x: 480, y: 460 }, { x: 720, y: 360 },
      { x: 300, y: 400 }, { x: 150, y: 200 }, { x: 600, y: 150 }
    ];

    bushPositions.forEach(pos => {
      this.add.image(pos.x, pos.y, 'realistic-bush').setOrigin(0);
    });

    // Espalhar flores de forma mais natural
    const flowerTypes = ['realistic-flower-yellow', 'realistic-flower-pink', 'realistic-flower-blue', 'realistic-flower-purple'];
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(60, 740);
      const y = Phaser.Math.Between(60, 540);
      const flowerType = Phaser.Utils.Array.GetRandom(flowerTypes);
      this.add.image(x, y, flowerType).setOrigin(0);
    }

    // Adicionar pedras pequenas decorativas
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      this.add.image(x, y, 'realistic-rock-small').setOrigin(0);
    }

    // Efeitos de luz/sombra sutis
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(100, 700);
      const y = Phaser.Math.Between(100, 500);
      const shadow = this.add.ellipse(x, y, 40, 20, 0x000000, 0.1);
    }
  }

  private createObstaclesWithProperCollision() {
    // Criar obstáculos apenas onde realmente há elementos visuais
    // Árvores grandes como obstáculos (com hitbox ajustada)
    const largeTrees = [
      { x: 82, y: 85 },   // Ajustado para o centro da árvore
      { x: 712, y: 115 },
      { x: 752, y: 515 },
      { x: 62, y: 535 }
    ];

    largeTrees.forEach(tree => {
      const obstacle = this.obstacles.create(tree.x, tree.y, 'realistic-tree-large');
      obstacle.setSize(32, 32); // Hitbox menor que a imagem visual
      obstacle.setOffset(16, 35); // Ajustar offset para o tronco
    });

    // Pedras grandes como obstáculos
    const largeRocks = [
      { x: 382, y: 282 }, // Posições ajustadas
      { x: 532, y: 432 },
      { x: 132, y: 282 }
    ];

    largeRocks.forEach(rock => {
      const obstacle = this.obstacles.create(rock.x, rock.y, 'realistic-rock-large');
      obstacle.setSize(40, 30);
      obstacle.setOffset(12, 20);
    });

    // Lago como obstáculo (área da água)
    const waterObstacle = this.obstacles.create(430, 280, 'realistic-water');
    waterObstacle.setSize(100, 60);
    waterObstacle.setOffset(-10, 0);
  }

  private createAnimations() {
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'echo-idle',
      frames: [{ key: 'echo' }],
      frameRate: 1
    });
  }

  private handlePlayerMovement() {
    if (this.isChatting) {
      this.player.setVelocity(0);
      return;
    }

    const speed = 160;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
    } else {
      this.player.setVelocityY(0);
    }
  }

  private handleEchoMovement() {
    if (this.isChatting) {
      this.echo.setVelocity(0);
      return;
    }

    const echoSpeed = this.getEchoSpeed();
    const distance = Phaser.Math.Distance.Between(
      this.echo.x, this.echo.y,
      this.echoTarget.x, this.echoTarget.y
    );

    // Log de debug para movimento
    if (distance > 10) {
      console.log('🏃 Echo se movendo para target:', {
        from: { x: Math.round(this.echo.x), y: Math.round(this.echo.y) },
        to: { x: this.echoTarget.x, y: this.echoTarget.y },
        distance: Math.round(distance),
        speed: echoSpeed
      });
      
      this.physics.moveToObject(this.echo, this.echoTarget, echoSpeed);
    } else {
      // Echo chegou ao target
      console.log('✅ Echo chegou ao target:', { x: this.echoTarget.x, y: this.echoTarget.y });
      this.echo.setVelocity(0);
      
      // Gerar novo target após um pequeno delay se não estiver conversando
      if (!this.isChatting) {
        this.time.delayedCall(1000, () => {
          console.log('🔄 Gerando novo target para o Echo...');
          this.updateEchoTarget();
        });
      }
    }
  }

  private handleInteraction() {
    if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.isNearEcho && !this.isChatting) {
      this.startChat();
    }
  }

  private updateProximityIndicator() {
    if (this.isNearEcho && !this.isChatting) {
      this.proximityIndicator.setVisible(true);
      this.proximityIndicator.setPosition(this.echo.x - 50, this.echo.y - 50);
    } else {
      this.proximityIndicator.setVisible(false);
    }
  }

  private startChat() {
    console.log('=== INICIANDO CHAT ===');
    console.log('Estado antes: isChatting =', this.isChatting);
    
    this.isChatting = true;
    
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.disableGlobalCapture();
      console.log('Teclas globais DESABILITADAS');
    }
    
    console.log('Estado após iniciar: isChatting =', this.isChatting);
    this.onChatToggle(true);
  }

  public stopChat() {
    console.log('=== PARANDO CHAT ===');
    console.log('Estado antes: isChatting =', this.isChatting);
    
    this.isChatting = false;
    
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.enableGlobalCapture();
      console.log('Teclas globais REABILITADAS');
    }
    
    // Garantir que o Echo volte a se mover após parar o chat
    this.time.delayedCall(500, () => {
      console.log('🔄 Reativando movimento do Echo após chat');
      this.updateEchoTarget();
    });
    
    console.log('Estado após parar: isChatting =', this.isChatting);
    console.log('=== MOVIMENTO LIBERADO ===');
  }

  private checkProximity() {
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.echo.x, this.echo.y
    );

    const wasNear = this.isNearEcho;
    this.isNearEcho = distance < 100;

    if (!this.isNearEcho && this.isChatting) {
      console.log('Saiu de perto durante o chat - fechando');
      this.stopChat();
      this.onChatToggle(false);
    }
  }

  private updateEchoTarget() {
    const personality = this.gameState.echoPersonality;
    const oldTarget = { ...this.echoTarget };
    
    if (personality === 'extrovertido') {
      this.echoTarget.x = this.player.x + Phaser.Math.Between(-100, 100);
      this.echoTarget.y = this.player.y + Phaser.Math.Between(-100, 100);
    } else if (personality === 'calmo') {
      this.echoTarget.x = Phaser.Math.Between(100, 700);
      this.echoTarget.y = Phaser.Math.Between(100, 500);
    } else if (personality === 'misterioso') {
      const avoidPlayer = Math.random() > 0.5;
      if (avoidPlayer) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.echo.x, this.echo.y);
        this.echoTarget.x = this.echo.x + Math.cos(angle) * 150;
        this.echoTarget.y = this.echo.y + Math.sin(angle) * 150;
      } else {
        this.echoTarget.x = Phaser.Math.Between(100, 700);
        this.echoTarget.y = Phaser.Math.Between(100, 500);
      }
    } else {
      // Personalidade padrão
      this.echoTarget.x = Phaser.Math.Between(150, 650);
      this.echoTarget.y = Phaser.Math.Between(150, 450);
    }

    // Garantir que o target está dentro dos limites
    this.echoTarget.x = Phaser.Math.Clamp(this.echoTarget.x, 50, 750);
    this.echoTarget.y = Phaser.Math.Clamp(this.echoTarget.y, 50, 550);

    console.log('🎯 Novo target do Echo gerado:', {
      personality,
      oldTarget,
      newTarget: this.echoTarget,
      currentPosition: { x: Math.round(this.echo.x), y: Math.round(this.echo.y) }
    });
  }

  private getEchoColor(): number {
    const mood = this.gameState.echoMood;
    switch (mood) {
      case 'feliz': return 0xfbbf24;
      case 'triste': return 0x3b82f6;
      case 'raiva': return 0xef4444;
      case 'calmo': return 0x10b981;
      default: return 0x8b5cf6;
    }
  }

  private getEchoSpeed(): number {
    const personality = this.gameState.echoPersonality;
    switch (personality) {
      case 'extrovertido': return 120;
      case 'calmo': return 60;
      case 'misterioso': return 90;
      default: return 80;
    }
  }

  public updateEchoMood(newMood: string) {
    if (!this.isSceneReady || !this.add) {
      console.log('Cena não está pronta ainda, atualizando mood mais tarde');
      this.gameState.echoMood = newMood;
      return;
    }

    this.gameState.echoMood = newMood;
    const newColor = this.getEchoColor();
    
    const textureKey = 'echo-' + newMood;
    if (!this.textures.exists(textureKey)) {
      this.add.graphics()
        .fillStyle(newColor)
        .fillRect(0, 0, 32, 32)
        .generateTexture(textureKey, 32, 32);
    }
    
    if (this.echo) {
      this.echo.setTexture(textureKey);
    }
  }

  public getChatStatus() {
    return this.isChatting;
  }

  public forceStopChat() {
    console.log('=== FORÇANDO PARADA DO CHAT ===');
    console.log('Estado antes da força: isChatting =', this.isChatting);
    
    this.isChatting = false;
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.enableGlobalCapture();
      console.log('Teclas globais FORÇADAMENTE REABILITADAS');
    }
    
    // Garantir que o Echo volte a se mover
    this.time.delayedCall(300, () => {
      console.log('🔄 Forçando reativação do movimento do Echo');
      this.updateEchoTarget();
    });
    
    console.log('Estado após força: isChatting =', this.isChatting);
    console.log('=== MOVIMENTO FORÇADAMENTE LIBERADO ===');
  }

  // Método para debug manual do Echo
  public debugEchoMovement() {
    console.log('🔍 DEBUG ECHO MOVEMENT:', {
      position: { x: Math.round(this.echo.x), y: Math.round(this.echo.y) },
      target: this.echoTarget,
      velocity: { x: this.echo.body?.velocity.x, y: this.echo.body?.velocity.y },
      isChatting: this.isChatting,
      personality: this.gameState.echoPersonality,
      speed: this.getEchoSpeed(),
      isSceneReady: this.isSceneReady
    });
    
    // Forçar novo target
    this.updateEchoTarget();
  }
}
