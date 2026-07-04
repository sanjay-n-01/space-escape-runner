import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Dimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const SHIP_WIDTH = 60;
const SHIP_VISUAL_HEIGHT = 80; // approximate bounding box height for collision only
const SHIP_BOTTOM_OFFSET = 160; // matches the ship's `bottom` style value
const SHIP_TOP = SCREEN_HEIGHT - SHIP_BOTTOM_OFFSET - SHIP_VISUAL_HEIGHT;

const MOVE_STEP = 30;
const ASTEROID_SIZE = 90;
const ASTEROID_FALL_STEP = 12;
const GAME_TICK_MS = 40;

// Use the whole screen as the play area once the game starts.
const PLAY_AREA_TOP = 60;
const PLAY_AREA_BOTTOM = SHIP_TOP + SHIP_VISUAL_HEIGHT;

const randomAsteroidX = () => Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE);
const asteroidImage = require('../../assets/asteroid_transparent.jpg');

export default function HomeScreen() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shipX, setShipX] = useState(SCREEN_WIDTH / 2 - SHIP_WIDTH / 2);
  const [asteroidPos, setAsteroidPos] = useState({ x: randomAsteroidX(), y: PLAY_AREA_TOP });

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shipXRef = useRef(shipX);
  const asteroidPosRef = useRef(asteroidPos);
  const scoreRef = useRef(score);
  // Keep the stars still while the asteroid state updates during gameplay.
  const stars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * SCREEN_WIDTH,
    top: Math.random() * SCREEN_HEIGHT,
    size: Math.random() * 3 + 1,
  })), []);

  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const savedHighScore = await AsyncStorage.getItem('spaceEscapeHighScore');
        if (savedHighScore !== null) {
          setHighScore(Number(savedHighScore));
        }
      } catch (error) {
        console.warn('Failed to load high score', error);
      }
    };

    loadHighScore();
  }, []);

  // Keep refs in sync with the latest state so the game loop
  // always reads current values instead of stale ones from closures.
  useEffect(() => {
    shipXRef.current = shipX;
  }, [shipX]);

  useEffect(() => {
    asteroidPosRef.current = asteroidPos;
  }, [asteroidPos]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (isPlaying) {
      gameLoopRef.current = setInterval(() => {
        const currentAsteroid = asteroidPosRef.current;
        const currentShipX = shipXRef.current;
        const nextY = currentAsteroid.y + ASTEROID_FALL_STEP;

        // --- Collision check (AABB: Axis-Aligned Bounding Box) ---
        const asteroidLeft = currentAsteroid.x;
        const asteroidRight = currentAsteroid.x + ASTEROID_SIZE;
        const asteroidTop = nextY;
        const asteroidBottom = nextY + ASTEROID_SIZE;

        const shipLeft = currentShipX;
        const shipRight = currentShipX + SHIP_WIDTH;
        const shipTop = SHIP_TOP;
        const shipBottom = SHIP_TOP + SHIP_VISUAL_HEIGHT;

        const horizontalOverlap = asteroidLeft < shipRight && asteroidRight > shipLeft;
        const verticalOverlap = asteroidTop < shipBottom && asteroidBottom > shipTop;

        if (horizontalOverlap && verticalOverlap) {
          setIsPlaying(false);
          setGameOver(true);

          setHighScore((prevHighScore) => {
            const nextHighScore = Math.max(prevHighScore, scoreRef.current);
            AsyncStorage.setItem('spaceEscapeHighScore', String(nextHighScore)).catch(() => {});
            return nextHighScore;
          });

          return; // stop this tick early, don't move the asteroid further
        }

        // --- Reached bottom without collision: score + respawn ---
        if (nextY > PLAY_AREA_BOTTOM) {
          setScore((prevScore) => prevScore + 1);
          setAsteroidPos({ x: randomAsteroidX(), y: PLAY_AREA_TOP });
          return;
        }

        // --- Otherwise, just keep falling ---
        setAsteroidPos({ x: currentAsteroid.x, y: nextY });
      }, GAME_TICK_MS);
    } else {
      if (gameLoopRef.current !== null) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current !== null) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying]);

  const handleStartGame = () => {
    setScore(0);
    setGameOver(false);
    setAsteroidPos({ x: randomAsteroidX(), y: PLAY_AREA_TOP });
    setIsPlaying(true);
  };

  const handleStopGame = () => {
    setIsPlaying(false);
  };

  const moveLeft = () => {
    setShipX((prevX) => Math.max(0, prevX - MOVE_STEP));
  };

  const moveRight = () => {
    setShipX((prevX) => Math.min(SCREEN_WIDTH - SHIP_WIDTH, prevX + MOVE_STEP));
  };

  return (
    <LinearGradient colors={["#000814", "#001d3d", "#000814"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      {!isPlaying && !gameOver && (
        <>
          <Text style={styles.title}>Space Escape Runner</Text>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Current Score</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </>
      )}

      {isPlaying && !gameOver && (
        <View style={styles.gameplayHud}>
          <View style={styles.scoreContainerTop}>
            <Text style={styles.scoreLabelSmall}>Score</Text>
            <Text style={styles.scoreValueSmall}>{score}</Text>
          </View>

          <View style={styles.scoreContainerTop}>
            <Text style={styles.scoreLabelSmall}>Best</Text>
            <Text style={styles.scoreValueSmall}>{highScore}</Text>
          </View>

          <TouchableOpacity style={styles.stopButton} onPress={handleStopGame}>
            <Text style={styles.startButtonText}>Stop Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {stars.map((star) => (
          <View
              key={star.id}
              style={{
              position:"absolute",
              left: star.left as number,
              top: star.top as number,
              width: star.size as number,
              height: star.size as number,
              backgroundColor:"white",
              borderRadius:10,
              opacity:0.8
              }}
          />
      ))}

      {isPlaying && (
        <Image
          source={asteroidImage}
          resizeMode="contain"
          style={[styles.asteroid, { left: asteroidPos.x, top: asteroidPos.y }]}
        />
      )}

      <View style={[styles.spaceship, { left: shipX }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.shipNose} />
          <View style={styles.shipCockpit} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={styles.shipWingLeft} />
          <View style={styles.shipBody} />
          <View style={styles.shipWingRight} />
        </View>
        <View style={styles.shipFlame} />
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={moveLeft}>
          <Text style={styles.controlButtonText}>◀ Move Left</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={moveRight}>
          <Text style={styles.controlButtonText}>Move Right ▶</Text>
        </TouchableOpacity>
      </View>
      {gameOver && (
          <View style={styles.gameOverOverlay}>
            <Text style={styles.gameOverTitle}>GAME OVER</Text>
            <Text style={styles.gameOverScore}>Final Score: {score}</Text>
            <Text style={styles.gameOverScore}>High Score: {highScore}</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 60,
    letterSpacing: 1,
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: '#1A1F35',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E3552',
    marginBottom: 20,
  },
  highScoreContainer: {
    backgroundColor: '#1A1F35',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E3552',
    marginBottom: 40,
  },
  gameplayHud: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  scoreContainerTop: {
    backgroundColor: '#1A1F35',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E3552',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#8A90B3',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreLabelSmall: {
    fontSize: 12,
    color: '#8A90B3',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4DE8C2',
  },
  scoreValueSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4DE8C2',
  },
  startButton: {
    backgroundColor: '#4DE8C2',
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderRadius: 30,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B0E1A',
    letterSpacing: 0.5,
  },
  stopButton: {
    backgroundColor: '#E84D6A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  asteroid: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#6E5A45',
    borderRadius: 90,
    borderWidth: 1,
    borderColor: '#1b2049',
    shadowColor: '#715847',
    shadowRadius: 10,
    shadowOpacity: 0.7,
    elevation: 10,
    overflow: 'hidden',
  },
  spaceship: {
    position: 'absolute',
    bottom: 160,
    width: SHIP_WIDTH,
    alignItems: 'center',
  },
  shipNose: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4DE8C2',
  },
  shipCockpit: {
    position: 'absolute',
    top: 18,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0B0E1A',
    borderWidth: 2,
    borderColor: '#2E9E86',
  },
  shipBody: {
    width: 20,
    height: 30,
    backgroundColor: '#4DE8C2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  shipWingLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 20,
    borderRightWidth: 16,
    borderTopColor: 'transparent',
    borderRightColor: '#2E9E86',
    marginLeft: -16,
    marginBottom: -2,
  },
  shipWingRight: {
    width: 0,
    height: 0,
    borderTopWidth: 20,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderLeftColor: '#2E9E86',
    marginRight: -16,
    marginBottom: -2,
  },
  shipFlame: {
    width: 10,
    height: 12,
    backgroundColor: '#E8B84D',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    marginTop: -2,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
  },
  controlButton: {
    backgroundColor: '#1A1F35',
    borderWidth: 1,
    borderColor: '#2E3552',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 14, 26, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#E84D6A',
    marginBottom: 20,
    letterSpacing: 2,
  },
  gameOverScore: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 40,
  },
});
