import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Howl } from 'howler'
import './App.css'

function App() {
  // Cat images paths
  const noCatImages = [
    '/videos/no/cat-cat-sad.webp',
    '/videos/no/cat-cry-kitten-cry.webp',
    '/videos/no/cat.gif',
    '/videos/no/cat.webp',
    '/videos/no/crying-cat-sad-kitty.webp',
    '/videos/no/sad-cat-sad-cat-meme.gif',
    '/videos/no/the-voices.webp',
    '/videos/no/üzgünkedikuzeyefe.webp'
  ]

  const yesCatImages = [
    '/videos/yes/6686ae04340f0125502a1fc08bf482da.jpg',
    '/videos/yes/6fd55f6c62ec634738588c42b21a47d7.jpg',
    '/videos/yes/cat-jump.webp',
    '/videos/yes/catto.gif',
    '/videos/yes/dancing-cat-cat.webp',
    '/videos/yes/goobers.gif',
    '/videos/yes/kitty-cat.gif'
  ]

  // Core states
  const [accepted, setAccepted] = useState(false)
  const [noLevel, setNoLevel] = useState(0) // 0-5 progressive levels
  const [attemptCount, setAttemptCount] = useState(0)
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
  const [yesButtonSize, setYesButtonSize] = useState(1)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [backgroundMood, setBackgroundMood] = useState('happy') // 'happy', 'sad', 'excited'
  const [showConfetti, setShowConfetti] = useState(false)
  const [hearts, setHearts] = useState([])
  const [currentGuiltMessage, setCurrentGuiltMessage] = useState('')
  const [noButtonVisible, setNoButtonVisible] = useState(true)
  const [celebrationHearts, setCelebrationHearts] = useState([])
  const [displayedNoCats, setDisplayedNoCats] = useState([]) // Progressive cat display for "No"
  const [displayedYesCats, setDisplayedYesCats] = useState([]) // All cats for "Yes"

  const noButtonRef = useRef(null)
  const containerRef = useRef(null)

  // Sound effects (using Web Audio API for simple tones)
  const playSadSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 200
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const playVictorySound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Play a cheerful ascending sequence
    const notes = [523.25, 659.25, 783.99, 1046.50] // C, E, G, C
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3)

      oscillator.start(audioContext.currentTime + i * 0.15)
      oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3)
    })
  }

  // Messages for different levels
  const guiltMessages = {
    1: ["Really? 🥺", "You sure about that?", "Think twice..."],
    2: ["My heart is breaking... 💔", "Please don't do this...", "Attempt #${count} - Still no?"],
    3: ["Even my code is crying...", "Please reconsider!", "Are you SURE??", "Really??"],
    4: ["I'm disappointed... 😢", "This is sad...", "My heart... 💔", "404: Love Not Found"],
    5: ["Okay fine...", "I give up...", "I guess it's a yes then? 😔"]
  }

  const noButtonTexts = {
    0: "No",
    1: "You sure about that?",
    2: "Think carefully...",
    3: "Please reconsider!",
    4: "I'm disappointed...",
    5: "Okay fine, I guess it's yes then"
  }

  // Generate floating hearts background
  useEffect(() => {
    const heartArray = []
    for (let i = 0; i < 20; i++) {
      heartArray.push({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDuration: `${8 + Math.random() * 8}s`,
        animationDelay: `${Math.random() * 5}s`,
        fontSize: `${1.5 + Math.random() * 2}rem`,
        opacity: 0.1 + Math.random() * 0.3
      })
    }
    setHearts(heartArray)
  }, [])

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Update background mood based on level
  useEffect(() => {
    if (accepted) {
      setBackgroundMood('excited') // Excited/bright when accepted
    } else if (noLevel >= 2 && noLevel < 5) {
      setBackgroundMood('sad')
    } else {
      setBackgroundMood('happy')
    }
  }, [noLevel, accepted])

  // Grow "Yes" button as "No" attempts increase
  useEffect(() => {
    const newSize = 1 + (attemptCount * 0.05)
    setYesButtonSize(Math.min(newSize, 2)) // Max 2x size
  }, [attemptCount])

  // Generate cat position evenly distributed in 360 degrees around the card
  const getCatPositionAroundCard = (index = 0, totalCats = 8) => {
    // Calculate angle for even distribution (360 degrees / totalCats)
    const angleStep = 360 / totalCats
    const angle = (index * angleStep + Math.random() * angleStep * 0.2) * (Math.PI / 180) // Less randomness

    // Distance from center (card area) - increased to keep cats away from card
    const radiusX = 40 + Math.random() * 10 // 40-50% from center horizontally
    const radiusY = 40 + Math.random() * 10 // 40-50% from center vertically

    // Calculate position using circular distribution
    const centerX = 50 // Center of viewport
    const centerY = 50 // Center of viewport

    const left = centerX + radiusX * Math.cos(angle)
    const top = centerY + radiusY * Math.sin(angle)

    // Ensure cats stay within viewport bounds with generous margins to prevent cutoff
    const boundedLeft = Math.max(8, Math.min(88, left))
    const boundedTop = Math.max(8, Math.min(88, top))

    return { left: boundedLeft, top: boundedTop }
  }

  // Handle "No" button interaction
  const handleNoInteraction = () => {
    const newAttemptCount = attemptCount + 1
    setAttemptCount(newAttemptCount)

    // Play sad sound
    playSadSound()

    // Add a new cat image progressively (one per click)
    if (newAttemptCount <= noCatImages.length) {
      const catImage = noCatImages[newAttemptCount - 1]
      const position = getCatPositionAroundCard(newAttemptCount - 1, noCatImages.length)
      const newCat = {
        id: Date.now(),
        src: catImage,
        left: position.left,
        top: position.top,
        rotation: Math.random() * 40 - 20, // -20deg to 20deg
        scale: 0.7 + Math.random() * 0.3 // 0.7 to 1.0 scale for better visibility
      }
      setDisplayedNoCats(prev => [...prev, newCat])
    } else {
      // If we run out of unique cats, cycle through them again
      const index = (newAttemptCount - 1) % noCatImages.length
      const catImage = noCatImages[index]
      const position = getCatPositionAroundCard(index, noCatImages.length)
      const newCat = {
        id: Date.now(),
        src: catImage,
        left: position.left,
        top: position.top,
        rotation: Math.random() * 40 - 20,
        scale: 0.7 + Math.random() * 0.3 // 0.7 to 1.0 scale for better visibility
      }
      setDisplayedNoCats(prev => [...prev, newCat])
    }

    // Determine level based on attempt count
    let newLevel = 0
    if (newAttemptCount >= 16) newLevel = 5
    else if (newAttemptCount >= 11) newLevel = 4
    else if (newAttemptCount >= 6) newLevel = 3
    else if (newAttemptCount >= 3) newLevel = 2
    else if (newAttemptCount >= 1) newLevel = 1

    setNoLevel(newLevel)

    // Show guilt message
    const messages = guiltMessages[newLevel] || guiltMessages[1]
    const message = messages[Math.floor(Math.random() * messages.length)]
      .replace('${count}', newAttemptCount)
    setCurrentGuiltMessage(message)

    // Clear guilt message after 2 seconds
    setTimeout(() => setCurrentGuiltMessage(''), 2000)

    // Level 5: Make button disappear or auto-accept after 3 more attempts
    if (newLevel === 5) {
      if (newAttemptCount >= 19) {
        // Auto-accept
        handleYesClick()
      } else if (newAttemptCount === 16) {
        // Start fade out
        setTimeout(() => setNoButtonVisible(false), 500)
      }
    }

    // Move button for levels 2-4
    if (newLevel >= 2 && newLevel < 5) {
      moveNoButton()
    }
  }

  // Move "No" button to random position
  const moveNoButton = () => {
    if (!containerRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const buttonWidth = 120
    const buttonHeight = 50

    const maxX = (container.width - buttonWidth) / 2 - 50
    const maxY = (container.height - buttonHeight) / 2 - 50

    const randomX = (Math.random() - 0.5) * maxX
    const randomY = (Math.random() - 0.5) * maxY

    setNoButtonPosition({ x: randomX, y: randomY })
  }

  // Check if mouse is near "No" button (for Level 3 teleportation)
  useEffect(() => {
    if (noLevel === 3 && noButtonRef.current) {
      const button = noButtonRef.current.getBoundingClientRect()
      const buttonCenterX = button.left + button.width / 2
      const buttonCenterY = button.top + button.height / 2

      const distance = Math.sqrt(
        Math.pow(mousePosition.x - buttonCenterX, 2) +
        Math.pow(mousePosition.y - buttonCenterY, 2)
      )

      // If mouse within 100px, teleport button
      if (distance < 100) {
        moveNoButton()
      }
    }
  }, [mousePosition, noLevel])

  // Handle "Yes" click with celebration
  const handleYesClick = () => {
    setAccepted(true)
    setShowConfetti(true)
    playVictorySound()

    // Clear all sad cat memes
    setDisplayedNoCats([])

    // Display all "Yes" cat images evenly distributed
    const yesCatsToDisplay = yesCatImages.map((src, index) => {
      const position = getCatPositionAroundCard(index, yesCatImages.length)
      return {
        id: Date.now() + index,
        src,
        left: position.left,
        top: position.top,
        rotation: Math.random() * 40 - 20, // -20deg to 20deg
        scale: 0.7 + Math.random() * 0.3, // 0.7 to 1.0 scale for better visibility
        delay: index * 0.1 // Staggered entrance evenly
      }
    })
    setDisplayedYesCats(yesCatsToDisplay)

    // Launch confetti
    const duration = 3000
    const animationEnd = Date.now() + duration

    const randomInRange = (min, max) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#ff4d94', '#ff85c0', '#e0b3ff', '#b366ff', '#ff6b6b']
      })
    }, 250)

    // Create raining hearts
    const heartsArray = []
    for (let i = 0; i < 30; i++) {
      heartsArray.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2
      })
    }
    setCelebrationHearts(heartsArray)
  }

  return (
    <div
      ref={containerRef}
      className={`valentine-container mood-${backgroundMood}`}
    >
      {/* Floating Hearts Background */}
      <div className="hearts-background">
        {hearts.map(heart => (
          <div
            key={heart.id}
            className="heart"
            style={{
              left: heart.left,
              animationDuration: heart.animationDuration,
              animationDelay: heart.animationDelay,
              fontSize: heart.fontSize,
              opacity: heart.opacity
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Crying effect for depression level */}
      {noLevel === 4 && (
        <div className="crying-effect">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="tear"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Sad Cat Memes for "No" clicks */}
      <div className="cat-memes-container">
        {displayedNoCats.map((cat) => (
          <img
            key={cat.id}
            src={cat.src}
            alt="Sad cat"
            className="cat-meme-no"
            style={{
              left: `${cat.left}%`,
              top: `${cat.top}%`,
              transform: `rotate(${cat.rotation}deg) scale(${cat.scale})`,
            }}
          />
        ))}
      </div>

      {/* Happy Cat Memes for "Yes" click */}
      {accepted && (
        <div className="cat-memes-container">
          {displayedYesCats.map((cat) => (
            <img
              key={cat.id}
              src={cat.src}
              alt="Happy cat"
              className="cat-meme-yes"
              style={{
                left: `${cat.left}%`,
                top: `${cat.top}%`,
                transform: `rotate(${cat.rotation}deg) scale(${cat.scale})`,
                animationDelay: `${cat.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Attempt Counter */}
      {!accepted && attemptCount > 0 && (
        <div className="attempt-counter">
          Attempts: {attemptCount}
        </div>
      )}

      {/* Guilt Message */}
      {currentGuiltMessage && (
        <div className="guilt-message">
          {currentGuiltMessage}
        </div>
      )}

      {/* Main Content */}
      {!accepted ? (
        <div className="question-card">
          <h1>Heyy Tisha,Will you be my Valentine?</h1>
          <p>I promise to make it worth your while! 💕</p>

          <div className="button-container">
            <button
              className="btn-yes"
              onClick={handleYesClick}
              style={{
                transform: `scale(${yesButtonSize})`
              }}
            >
              Yes! ✓
            </button>

            {noButtonVisible && (
              <button
                ref={noButtonRef}
                className={`btn-no level-${noLevel}`}
                onMouseEnter={handleNoInteraction}
                onTouchStart={handleNoInteraction}
                onClick={handleNoInteraction}
                style={{
                  transform: `translate(${noButtonPosition.x}px, ${noButtonPosition.y}px) scale(${1 - noLevel * 0.15})`,
                  opacity: noLevel === 4 ? 0.3 : noLevel === 5 ? 0 : 1
                }}
              >
                {noButtonTexts[noLevel]} {noLevel < 5 ? '✗' : ''}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="success-screen">
          {/* Raining Hearts */}
          <div className="raining-hearts">
            {celebrationHearts.map(heart => (
              <div
                key={heart.id}
                className="falling-heart"
                style={{
                  left: heart.left,
                  animationDelay: `${heart.delay}s`,
                  animationDuration: `${heart.duration}s`
                }}
              >
                ❤️
              </div>
            ))}
          </div>

          <div className="success-emoji">💖</div>
          <h1>Yayyyy! You said Yesssss!</h1>
          <p className="success-message-with-cat">
            I knew you'd come around!
            <img src="/videos/side-eye-cat.gif" alt="side eye cat" className="side-eye-cat-emoji" />
          </p>
          {attemptCount > 0 && (
            <p className="attempt-count-message">
              It took you <strong>{attemptCount}</strong> {attemptCount === 1 ? 'try' : 'tries'} to say yes! 🎉
            </p>
          )}
          <p className="romantic-message">Get ready for the best Valentine's Day ever! 💕✨</p>
        </div>
      )}
    </div>
  )
}

export default App
