import { getFirestore, collection, doc, setDoc, query, where, getDocs, limit, serverTimestamp, arrayUnion } from 'firebase/firestore';
import app from './firebase';
import { RhymeSet, MultiplayerRoom, DailyChallengeConfig, MultiplayerSubmission } from '../interfaces/types';
import rhymeSets from '../data/rhymeSets.json';

// Firestore instance
export const db = getFirestore(app);

// --- Game Logic Utilities ---

// Utility to find a rhyme set by its ID from the local JSON file.
export const getRhymeSetById = (id: string): RhymeSet | undefined => {
  const sets = rhymeSets as unknown as RhymeSet[];
  return sets.find(set => set.id === id);
};

// --- Daily Challenge Functions ---

const DAILY_COLLECTION = 'dailyChallenges';

/**
 * Fetches the daily challenge configuration for a specific date.
 * If one doesn't exist, it creates a new one (simulated 'admin' process).
 * @param date YYYY-MM-DD format
 */
export const getOrCreateDailyChallenge = async (date: string): Promise<DailyChallengeConfig> => {
    const q = query(collection(db, DAILY_COLLECTION), where('date', '==', date), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as DailyChallengeConfig;
    }

    // No configuration found for today, create a new one (simulating admin task)
    const sets = rhymeSets as unknown as RhymeSet[];
    const randomIndex = Math.floor(Math.random() * sets.length);
    const newConfig: DailyChallengeConfig = {
        date,
        rhymeSetId: sets[randomIndex].id,
    };
    
    const docRef = doc(db, DAILY_COLLECTION, date);
    await setDoc(docRef, newConfig);

    return newConfig;
};

// --- Multiplayer Functions ---

const ROOMS_COLLECTION = 'multiplayerRooms';
/** 
 * Creates a new multiplayer room.
 */
export const createRoom = async (hostId: string, hostName: string): Promise<MultiplayerRoom> => {
    const sets = rhymeSets as unknown as RhymeSet[];
    const randomIndex = Math.floor(Math.random() * sets.length);

    // Generate a simple 6-character room ID
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newRoom: MultiplayerRoom = {
        roomId,
        rhymeSetId: sets[randomIndex].id,
        hostId,
        status: 'lobby',
        players: { [hostId]: hostName },
        submissions: []
    };
    
    const docRef = doc(db, ROOMS_COLLECTION, roomId);
    await setDoc(docRef, newRoom);
    return newRoom;
};

/**
 * Joins an existing room.
 */
export const joinRoom = async (roomId: string, userId: string, userName: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId.toUpperCase());
    
    // Atomically add the player to the room's player list
    await setDoc(roomRef, { 
        players: { [userId]: userName }
    }, { merge: true });
};

/**
 * Starts the game and sets the timer.
 */
export const startGame = async (roomId: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await setDoc(roomRef, { 
        status: 'playing',
        startTime: serverTimestamp(),
        // Game will run for 120 seconds (2 minutes)
        endTime: new Date(Date.now() + 120000) 
    }, { merge: true });
};


/**
 * Submits a correct word to the room.
 */
export const submitWord = async (roomId: string, userId: string, userName: string, word: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    
    const submission: MultiplayerSubmission = {
        userId,
        userName,
        word: word.toUpperCase(),
        timestamp: serverTimestamp() as any // Firebase handles this
    };

    // Use arrayUnion to safely add the submission to the array
    await setDoc(roomRef, {
        submissions: arrayUnion(submission)
    }, { merge: true });
};

/**
 * Listens to real-time updates for a room.
 */
export const subscribeToRoom = (roomId: string, callback: (room: MultiplayerRoom | null) => void) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    
    // Clean up function is returned by onSnapshot
    return onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as MultiplayerRoom);
        } else {
            callback(null);
        }
    });
};
