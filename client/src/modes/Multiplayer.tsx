import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createRoom, joinRoom, startGame, submitWord, subscribeToRoom, getRhymeSetById } from '../firebase/firestore';
import { MultiplayerRoom, RhymeSet } from '../interfaces/types';
import Keyboard from '../components/Keyboard';
import GameGrid from '../components/GameGrid';
import { isValidGuess } from '../utils/gameUtils';
import { Timestamp } from 'firebase/firestore';

const DEFAULT_DURATION_SECONDS = 120; // 2 minutes

const Multiplayer: React.FC = () => {
    const { user, loading: authLoading, userName } = useAuth();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [room, setRoom] = useState<MultiplayerRoom | null>(null);
    const [rhymeSet, setRhymeSet] = useState<RhymeSet | null>(null);
    const [currentGuess, setCurrentGuess] = useState('');
    const [timer, setTimer] = useState(DEFAULT_DURATION_SECONDS);
    const [error, setError] = useState('');
    const [durationInputMinutes, setDurationInputMinutes] = useState(2);
    const [guessAttempts, setGuessAttempts] = useState(0);

    // Sync lobby duration input with room value (if someone else set it)
    useEffect(() => {
        if (room?.durationSeconds) {
            setDurationInputMinutes(Math.max(0.5, Math.round((room.durationSeconds / 60) * 10) / 10));
        }
    }, [room?.durationSeconds]);

    // Load rhyme set when room data is available
    useEffect(() => {
        if (room?.rhymeSetId) {
            setRhymeSet(getRhymeSetById(room.rhymeSetId) || null);
        }
    }, [room?.rhymeSetId]);

    // Real-time room subscription
    useEffect(() => {
        if (!roomId) return;

        // Subscribe to real-time updates for the room
        const unsubscribe = subscribeToRoom(roomId, (updatedRoom) => {
            setRoom(updatedRoom);
            if (!updatedRoom) {
                setRoomId(null);
                setError(`Room ${roomId} closed or does not exist.`);
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, [roomId]);
    
    // Game Timer logic
    useEffect(() => {
        const durationSeconds = room?.durationSeconds ?? DEFAULT_DURATION_SECONDS;

        if (room?.status === 'playing' && room.endTime) {
            const endTimeMs = (room.endTime as any).toDate().getTime();
            
            const interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTimeMs - now) / 1000));
                setTimer(remaining);

                if (remaining === 0) {
                    clearInterval(interval);
                    // Technically the game is over, but we rely on Firestore to update status
                }
            }, 1000);

            return () => clearInterval(interval);
        } else if (room?.status === 'playing' && room.startTime) {
            // Calculate initial timer if startTime is set but endTime is not, or just finished loading
            const startTimeMs = (room.startTime as any).toDate().getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTimeMs) / 1000);
            const remaining = Math.max(0, durationSeconds - elapsed);
            setTimer(remaining);
        }

        // Reset timer if not playing
        if (room?.status !== 'playing') {
             setTimer(durationSeconds);
        }
    }, [room?.status, room?.endTime, room?.startTime, room?.durationSeconds]);

    useEffect(() => {
        if (room?.status !== 'playing') {
            setGuessAttempts(0);
        }
    }, [room?.status]);


    const handleCreateRoom = async () => {
        if (!user || authLoading) return;
        try {
            const newRoom = await createRoom(user.uid, userName);
            setRoomId(newRoom.roomId);
            setRoom(newRoom);
        } catch (e) {
            console.error("Error creating room:", e);
            setError('Failed to create room.');
        }
    };

    const handleJoinRoom = async () => {
        if (!user || authLoading || !roomIdInput.trim()) return;
        const inputId = roomIdInput.trim().toUpperCase();

        try {
            await joinRoom(inputId, user.uid, userName);
            setRoomId(inputId);
        } catch (e) {
            console.error("Error joining room:", e);
            setError(`Failed to join room: ${inputId}. Does it exist?`);
        }
    };

    const handleStartGame = async () => {
        if (!room || !user || room.hostId !== user.uid) return;
        try {
            const durationSeconds = Math.max(30, Math.round((Number(durationInputMinutes) || 0) * 60));
            await startGame(room.roomId, durationSeconds);
        } catch (e) {
            console.error("Error starting game:", e);
            setError('Failed to start game.');
        }
    };

    // Shared key handler for typing and submitting
    const onKey = useCallback((key: string) => {
        if (room?.status !== 'playing' || !rhymeSet) return;

        const k = key === 'Enter' ? 'ENTER' : key === 'Backspace' ? 'BACKSPACE' : key.toUpperCase();

        if (k === 'ENTER') {
            submitGuess();
        } else if (k === 'BACKSPACE') {
            setCurrentGuess((prev) => prev.slice(0, -1));
        } else if (k.length === 1 && /^[A-Z]$/.test(k)) {
            if (currentGuess.length < 5) {
                setCurrentGuess((prev) => prev + k);
            }
        }
    }, [room?.status, rhymeSet, currentGuess]);

    const submitGuess = async () => {
        if (currentGuess.length !== 5 || !rhymeSet) {
            setError('Need 5 letters.');
            setTimeout(() => setError(''), 1000);
            return;
        }

        const guess = currentGuess.toUpperCase();

        setGuessAttempts((prev) => prev + 1);
        
        if (!isValidGuess(guess, rhymeSet)) {
            setError('Word is not a correct rhyme in this set.');
            setTimeout(() => setError(''), 1000);
            return;
        }

        // Check if the word has already been submitted by ANY player
        const isDuplicate = room?.submissions?.some(s => s.word === guess);
        if (isDuplicate) {
            setError('That word has already been submitted!');
            setTimeout(() => setError(''), 1000);
            return;
        }

        const addLocalSubmission = () => {
            setRoom((prev) => {
                if (!prev) return prev;
                const submission = {
                    userId: user!.uid,
                    userName,
                    word: guess,
                    timestamp: Timestamp.now() as any,
                };
                return { ...prev, submissions: [...(prev.submissions || []), submission] };
            });
        };

        // Submit the word to Firestore
        try {
            await submitWord(room!.roomId, user!.uid, userName, guess);
            addLocalSubmission();
            setCurrentGuess('');
        } catch (e) {
            console.error("Error submitting word:", e);
            addLocalSubmission(); // fail gracefully but keep local progress
            setCurrentGuess('');
            setError('Submission failed (saved locally).');
            setTimeout(() => setError(''), 1500);
        }
    };

    // Calculate Scores - Use useMemo to avoid recalculating on every render
    const scores = useMemo(() => {
        const playerScores: { [userId: string]: { name: string, count: number, words: string[] } } = {};
        
        // Initialize scores for all players
        if (room?.players) {
            Object.entries(room.players).forEach(([id, name]) => {
                playerScores[id] = { name, count: 0, words: [] };
            });
        }

        // Tally scores from submissions
        room?.submissions?.forEach(sub => {
            if (!playerScores[sub.userId]) {
                playerScores[sub.userId] = { name: sub.userName, count: 0, words: [] };
            }
            playerScores[sub.userId].count += 1;
            playerScores[sub.userId].words.push(sub.word);
        });

        // Convert to an array for sorting
        return Object.values(playerScores).sort((a, b) => b.count - a.count);
    }, [room?.players, room?.submissions]);

    const mySubmissions = useMemo(
        () => room?.submissions?.filter((s) => s.userId === user?.uid) || [],
        [room?.submissions, user?.uid]
    );

    const myGuessResults = useMemo(() => {
        return mySubmissions.map((s) => ({
            guess: s.word,
            feedback: s.word.split('').map((letter) => ({ letter, state: 'correct' as const })),
            isWin: false,
        }));
    }, [mySubmissions]);

    // Physical keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            onKey(e.key);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onKey]);

    // Handle initial auth loading state
    if (authLoading) {
        return <div className="loading-state">Authenticating...</div>;
    }

    // --- View Rendering ---

    if (!roomId || !room) {
        return (
            <div className="game-mode-container">
                <div className="game-mode-header">
                  <h2>Multiplayer Mode</h2>
                  <p>Create a room or join one to start a timed rhyme race.</p>
                </div>
                <div className="auth-box">
                    <p>Create a new room or join an existing one.</p>
                    <button onClick={handleCreateRoom} className="button-primary">Create New Room</button>
                    <hr/>
                    <div className="join-section">
                        <input
                            type="text"
                            placeholder="Room ID (e.g., 6C4A2B)"
                            value={roomIdInput}
                            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase().slice(0, 6))}
                            maxLength={6}
                        />
                        <button onClick={handleJoinRoom} className="button-secondary" disabled={roomIdInput.length !== 6}>
                            Join Room
                        </button>
                    </div>
                </div>
                {error && <div className="game-message error-message">{error}</div>}
            </div>
        );
    }

    if (room.status === 'lobby') {
        return (
            <div className="game-mode-container">
                <div className="game-mode-header">
                  <h2>Lobby: {roomId}</h2>
                  <p>Theme: {rhymeSet?.theme || 'Loading...'}</p>
                </div>
                <div className="game-mode-stats">
                  <h3>Connected Players ({Object.keys(room.players).length}):</h3>
                  <ul>
                      {Object.entries(room.players).map(([id, name]) => (
                          <li key={id}>{name} {id === room.hostId ? '(Host)' : ''}</li>
                      ))}
                  </ul>
                </div>
                {user?.uid === room.hostId ? (
                    <div className="lobby-controls">
                        <label className="duration-label">
                            Round length (minutes):
                            <input
                                type="number"
                                min={0.5}
                                max={10}
                                step={0.5}
                                value={durationInputMinutes}
                                onChange={(e) => setDurationInputMinutes(Number(e.target.value))}
                            />
                        </label>
                        <button onClick={handleStartGame} className="button-primary">
                            Start Timed Round
                        </button>
                    </div>
                ) : (
                    <p>Waiting for host ({room.players[room.hostId]}) to start the game...</p>
                )}
            </div>
        );
    }
    
    const isGameOver = room.status === 'completed' || timer === 0;
    const isHost = user?.uid === room.hostId;
    const correctCount = mySubmissions.length;

    // Game view
    return (
        <div className="game-mode-container game-mode-wide">
            <div className="game-mode-header">
              <h2>Multiplayer: {roomId}</h2>
              <p>{isGameOver ? 'Game Over' : `Time Left: ${timer}s`} · Theme: {rhymeSet?.theme || 'Loading...'}</p>
              <p>Hint: {rhymeSet?.label || 'Rhyming set'}</p>
              <p>Keep submitting valid rhymes; every correct word counts before time runs out.</p>
            </div>
            <div className="status-bar">
                <span>Time: {timer}s</span>
                <span>Guesses: {guessAttempts}</span>
                <span>Correct words: {correctCount}</span>
            </div>
            
            <div className="multiplayer-game-area">
                <div className="leaderboard-panel">
                    <h3>Scores</h3>
                    <ol>
                        {scores.map((score, index) => (
                            <li key={index} className={score.name === userName ? 'current-player' : ''}>
                                {score.name}: {score.count} words
                            </li>
                        ))}
                    </ol>
                    {!isGameOver && (
                        <div className="current-guess-display">
                            Current Word: {currentGuess || '...'}
                        </div>
                    )}
                </div>

                <div className="guess-input-panel">
                    {isGameOver ? (
                        <div className="game-message result-message">
                            <p>Game Over! The winner is {scores[0]?.name || 'No one'} with {scores[0]?.count || 0} words.</p>
                            <h4>Leaderboard</h4>
                            <ol>
                                {scores.map((score) => (
                                    <li key={score.name}>
                                        <strong>{score.name}</strong> — {score.count} words
                                        {score.words.length > 0 && (
                                            <div className="word-list">
                                                {score.words.join(', ')}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ol>
                            {isHost && <p>Host can create a new room for the next round.</p>}
                        </div>
                    ) : (
                        <>
                            <GameGrid
                                currentGuess={currentGuess}
                                guesses={myGuessResults}
                                isGameOver={isGameOver}
                                maxRows={6}
                            />
                            <p className="helper-text">Type words and press ENTER to submit valid 5-letter rhymes.</p>
                            <Keyboard onKey={onKey} guesses={myGuessResults} />
                        </>
                    )}
                    
                </div>
            </div>
            {error && <div className="game-message error-message">{error}</div>}
        </div>
    );
};

export default Multiplayer; 
