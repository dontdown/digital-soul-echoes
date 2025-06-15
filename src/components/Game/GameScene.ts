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

  constructor(gameState: GameState, onChatToggle: (show: boolean) => void, onMemoryTrigger: (memory: string) => void) {
    super({ key: 'GameScene' });
    this.gameState = gameState;
    this.onChatToggle = onChatToggle;
    this.onMemoryTrigger = onMemoryTrigger;
  }

  preload() {
    // Criar sprites como retângulos coloridos (placeholders)
    this.add.graphics()
      .fillStyle(0x4ade80)
      .fillRect(0, 0, 32, 32)
      .generateTexture('player', 32, 32);

    // Sprite do Echo baseado no humor
    const echoColor = this.getEchoColor();
    this.add.graphics()
      .fillStyle(echoColor)
      .fillRect(0, 0, 32, 32)
      .generateTexture('echo', 32, 32);

    // Criar texturas para os elementos do cenário
    this.createSceneryTextures();
  }

  create() {
    // Criar fundo detalhado
    this.createDetailedBackground();

    // Criar obstáculos
    this.obstacles = this.physics.add.staticGroup();
    this.createObstacles();

    // Criar jogador
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1);

    // Criar Echo
    this.echo = this.physics.add.sprite(400, 300, 'echo');
    this.echo.setCollideWorldBounds(true);
    this.echo.setScale(1);

    // Configurar física
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.echo, this.obstacles);

    // Configurar controles
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D');
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Configurar animações
    this.createAnimations();

    // Criar indicador de proximidade
    this.proximityIndicator = this.add.text(0, 0, 'Pressione E para conversar', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.proximityIndicator.setVisible(false);

    // Timer para movimento do Echo
    this.time.addEvent({
      delay: 3000,
      callback: this.updateEchoTarget,
      callbackScope: this,
      loop: true
    });

    // Marcar que a cena está pronta
    this.isSceneReady = true;
  }

  update() {
    this.handlePlayerMovement();
    this.handleEchoMovement();
    this.checkProximity();
    this.handleInteraction();
    this.updateProximityIndicator();
  }

  private createSceneryTextures() {
    // Grama base
    this.add.graphics()
      .fillStyle(0x2d5016)
      .fillRect(0, 0, 64, 64)
      .generateTexture('grass', 64, 64);

    // Árvores grandes (verde escuro)
    this.add.graphics()
      .fillStyle(0x1a3009)
      .fillCircle(32, 32, 30)
      .fillStyle(0x4a4a4a)
      .fillRect(28, 50, 8, 20)
      .generateTexture('tree-large', 64, 64);

    // Árvores médias (verde claro)
    this.add.graphics()
      .fillStyle(0x2d5016)
      .fillCircle(24, 24, 20)
      .fillStyle(0x4a4a4a)
      .fillRect(22, 40, 4, 12)
      .generateTexture('tree-medium', 48, 48);

    // Arbustos pequenos
    this.add.graphics()
      .fillStyle(0x3a6b1c)
      .fillCircle(16, 16, 12)
      .generateTexture('bush', 32, 32);

    // Pedras grandes
    this.add.graphics()
      .fillStyle(0x6b7280)
      .fillEllipse(32, 32, 50, 40)
      .fillStyle(0x4b5563)
      .fillEllipse(32, 28, 40, 30)
      .generateTexture('rock-large', 64, 64);

    // Pedras pequenas
    this.add.graphics()
      .fillStyle(0x9ca3af)
      .fillCircle(16, 16, 12)
      .fillStyle(0x6b7280)
      .fillCircle(16, 14, 8)
      .generateTexture('rock-small', 32, 32);

    // Flores coloridas
    this.add.graphics()
      .fillStyle(0xfbbf24)
      .fillCircle(8, 8, 3)
      .fillStyle(0x10b981)
      .fillRect(6, 10, 4, 8)
      .generateTexture('flower-yellow', 16, 16);

    this.add.graphics()
      .fillStyle(0xf472b6)
      .fillCircle(8, 8, 3)
      .fillStyle(0x10b981)
      .fillRect(6, 10, 4, 8)
      .generateTexture('flower-pink', 16, 16);

    this.add.graphics()
      .fillStyle(0x3b82f6)
      .fillCircle(8, 8, 3)
      .fillStyle(0x10b981)
      .fillRect(6, 10, 4, 8)
      .generateTexture('flower-blue', 16, 16);

    // Caminhos de terra
    this.add.graphics()
      .fillStyle(0x92400e)
      .fillRect(0, 0, 64, 32)
      .generateTexture('path', 64, 32);
  }

  private createDetailedBackground() {
    // Fundo base de grama
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2d5016);
    graphics.fillRect(0, 0, 800, 600);

    // Adicionar textura de grama em todo o fundo
    for (let x = 0; x < 800; x += 64) {
      for (let y = 0; y < 600; y += 64) {
        this.add.image(x, y, 'grass').setOrigin(0);
      }
    }

    // Criar caminhos de terra
    this.add.image(200, 300, 'path').setOrigin(0).setScale(2, 1);
    this.add.image(400, 200, 'path').setOrigin(0).setScale(1, 2);
    this.add.image(500, 450, 'path').setOrigin(0).setScale(2, 1);

    // Adicionar árvores grandes no fundo
    this.add.image(50, 50, 'tree-large').setOrigin(0);
    this.add.image(700, 80, 'tree-large').setOrigin(0);
    this.add.image(750, 500, 'tree-large').setOrigin(0);
    this.add.image(30, 520, 'tree-large').setOrigin(0);

    // Adicionar árvores médias
    this.add.image(300, 50, 'tree-medium').setOrigin(0);
    this.add.image(600, 300, 'tree-medium').setOrigin(0);
    this.add.image(100, 400, 'tree-medium').setOrigin(0);
    this.add.image(650, 450, 'tree-medium').setOrigin(0);

    // Adicionar arbustos
    this.add.image(180, 120, 'bush').setOrigin(0);
    this.add.image(420, 100, 'bush').setOrigin(0);
    this.add.image(550, 200, 'bush').setOrigin(0);
    this.add.image(80, 350, 'bush').setOrigin(0);
    this.add.image(480, 480, 'bush').setOrigin(0);
    this.add.image(720, 380, 'bush').setOrigin(0);

    // Adicionar pedras pequenas decorativas
    this.add.image(250, 180, 'rock-small').setOrigin(0);
    this.add.image(380, 320, 'rock-small').setOrigin(0);
    this.add.image(120, 280, 'rock-small').setOrigin(0);
    this.add.image(680, 250, 'rock-small').setOrigin(0);

    // Adicionar flores espalhadas
    const flowerTypes = ['flower-yellow', 'flower-pink', 'flower-blue'];
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const flowerType = Phaser.Utils.Array.GetRandom(flowerTypes);
      this.add.image(x, y, flowerType).setOrigin(0);
    }

    // Adicionar pequenos detalhes de grama alta
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const grass = this.add.rectangle(x, y, 2, 8, 0x4ade80);
      grass.setAlpha(0.7);
    }
  }

  private createObstacles() {
    // Árvores como obstáculos
    this.obstacles.create(200, 150, 'tree-large');
    this.obstacles.create(600, 100, 'tree-large');
    this.obstacles.create(150, 450, 'tree-medium');
    this.obstacles.create(650, 500, 'tree-medium');

    // Pedras grandes como obstáculos
    this.obstacles.create(350, 200, 'rock-large');
    this.obstacles.create(500, 400, 'rock-large');
    this.obstacles.create(100, 250, 'rock-large');
    this.obstacles.create(700, 300, 'rock-large');
  }

  private createAnimations() {
    // Animações simples de movimento (placeholder)
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
    // Se estiver conversando, o jogador não pode se mover
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
    // Se estiver conversando, Echo fica parado
    if (this.isChatting) {
      this.echo.setVelocity(0);
      return;
    }

    const echoSpeed = this.getEchoSpeed();
    const distance = Phaser.Math.Distance.Between(
      this.echo.x, this.echo.y,
      this.echoTarget.x, this.echoTarget.y
    );

    if (distance > 10) {
      this.physics.moveToObject(this.echo, this.echoTarget, echoSpeed);
    } else {
      this.echo.setVelocity(0);
    }
  }

  private handleInteraction() {
    // Verificar se a tecla E foi pressionada e se está perto do Echo
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
    
    // Parar movimentos imediatamente
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    // Desabilitar captura global de teclas para permitir digitação no chat
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
    
    // Garantir que as velocidades sejam zeradas antes de permitir movimento
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    // Reabilitar captura global de teclas para o jogo
    if (this.input.keyboard) {
      this.input.keyboard.enableGlobalCapture();
      console.log('Teclas globais REABILITADAS');
    }
    
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

    // Se saiu de perto durante o chat, fechar o chat
    if (!this.isNearEcho && this.isChatting) {
      console.log('Saiu de perto durante o chat - fechando');
      this.stopChat();
      this.onChatToggle(false);
    }
  }

  private updateEchoTarget() {
    const personality = this.gameState.echoPersonality;
    
    if (personality === 'extrovertido') {
      // Segue o jogador
      this.echoTarget.x = this.player.x + Phaser.Math.Between(-50, 50);
      this.echoTarget.y = this.player.y + Phaser.Math.Between(-50, 50);
    } else if (personality === 'calmo') {
      // Movimento lento e aleatório
      this.echoTarget.x = Phaser.Math.Between(100, 700);
      this.echoTarget.y = Phaser.Math.Between(100, 500);
    } else if (personality === 'misterioso') {
      // Evita o jogador às vezes
      const avoidPlayer = Math.random() > 0.5;
      if (avoidPlayer) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.echo.x, this.echo.y);
        this.echoTarget.x = this.echo.x + Math.cos(angle) * 100;
        this.echoTarget.y = this.echo.y + Math.sin(angle) * 100;
      } else {
        this.echoTarget.x = Phaser.Math.Between(100, 700);
        this.echoTarget.y = Phaser.Math.Between(100, 500);
      }
    }

    // Garantir que o target esteja dentro dos limites
    this.echoTarget.x = Phaser.Math.Clamp(this.echoTarget.x, 50, 750);
    this.echoTarget.y = Phaser.Math.Clamp(this.echoTarget.y, 50, 550);
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
    // Verificar se a cena está pronta antes de tentar usar graphics
    if (!this.isSceneReady || !this.add) {
      console.log('Cena não está pronta ainda, atualizando mood mais tarde');
      this.gameState.echoMood = newMood;
      return;
    }

    this.gameState.echoMood = newMood;
    const newColor = this.getEchoColor();
    
    // Verificar se já existe uma texture com esse mood para evitar duplicatas
    const textureKey = 'echo-' + newMood;
    if (!this.textures.exists(textureKey)) {
      // Recriar texture do Echo
      this.add.graphics()
        .fillStyle(newColor)
        .fillRect(0, 0, 32, 32)
        .generateTexture(textureKey, 32, 32);
    }
    
    // Atualizar sprite do Echo
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
    
    // Reabilitar captura global de teclas
    if (this.input.keyboard) {
      this.input.keyboard.enableGlobalCapture();
      console.log('Teclas globais FORÇADAMENTE REABILITADAS');
    }
    
    console.log('Estado após força: isChatting =', this.isChatting);
    console.log('=== MOVIMENTO FORÇADAMENTE LIBERADO ===');
  }
}
