import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bubble, Composer, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
import { auth, db, storage } from '../firebaseconfig';

// 1. Audio Configuration for Cross-Platform Compatibility
const audioRecordingOptions = {
    android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    },
};

export default function ChatScreen() {
    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sound, setSound] = useState();
    
    const route = useRoute();
    const navigation = useNavigation();
    const { recipientId, chatId: existingChatId, recipientName } = route.params;
    const [chatId, setChatId] = useState(existingChatId);

    const currentUser = auth.currentUser;

    // --- Configure Audio Mode on Mount ---
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
            } catch (error) {
                console.log("Error configuring audio:", error);
            }
        };
        configureAudio();
    }, []);

    useEffect(() => {
        if (recipientName) {
            navigation.setOptions({ title: recipientName });
        }
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [recipientName, navigation, sound]);
    
    useEffect(() => {
        if (!currentUser) return;
        // PRODUCTION PATH: "users"
        getDoc(doc(db, "users", currentUser.uid)).then(snap => {
            if (snap.exists()) setUserData(snap.data());
        });
    }, [currentUser]);

    useEffect(() => {
        let unsubscribe;
        const establishChat = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                let currentChatId = existingChatId;

                // 1. Determine Chat ID if not passed
                if (!currentChatId && recipientId) {
                    const members = [currentUser.uid, recipientId].sort();
                    currentChatId = members.join('_');
                }

                if (currentChatId) {
                    // PRODUCTION PATH: "chats"
                    const chatRef = doc(db, "chats", currentChatId);
                    
                    // --- FORCE WRITE to satisfy security rules ---
                    try {
                        const participants = recipientId 
                            ? [currentUser.uid, recipientId].sort() 
                            : [currentUser.uid];

                        await setDoc(chatRef, { 
                            participantIds: participants, 
                            updatedAt: serverTimestamp() 
                        }, { merge: true });
                    } catch (writeError) {
                         console.error("Error creating/updating chat doc:", writeError);
                    }
                    
                    setChatId(currentChatId);

                    // 2. Listen to Messages
                    // PRODUCTION PATH: "chats/{id}/messages"
                    const messagesQuery = query(
                        collection(db, `chats/${currentChatId}/messages`), 
                        orderBy('createdAt', 'desc')
                    );
                    
                    unsubscribe = onSnapshot(messagesQuery, (qSnap) => {
                        const loadedMessages = qSnap.docs.map(d => ({
                            _id: d.id, 
                            text: d.data().text, 
                            createdAt: d.data().createdAt?.toDate() || new Date(),
                            user: { _id: d.data().userId, name: d.data().userName, avatar: d.data().userAvatar },
                            audio: d.data().audio || null, 
                        }));
                        setMessages(loadedMessages);
                        setLoading(false);
                    }, (error) => {
                        console.error("Chat Listener Error: ", error);
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error establishing chat:", error);
                setLoading(false);
            }
        };
        establishChat();
        return () => { if (unsubscribe) unsubscribe(); };
    }, [recipientId, existingChatId, currentUser]);

    // --- Audio Logic ---
    const handleMicPress = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    async function startRecording() {
        try {
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (e) {}
                setRecording(null);
            }

            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
                const { recording: newRecording } = await Audio.Recording.createAsync(audioRecordingOptions);
                setRecording(newRecording);
                setIsRecording(true);
            } else {
                Alert.alert("Permission Denied", "Microphone permission is required.");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
        }
    }

    async function stopRecording() {
        if (!recording) return;

        setIsRecording(false);
        
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI(); 
            setRecording(null);
            if (uri) {
                await uploadAudio(uri);
            }
        } catch (error) {
            console.error('Error stopping recording', error);
            setRecording(null);
            setIsRecording(false);
        }
    }

    const uploadAudio = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `audioChats/${chatId}/${Date.now()}.m4a`;
            const fileRef = ref(storage, filename);
            
            // --- FIX 2: Add Metadata (ContentType) ---
            // This fixes the "Error loading preview" in Firebase Console
            // and ensures devices know this is an audio file.
            const metadata = {
                contentType: 'audio/m4a', 
            };
            
            await uploadBytes(fileRef, blob, metadata);
            const downloadURL = await getDownloadURL(fileRef);
            
            const audioMessage = {
                _id: Math.random().toString(36).substring(7),
                text: '',
                audio: downloadURL,
                createdAt: new Date(),
                user: { _id: currentUser.uid, name: userData?.name, avatar: userData?.photoURL },
            };
            onSend([audioMessage]);
        } catch (error) {
            console.error("Audio upload failed:", error);
            Alert.alert("Error", "Failed to send voice note.");
        }
    };

    const playSound = async (audioUri) => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
            setSound(newSound);
            await newSound.playAsync();
        } catch (error) {
            console.error("Error playing sound:", error);
            Alert.alert("Playback Error", "Could not play audio.");
        }
    };

    const handleTextToSpeech = (text) => {
        if (!text) return;
        Speech.speak(text, { language: userData?.preferredLanguage || 'en' });
    };

    const onSend = useCallback(async (newMessages = []) => {
        if (!chatId || !userData || !currentUser) return;
        const msg = newMessages[0];
        
        const msgToSend = { 
            ...msg, 
            userId: currentUser.uid, 
            userName: userData.name || 'User', 
            userAvatar: userData.photoURL, 
            createdAt: serverTimestamp() 
        };

        try {
            // PRODUCTION PATH: "chats/{id}/messages"
            await addDoc(collection(db, `chats/${chatId}/messages`), msgToSend);
            
            const lastMsgText = msg.text ? msg.text : '🎤 Voice Message';
            // PRODUCTION PATH: "chats/{id}"
            await updateDoc(doc(db, "chats", chatId), { 
                lastMessage: { text: lastMsgText, createdAt: serverTimestamp() } 
            });
            
            // PRODUCTION PATH: "notifications"
            await addDoc(collection(db, "notifications"), {
                userId: recipientId,
                message: `New message from ${userData.name || 'User'}: ${lastMsgText}`,
                read: false,
                createdAt: serverTimestamp(),
                screen: 'Chat',
                params: { chatId: chatId, recipientId: currentUser.uid, recipientName: userData.name }
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }, [chatId, userData, recipientId, currentUser]);

    // --- RENDERERS ---

    const renderMessageAudio = (props) => {
        return (
            <View style={[styles.audioContainer, props.position === 'right' ? styles.audioRight : styles.audioLeft]}>
                <TouchableOpacity onPress={() => playSound(props.currentMessage.audio)}>
                    <MaterialCommunityIcons name="play-circle" size={35} color={props.position === 'right' ? '#fff' : '#2E8B57'} />
                </TouchableOpacity>
                <Text style={{ color: props.position === 'right' ? '#fff' : '#333', marginLeft: 10, fontWeight: '600' }}>
                    Voice Note
                </Text>
            </View>
        );
    };

    const renderBubble = (props) => {
        const hasText = props.currentMessage.text ? true : false;
        return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 5 }}>
                {props.position === 'left' && hasText && (
                    <TouchableOpacity onPress={() => handleTextToSpeech(props.currentMessage.text)} style={styles.speechIconLeft}>
                        <MaterialCommunityIcons name="volume-high" size={24} color="#555" />
                    </TouchableOpacity>
                )}
                
                <Bubble 
                    {...props} 
                    wrapperStyle={{
                        right: { backgroundColor: '#2E8B57' },
                        left: { backgroundColor: '#fff' }
                    }}
                    textStyle={{
                        right: { color: '#fff' },
                        left: { color: '#000' }
                    }}
                />

                {props.position === 'right' && hasText && (
                    <TouchableOpacity onPress={() => handleTextToSpeech(props.currentMessage.text)} style={styles.speechIconRight}>
                        <MaterialCommunityIcons name="volume-high" size={24} color="#2E8B57" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderInputToolbar = (props) => (
        <InputToolbar {...props} containerStyle={styles.inputToolbar} primaryStyle={{ alignItems: 'center' }} />
    );

    const renderComposer = (props) => (
        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
            <Composer {...props} textInputStyle={styles.composer} placeholder={isRecording ? "Recording..." : "Type a message..."} />
            <TouchableOpacity 
                onPress={handleMicPress} 
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
            >
                <MaterialCommunityIcons 
                    name={isRecording ? "stop" : "microphone"} 
                    size={24} 
                    color="#fff" 
                />
            </TouchableOpacity>
        </View>
    );

    const renderSend = (props) => (
        <Send {...props}>
            <View style={styles.sendContainer}>
                <MaterialCommunityIcons name="send" size={32} color="#2E8B57" />
            </View>
        </Send>
    );

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    if (!currentUser) return <View style={styles.centered}><Text>Please log in.</Text></View>;

    return (
        <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{ _id: currentUser.uid }}
            renderBubble={renderBubble}
            renderMessageAudio={renderMessageAudio}
            renderInputToolbar={renderInputToolbar}
            renderComposer={renderComposer}
            renderSend={renderSend}
            alwaysShowSend
            messagesContainerStyle={{ backgroundColor: '#f5f5f5' }}
        />
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    inputToolbar: {
        backgroundColor: '#fff',
        paddingTop: 5,
        paddingBottom: 5,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    composer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 10, 
        marginRight: 10,
        marginLeft: 10,
    },
    micButton: {
        backgroundColor: '#2E8B57',
        padding: 10,
        borderRadius: 25,
        marginRight: 15,
        marginBottom: 1,
    },
    micButtonRecording: {
        backgroundColor: 'red',
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 5,
    },
    speechIconLeft: { marginRight: 4, padding: 4, marginBottom: 2 },
    speechIconRight: { marginLeft: 4, padding: 4, marginBottom: 2 },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
        minWidth: 150,
        margin: 5,
    },
    audioRight: { backgroundColor: '#2E8B57' },
    audioLeft: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
});