# Usage Examples for Dungeon Shift Assets

## HTML5 Canvas Example

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Dungeon Shift</title>
    <style>
        canvas {
            border: 1px solid black;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }
    </style>
</head>
<body>
    <canvas id="game" width="512" height="512"></canvas>
    <script src="game.js"></script>
</body>
</html>
```

### Loading and Drawing Tiles

```javascript
// game.js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Disable image smoothing for crisp pixels
ctx.imageSmoothingEnabled = false;

// Load assets
const tileset = new Image();
const playerSheet = new Image();
const enemySheet = new Image();

tileset.src = 'tileset/environment_tileset.png';
playerSheet.src = 'player/player_spritesheet.png';
enemySheet.src = 'enemies/patroller_spritesheet.png';

// Tile constants (16x16)
const TILE_SIZE = 16;
const TILES = {
    FLOOR_1: [0, 0],
    FLOOR_2: [1, 0],
    WALL_1: [2, 0],
    WALL_2: [3, 0],
    DOOR_LOCKED: [0, 1],
    DOOR_UNLOCKED: [1, 1],
    PORTAL_LOCKED: [2, 1],
    PORTAL_UNLOCKED: [3, 1],
    KEY_TILE: [4, 1],
    SPIKES_RETRACTED: [0, 2],
    SPIKES_EXTENDED: [1, 2],
    CRACKED_1: [2, 2],
    CRACKED_2: [3, 2],
    HOLE: [4, 2],
    SLIME: [0, 3],
    ARROW_UP: [1, 3],
    ARROW_RIGHT: [2, 3],
    SWITCH_OFF: [3, 3],
    SWITCH_ON: [4, 3],
    ANCHOR: [5, 3]
};

// Draw a tile
function drawTile(tileCoords, x, y, scale = 2) {
    const [tx, ty] = tileCoords;
    ctx.drawImage(
        tileset,
        tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        x * scale, y * scale, TILE_SIZE * scale, TILE_SIZE * scale
    );
}

// Example: Draw a simple room
tileset.onload = () => {
    // Floor
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const tile = (x + y) % 2 === 0 ? TILES.FLOOR_1 : TILES.FLOOR_2;
            drawTile(tile, x * TILE_SIZE, y * TILE_SIZE);
        }
    }
    
    // Walls around edges
    for (let x = 0; x < 10; x++) {
        drawTile(TILES.WALL_1, x * TILE_SIZE, 0);
        drawTile(TILES.WALL_1, x * TILE_SIZE, 9 * TILE_SIZE);
    }
    for (let y = 1; y < 9; y++) {
        drawTile(TILES.WALL_1, 0, y * TILE_SIZE);
        drawTile(TILES.WALL_1, 9 * TILE_SIZE, y * TILE_SIZE);
    }
    
    // Door
    drawTile(TILES.DOOR_LOCKED, 5 * TILE_SIZE, 0);
    
    // Some hazards
    drawTile(TILES.SPIKES_EXTENDED, 3 * TILE_SIZE, 3 * TILE_SIZE);
    drawTile(TILES.HOLE, 6 * TILE_SIZE, 6 * TILE_SIZE);
};
```

### Animated Player

```javascript
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'down'; // down, up, left, right
        this.frame = 0;
        this.frameTimer = 0;
        this.isMoving = false;
        this.spriteSize = 32;
    }
    
    update(deltaTime) {
        if (this.isMoving) {
            this.frameTimer += deltaTime;
            if (this.frameTimer > 100) { // 10 FPS
                this.frame = (this.frame % 4) + 1; // Frames 1-4
                this.frameTimer = 0;
            }
        } else {
            this.frame = 0; // Idle frame
        }
    }
    
    draw(ctx, scale = 2) {
        const directionRow = {
            'down': 0,
            'up': 1,
            'left': 2,
            'right': 3
        }[this.direction];
        
        ctx.drawImage(
            playerSheet,
            this.frame * this.spriteSize,
            directionRow * this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            this.x * scale,
            this.y * scale,
            this.spriteSize * scale,
            this.spriteSize * scale
        );
    }
    
    move(direction) {
        this.direction = direction;
        this.isMoving = true;
        
        // Move logic
        const speed = 2;
        switch(direction) {
            case 'up': this.y -= speed; break;
            case 'down': this.y += speed; break;
            case 'left': this.x -= speed; break;
            case 'right': this.x += speed; break;
        }
    }
    
    stop() {
        this.isMoving = false;
        this.frame = 0;
    }
}

// Usage
const player = new Player(64, 64);

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    player.update(deltaTime);
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... draw tiles ...
    player.draw(ctx);
    
    requestAnimationFrame(gameLoop);
}

let lastTime = 0;
requestAnimationFrame(gameLoop);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': player.move('up'); break;
        case 'ArrowDown': player.move('down'); break;
        case 'ArrowLeft': player.move('left'); break;
        case 'ArrowRight': player.move('right'); break;
    }
});

document.addEventListener('keyup', () => {
    player.stop();
});
```

### Animated Enemy

```javascript
class Patroller {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.frameTimer = 0;
        this.spriteSize = 32;
        this.state = 'idle'; // idle, moving, alert
        this.direction = 'down';
    }
    
    update(deltaTime) {
        this.frameTimer += deltaTime;
        
        if (this.state === 'idle') {
            if (this.frameTimer > 200) { // 5 FPS
                this.frame = this.frame === 0 ? 1 : 0;
                this.frameTimer = 0;
            }
        } else if (this.state === 'moving') {
            // Use directional frame
            const directionFrame = {
                'down': 2,
                'up': 3,
                'left': 4,
                'right': 5
            }[this.direction];
            this.frame = directionFrame;
        } else if (this.state === 'alert') {
            this.frame = 6;
        }
    }
    
    draw(ctx, scale = 2) {
        ctx.drawImage(
            enemySheet,
            this.frame * this.spriteSize,
            0,
            this.spriteSize,
            this.spriteSize,
            this.x * scale,
            this.y * scale,
            this.spriteSize * scale,
            this.spriteSize * scale
        );
    }
    
    patrol(path) {
        this.state = 'moving';
        // Patrol logic here
    }
    
    alert() {
        this.state = 'alert';
        setTimeout(() => {
            this.state = 'idle';
        }, 1000);
    }
}
```

### UI Elements

```javascript
class UI {
    constructor() {
        this.hearts = 3;
        this.maxHearts = 3;
        this.keys = 0;
        this.moves = 0;
        
        this.iconSize = 16;
        this.icons = new Image();
        this.icons.src = 'ui/ui_icons_16x16.png';
    }
    
    drawIcon(ctx, iconIndex, x, y, scale = 2) {
        ctx.drawImage(
            this.icons,
            iconIndex * this.iconSize,
            0,
            this.iconSize,
            this.iconSize,
            x,
            y,
            this.iconSize * scale,
            this.iconSize * scale
        );
    }
    
    draw(ctx) {
        const scale = 2;
        const spacing = this.iconSize * scale + 4;
        
        // Draw hearts
        for (let i = 0; i < this.maxHearts; i++) {
            const iconIndex = i < this.hearts ? 0 : 1; // Full or empty
            this.drawIcon(ctx, iconIndex, 10 + i * spacing, 10, scale);
        }
        
        // Draw keys
        if (this.keys > 0) {
            this.drawIcon(ctx, 2, 10, 50, scale); // Key icon
            ctx.fillStyle = 'white';
            ctx.font = '16px monospace';
            ctx.fillText(`x${this.keys}`, 50, 65);
        }
        
        // Draw move counter
        this.drawIcon(ctx, 3, 10, 90, scale); // Footprint icon
        ctx.fillStyle = 'white';
        ctx.fillText(`${this.moves}`, 50, 105);
    }
    
    takeDamage() {
        if (this.hearts > 0) {
            this.hearts--;
        }
    }
    
    collectKey() {
        this.keys++;
    }
    
    useKey() {
        if (this.keys > 0) {
            this.keys--;
            return true;
        }
        return false;
    }
    
    incrementMoves() {
        this.moves++;
    }
}
```

---

## Phaser 3 Example

```javascript
class GameScene extends Phaser.Scene {
    preload() {
        // Load spritesheets
        this.load.spritesheet('tiles', 'tileset/environment_tileset.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        
        this.load.spritesheet('player', 'player/player_spritesheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        
        this.load.spritesheet('enemy', 'enemies/patroller_spritesheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        
        this.load.spritesheet('ui', 'ui/ui_icons_16x16.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }
    
    create() {
        // Create player animations
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { 
                start: 1, end: 4 
            }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { 
                start: 6, end: 9 
            }),
            frameRate: 10,
            repeat: -1
        });
        
        // Create player sprite
        this.player = this.add.sprite(100, 100, 'player', 0);
        this.player.setScale(2);
        
        // Create enemy
        this.enemy = this.add.sprite(200, 200, 'enemy', 0);
        this.enemy.setScale(2);
        
        // Enemy idle animation
        this.anims.create({
            key: 'enemy-idle',
            frames: [0, 1],
            frameRate: 5,
            repeat: -1
        });
        this.enemy.play('enemy-idle');
    }
}
```

---

## Unity Example (C#)

```csharp
using UnityEngine;

public class TileManager : MonoBehaviour
{
    public Texture2D tilesetTexture;
    private Sprite[,] tiles;
    
    void Start()
    {
        LoadTileset();
    }
    
    void LoadTileset()
    {
        int tileSize = 16;
        int cols = 8;
        int rows = 4;
        
        tiles = new Sprite[cols, rows];
        
        for (int y = 0; y < rows; y++)
        {
            for (int x = 0; x < cols; x++)
            {
                Rect rect = new Rect(
                    x * tileSize,
                    tilesetTexture.height - (y + 1) * tileSize,
                    tileSize,
                    tileSize
                );
                
                tiles[x, y] = Sprite.Create(
                    tilesetTexture,
                    rect,
                    new Vector2(0.5f, 0.5f),
                    tileSize
                );
            }
        }
    }
    
    public Sprite GetTile(int x, int y)
    {
        return tiles[x, y];
    }
}

public class PlayerController : MonoBehaviour
{
    public Texture2D playerTexture;
    private SpriteRenderer spriteRenderer;
    private Sprite[] walkDownFrames;
    private int currentFrame = 0;
    private float frameTimer = 0f;
    private float frameRate = 0.1f;
    
    void Start()
    {
        spriteRenderer = GetComponent<SpriteRenderer>();
        LoadPlayerSprites();
    }
    
    void LoadPlayerSprites()
    {
        int spriteSize = 32;
        walkDownFrames = new Sprite[5];
        
        for (int i = 0; i < 5; i++)
        {
            Rect rect = new Rect(
                i * spriteSize,
                playerTexture.height - spriteSize,
                spriteSize,
                spriteSize
            );
            
            walkDownFrames[i] = Sprite.Create(
                playerTexture,
                rect,
                new Vector2(0.5f, 0.5f),
                spriteSize
            );
        }
    }
    
    void Update()
    {
        frameTimer += Time.deltaTime;
        
        if (frameTimer >= frameRate)
        {
            currentFrame = (currentFrame + 1) % 5;
            spriteRenderer.sprite = walkDownFrames[currentFrame];
            frameTimer = 0f;
        }
    }
}
```

---

## Godot Example (GDScript)

```gdscript
extends Sprite2D

# Player animation
var frame_size = Vector2(32, 32)
var current_frame = 0
var frame_timer = 0.0
var frame_rate = 0.1
var direction = "down"

func _ready():
    texture = load("res://player/player_spritesheet.png")
    hframes = 5
    vframes = 4

func _process(delta):
    frame_timer += delta
    
    if frame_timer >= frame_rate:
        current_frame = (current_frame + 1) % 4 + 1  # Frames 1-4
        update_frame()
        frame_timer = 0.0

func update_frame():
    var row = 0
    match direction:
        "down": row = 0
        "up": row = 1
        "left": row = 2
        "right": row = 3
    
    frame = row * 5 + current_frame

func set_direction(new_direction):
    direction = new_direction
    current_frame = 0
```

---

## Tips for Best Results

1. **Pixel Perfect Rendering**: Disable texture filtering/smoothing
2. **Scaling**: Use integer scales (2x, 3x, 4x) for crisp pixels
3. **Animation Speed**: 8-12 FPS for walk cycles, 4-6 FPS for idle
4. **Collision**: Use smaller hitboxes than sprite size for better feel
5. **Layering**: Draw order: Floor → Objects → Entities → UI
6. **Camera**: Keep camera aligned to pixel grid to avoid sub-pixel rendering

---

## Performance Optimization

- Use sprite atlases/texture packing
- Batch draw calls when possible
- Cache sprite references
- Use object pooling for enemies/projectiles
- Cull off-screen sprites
