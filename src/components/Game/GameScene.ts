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

    // Obstáculos
    this.add.graphics()
      .fillStyle(0x8b5cf6)
      .fillRect(0, 0, 64, 64)
      .generateTexture('tree', 64, 64);

    this.add.graphics()
      .fillStyle(0x6b7280)
      .fillRect(0, 0, 48, 48)
      .generateTexture('rock', 48, 48);
  }

  create() {
    // Criar fundo gradiente
    this.createBackground();

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

  private createBackground() {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1e1b4b, 0x1e1b4b, 0x312e81, 0x312e81);
    graphics.fillRect(0, 0, 800, 600);

    // Adicionar "estrelas"
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const star = this.add.circle(x, y, 1, 0xffffff, 0.8);
      star.setAlpha(Math.random());
    }
  }

  private createObstacles() {
    // Árvores
    this.obstacles.create(200, 150, 'tree');
    this.obstacles.create(600, 100, 'tree');
    this.obstacles.create(150, 450, 'tree');
    this.obstacles.create(650, 500, 'tree');

    // Rochas
    this.obstacles.create(350, 200, 'rock');
    this.obstacles.create(500, 400, 'rock');
    this.obstacles.create(100, 250, 'rock');
    this.obstacles.create(700, 300, 'rock');
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
    this.isChatting = true;
    
    // Desabilitar controles de movimento durante o chat
    this.input.keyboard!.disableGlobalCapture();
    this.cursors.left.enabled = false;
    this.cursors.right.enabled = false;
    this.cursors.up.enabled = false;
    this.cursors.down.enabled = false;
    this.wasd.W.enabled = false;
    this.wasd.A.enabled = false;
    this.wasd.S.enabled = false;
    this.wasd.D.enabled = false;
    
    this.onChatToggle(true);
    console.log('Chat iniciado - Controles desabilitados, jogador e Echo parados');
  }

  public stopChat() {
    this.isChatting = false;
    
    // Reabilitar controles de movimento
    this.input.keyboard!.enableGlobalCapture();
    this.cursors.left.enabled = true;
    this.cursors.right.enabled = true;
    this.cursors.up.enabled = true;
    this.cursors.down.enabled = true;
    this.wasd.W.enabled = true;
    this.wasd.A.enabled = true;
    this.wasd.S.enabled = true;
    this.wasd.D.enabled = true;
    
    this.onChatToggle(false);
    console.log('Chat finalizado - Controles reabilitados, jogador e Echo podem se mover');
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
      this.stopChat();
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
}
