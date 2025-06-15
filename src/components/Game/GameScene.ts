import Phaser from 'phaser';
import { CharacterSprites } from './CharacterSprites';

export interface GameState {
  playerName: string;
  playerMood: string;
  playerPreference: string;
  playerModel: string;
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
    // Criar apenas os sprites necessários
    CharacterSprites.createPlayerSprite(this, this.gameState.playerModel);
    CharacterSprites.createEchoSprite(this, this.gameState.echoMood);

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

    // Criar jogador com o modelo escolhido
    const playerTexture = `player_${this.gameState.playerModel}_atlas`;
    this.player = this.physics.add.sprite(100, 300, playerTexture, 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(4);

    // Criar Echo
    const echoTexture = `echo_${this.gameState.echoMood}_atlas`;
    this.echo = this.physics.add.sprite(400, 300, echoTexture, 0);
    this.echo.setCollideWorldBounds(true);
    this.echo.setScale(4);

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

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const star = this.add.circle(x, y, 1, 0xffffff, 0.8);
      star.setAlpha(Math.random());
    }
  }

  private createObstacles() {
    this.obstacles.create(200, 150, 'tree');
    this.obstacles.create(600, 100, 'tree');
    this.obstacles.create(150, 450, 'tree');
    this.obstacles.create(650, 500, 'tree');

    this.obstacles.create(350, 200, 'rock');
    this.obstacles.create(500, 400, 'rock');
    this.obstacles.create(100, 250, 'rock');
    this.obstacles.create(700, 300, 'rock');
  }

  private createAnimations() {
    const playerKey = `player_${this.gameState.playerModel}_atlas`;
    if (this.textures.exists(playerKey)) {
      this.anims.create({
        key: `${this.gameState.playerModel}_walk`,
        frames: [
          { key: playerKey, frame: 0 },
          { key: playerKey, frame: 1 },
          { key: playerKey, frame: 2 },
          { key: playerKey, frame: 3 }
        ],
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: `${this.gameState.playerModel}_idle`,
        frames: [{ key: playerKey, frame: 0 }],
        frameRate: 1
      });
    }

    const echoKey = `echo_${this.gameState.echoMood}_atlas`;
    if (this.textures.exists(echoKey)) {
      this.anims.create({
        key: `echo_${this.gameState.echoMood}_walk`,
        frames: [
          { key: echoKey, frame: 0 },
          { key: echoKey, frame: 1 },
          { key: echoKey, frame: 2 },
          { key: echoKey, frame: 3 }
        ],
        frameRate: 6,
        repeat: -1
      });

      this.anims.create({
        key: `echo_${this.gameState.echoMood}_idle`,
        frames: [{ key: echoKey, frame: 0 }],
        frameRate: 1
      });
    }
  }

  private handlePlayerMovement() {
    if (this.isChatting) {
      this.player.setVelocity(0);
      this.player.anims.play(`${this.gameState.playerModel}_idle`, true);
      return;
    }

    const speed = 160;
    let isMoving = false;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
      isMoving = true;
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
      isMoving = true;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
      isMoving = true;
    } else {
      this.player.setVelocityY(0);
    }

    if (isMoving) {
      this.player.anims.play(`${this.gameState.playerModel}_walk`, true);
    } else {
      this.player.anims.play(`${this.gameState.playerModel}_idle`, true);
    }
  }

  private handleEchoMovement() {
    if (this.isChatting) {
      this.echo.setVelocity(0);
      this.echo.anims.play(`echo_${this.gameState.echoMood}_idle`, true);
      return;
    }

    const echoSpeed = this.getEchoSpeed();
    const distance = Phaser.Math.Distance.Between(
      this.echo.x, this.echo.y,
      this.echoTarget.x, this.echoTarget.y
    );

    if (distance > 10) {
      this.physics.moveToObject(this.echo, this.echoTarget, echoSpeed);
      this.echo.anims.play(`echo_${this.gameState.echoMood}_walk`, true);
    } else {
      this.echo.setVelocity(0);
      this.echo.anims.play(`echo_${this.gameState.echoMood}_idle`, true);
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
    this.isChatting = true;
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.disableGlobalCapture();
    }
    
    this.onChatToggle(true);
  }

  public stopChat() {
    console.log('=== PARANDO CHAT ===');
    this.isChatting = false;
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.enableGlobalCapture();
    }
  }

  private checkProximity() {
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.echo.x, this.echo.y
    );

    const wasNear = this.isNearEcho;
    this.isNearEcho = distance < 100;

    if (!this.isNearEcho && this.isChatting) {
      this.stopChat();
      this.onChatToggle(false);
    }
  }

  private updateEchoTarget() {
    const personality = this.gameState.echoPersonality;
    
    if (personality === 'extrovertido') {
      this.echoTarget.x = this.player.x + Phaser.Math.Between(-50, 50);
      this.echoTarget.y = this.player.y + Phaser.Math.Between(-50, 50);
    } else if (personality === 'calmo') {
      this.echoTarget.x = Phaser.Math.Between(100, 700);
      this.echoTarget.y = Phaser.Math.Between(100, 500);
    } else if (personality === 'misterioso') {
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

    this.echoTarget.x = Phaser.Math.Clamp(this.echoTarget.x, 50, 750);
    this.echoTarget.y = Phaser.Math.Clamp(this.echoTarget.y, 50, 550);
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
      this.gameState.echoMood = newMood;
      return;
    }

    this.gameState.echoMood = newMood;
    
    const textureKey = `echo_${newMood}_atlas`;
    if (!this.textures.exists(textureKey)) {
      CharacterSprites.createEchoSprite(this, newMood);
    }
    
    if (this.echo) {
      this.echo.setTexture(textureKey, 0);
      this.echo.anims.play(`echo_${newMood}_idle`, true);
    }
  }

  public getChatStatus() {
    return this.isChatting;
  }

  public forceStopChat() {
    console.log('=== FORÇANDO PARADA DO CHAT ===');
    this.isChatting = false;
    this.player.setVelocity(0);
    this.echo.setVelocity(0);
    
    if (this.input.keyboard) {
      this.input.keyboard.enableGlobalCapture();
    }
  }
}
