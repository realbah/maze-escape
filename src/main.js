import * as THREE from 'three'

// Scene and cam
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 20, 20)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Create ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: '#cccccc' })
)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(10, 20, 10)
scene.add(light)

// Maze walls and hole
const walls = []
let exitHole = null

const mazeMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,1,0,0,1],
  [1,0,1,0,1,0,1,1,1,1,0,1,0,1,1],
  [1,0,1,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,0,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,1,0,1,0,1],
  [1,0,1,1,0,1,1,1,1,0,1,0,1,0,1],
  [1,0,0,1,0,0,0,0,1,0,1,0,0,0,1],
  [1,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,0,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,9,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

const cellSize = 2

for (let z = 0; z < mazeMap.length; z++) {
  for (let x = 0; x < mazeMap[z].length; x++) {
    const cell = mazeMap[z][x]

    if (cell === 1) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(cellSize, 2, cellSize),
        new THREE.MeshStandardMaterial({ color: 'gray' })
      )
      wall.position.set(
        x * cellSize - (mazeMap.length * cellSize) / 2 + cellSize / 2,
        1,
        z * cellSize - (mazeMap[0].length * cellSize) / 2 + cellSize / 2,
      )
      scene.add(wall)
      walls.push(wall)
    } else if (cell === 9) {
      exitHole = new THREE.Mesh(
        new THREE.BoxGeometry(cellSize * 0.8, 1, cellSize * 0.8),
        new THREE.MeshStandardMaterial({ color: 'green' })
      )
      exitHole.position.set(
        x * cellSize - (mazeMap.length * cellSize) / 2 + cellSize / 2,
        0.5,
        z * cellSize - (mazeMap[0].length * cellSize) / 2 + cellSize / 2,
      )
      scene.add(exitHole)
    }
  }
}

// Player
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 'blue' })
)
player.position.y = 0.5
scene.add(player)

// Player start pos
const playerStartCell = { x: 1, z: 1 }
player.position.set(
  playerStartCell.x * cellSize - (mazeMap.length * cellSize) / 2 + cellSize / 2,
  0.5,
  playerStartCell.z * cellSize - (mazeMap[0].length * cellSize) / 2 + cellSize / 2,
)

// Controls
const keys = { w: false, a: false, s: false, d: false }
document.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true
})
document.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = false
})

let gameOver = false
let health = 100

function updateHealthBar() {
  const fillElem = document.getElementById('health-bar-fill')
  if (!fillElem) return

  const percent = Math.max(0, Math.min(health, 100)) / 100 * 100
  fillElem.style.width = percent + '%'

  const r = Math.floor(255 * (1 - percent / 100))
  const g = Math.floor(255 * (percent / 100))
  fillElem.style.backgroundColor = `rgb(${r},${g},0)`
}

updateHealthBar()

function checkCollision(pos) {
  const playerSize = 0.5
  for (let wall of walls) {
    const distX = Math.abs(pos.x - wall.position.x)
    const distZ = Math.abs(pos.z - wall.position.z)
    const wallHalfSize = cellSize / 2

    if (distX < playerSize + wallHalfSize && distZ < playerSize + wallHalfSize) {
      return true
    }
  }
  return false
}

function updatePlayer() {
  if (gameOver) return

  const speed = 0.1
  const nextPosition = player.position.clone()

  if (keys.w) nextPosition.z -= speed
  if (keys.s) nextPosition.z += speed
  if (keys.a) nextPosition.x -= speed
  if (keys.d) nextPosition.x += speed

  if (checkCollision(nextPosition)) {
    health -= 1
    updateHealthBar()
    if (health <= 0) {
      alert('You lose!')
      gameOver = true
      return
    }
    return
  }

  player.position.copy(nextPosition)

  if (exitHole) {
    const dist = player.position.distanceTo(exitHole.position)
    if (dist < cellSize / 2) {
      alert('You win!')
      gameOver = true
    }
  }
}

// Animations
function animate() {
  requestAnimationFrame(animate)

  updatePlayer()

  if (exitHole) {
    exitHole.rotation.y += 0.02
  }

  const cameraOffset = new THREE.Vector3(0, 10, 10)
  const targetPosition = player.position.clone()
  const cameraPosition = targetPosition.clone().add(cameraOffset)
  
  camera.position.lerp(cameraPosition, 0.1)
  camera.lookAt(targetPosition)

  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
