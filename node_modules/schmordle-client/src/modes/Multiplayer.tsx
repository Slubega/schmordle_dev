import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createRoom, joinRoom, startGame, submitWord, subscribeToRoom, getRhymeSetById } from '../firebase/firestore';
import { MultiplayerRoom, RhymeSet, MultiplayerSubmission } from '../interfaces/types';
import Keyboard from '../components/Keyboard';
import { isValidGuess } from '../utils/gameUtils';

const GAME_DURATION_SECONDS = 120; // 2 minutes

const Multiplayer: React.FC = () => {
    const { user, loading: authLoading, userName } = useAuth();
    const [roomIdInput, setRoomIdInput] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [room, setRoom] = useState<MultiplayerRoom | null>(null);
    const [rhymeSet, setRhymeSet] = useState<RhymeSet | null>(null);
    const [currentGuess, setCurrentGuess] = useState('');
    const [timer, setTimer] = useState(GAME_DURATION_SECONDS);
    const [error, setError] = useState('');

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
            const remaining = Math.max(0, GAME_DURATION_SECONDS - elapsed);
            setTimer(remaining);
        }

        // Reset timer if not playing
        if (room?.status !== 'playing') {
             setTimer(GAME_DURATION_SECONDS);
        }
    }, [room?.status, room?.endTime, room?.startTime]);


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
            await startGame(room.roomId);
        } catch (e) {
            console.error("Error starting game:", e);
            setError('Failed to start game.');
        }
    };

    // Shared key handler for typing and submitting
    const onKey = useCallback((key: string) => {
        if (room?.status !== 'playing' || !rhymeSet) return;

        if (key === 'ENTER') {
            submitGuess();
        } else if (key === 'BACKSPACE') {
            setCurrentGuess((prev) => prev.slice(0, -1));
        } else if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
            if (currentGuess.length < 5) {
                setCurrentGuess((prev) => prev + key.toUpperCase());
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

        // Submit the word to Firestore
        try {
            await submitWord(room!.roomId, user!.uid, userName, guess);
            setCurrentGuess('');
        } catch (e) {
            console.error("Error submitting word:", e);
            setError('Submission failed.');
        }
    };

    // Calculate Scores - Use useMemo to avoid recalculating on every render
    const scores = useMemo(() => {
        const playerScores: { [userId: string]: { name: string, count: number } } = {};
        
        // Initialize scores for all players
        if (room?.players) {
            Object.entries(room.players).forEach(([id, name]) => {
                playerScores[id] = { name, count: 0 };
            });
        }

        // Tally scores from submissions
        room?.submissions?.forEach(sub => {
            playerScores[sub.userId].count += 1;
        });

        // Convert to an array for sorting
        return Object.values(playerScores).sort((a, b) => b.count - a.count);
    }, [room?.players, room?.submissions]);

    // Handle initial auth loading state
    if (authLoading) {
        return <div className="loading-state">Authenticating...</div>;
    }

    // --- View Rendering ---

    if (!roomId || !room) {
        return (
            <div className="game-mode-container">
                <h2>Multiplayer Mode 🏆</h2>
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
                <h2>Lobby: {roomId}</h2>
                <p>**Theme:** {rhymeSet?.theme || 'Loading...'}</p>
                <h3>Connected Players ({Object.keys(room.players).length}):</h3>
                <ul>
                    {Object.entries(room.players).map(([id, name]) => (
                        <li key={id}>{name} {id === room.hostId ? '(Host)' : ''}</li>
                    ))}
                </ul>
                {user?.uid === room.hostId ? (
                    <button onClick={handleStartGame} className="button-primary" disabled={Object.keys(room.players).length < 2}>
                        Start Game (Need 2+ players)
                    </button>
                ) : (
                    <p>Waiting for host ({room.players[room.hostId]}) to start the game...</p>
                )}
            </div>
        );
    }
    
    const isGameOver = room.status === 'completed' || timer === 0;
    const isHost = user?.uid === room.hostId;

    // Game view
    return (
        <div className="game-mode-container">
            <h2>Multiplayer: {roomId} - {isGameOver ? 'Game Over' : `Time Left: ${timer}s`}</h2>
            <p className="rhyme-theme">**Theme:** {rhymeSet?.theme || 'Loading...'}</p>
            
            <div className="multiplayer-game-area">
                <div className="leaderboard-panel">
                    <h3>Scores</h3>
                    <ol>
                        {scores.map((score, index) => (
                            <li key={index} className={score.name === userName ? 'current-player' : ''}>
                                **{score.name}**: {score.count} words
                            </li>
                        ))}
                    </ol>
                    {!isGameOver && (
                        <div className="current-guess-display">
                            Current Word: **{currentGuess || '...'}**
                        </div>
                    )}
                </div>

                <div className="guess-input-panel">
                    {isGameOver ? (
                        <div className="game-message result-message">
                            Game Over! The winner is **{scores[0]?.name || 'No one'}** with **{scores[0]?.count || 0}** words.
                            {isHost && <p>Host can create a new room for the next round.</p>}
                        </div>
                    ) : (
                        <>
                            <div className="game-grid-placeholder">
                                {/* This game mode doesn't use the standard Wordle grid, 
                                but the Keyboard can still be useful */}
                                <p>Type words on the keyboard and press ENTER to submit a valid 5-letter rhyming word from the set.</p>
                                <div className="guess-feedback">
                                    <p>Your correct submissions:</p>
                                    <ul>
                                        {room.submissions
                                            ?.filter(s => s.userId === user?.uid)
                                            .map(s => <li key={s.word}>{s.word}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <Keyboard onKey={onKey} guesses={[]} />
                        </>
                    )}
                    
                </div>
            </div>
            {error && <div className="game-message error-message">{error}</div>}
        </div>
    );
};

export default Multiplayer; 
