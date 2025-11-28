import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
// import * as FaceDetector from 'expo-face-detector'; 
import { updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth'; // Changed updateEmail to verifyBeforeUpdateEmail
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../firebaseconfig';

const getBlobFromUri = async (uri) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(xhr.response);
        };
        xhr.onerror = function (e) {
            console.log(e);
            reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
    });
};

const languages = [
    { label: 'English', value: 'en' },
    { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' },
    { label: 'తెలుగు (Telugu)', value: 'te' },
    { label: 'हिन्दी (Hindi)', value: 'hi' },
    { label: 'தமிழ் (Tamil)', value: 'ta' },
];

export default function ProfileSetupScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const isEditing = route.params?.isEditing || false;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isNewPhoto, setIsNewPhoto] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('en');

    const [loading, setLoading] = useState(true); 
    const [uploading, setUploading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setName(data.name || '');
                setAddress(data.address || '');
                setPhoto(data.photoURL || null);
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setUserRole(data.role || '');
                setPreferredLanguage(data.preferredLanguage || 'en');
            }
            setLoading(false);
        };
        fetchUserData();
    }, []);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            cameraType: ImagePicker.CameraType.front,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setPhoto(uri);
            setIsNewPhoto(true);
        }
    };

    const fetchLocation = async () => {
        setFetchingLocation(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access location was denied');
            setFetchingLocation(false);
            return;
        }
        try {
            let location = await Location.getCurrentPositionAsync({});
            let geocode = await Location.reverseGeocodeAsync(location.coords);
            if (geocode.length > 0) {
                const { street, city, region, postalCode, country } = geocode[0];
                const formattedAddress = `${street || ''}, ${city || ''}, ${region || ''} ${postalCode || ''}, ${country || ''}`.replace(/^,|,$/g, '').trim();
                setAddress(formattedAddress);
            }
        } catch (error) {
            Alert.alert("Location Error", "Could not fetch address. Please enter it manually.");
        } finally {
            setFetchingLocation(false);
        }
    };

    const handleSaveProfile = async () => {
        const user = auth.currentUser;
        if (!user) {
            return Alert.alert("Error", "You must be logged in to save your profile.");
        }
        
        if (!name || !name.trim()) {
            return Alert.alert("Required Fields", "Please enter your name.");
        }

        if (!photo) {
            return Alert.alert("Required Fields", "Please take a profile picture.");
        }

        setUploading(true);
        try {
            // --- 1. AUTH EMAIL UPDATE (Priority) ---
            // Force reload to get fresh state
            try { await user.reload(); } catch (e) {}
            const freshUser = auth.currentUser;
            const currentAuthEmail = freshUser.email?.toLowerCase() || '';
            const newEmail = email.trim().toLowerCase();

            // Check if current email is "Synthetic" (Farmer default)
            const isSynthetic = currentAuthEmail.includes('@farm.raithamitra.com');

            // Update Logic: If user typed a new email AND (it's different OR current is synthetic)
            if (newEmail && newEmail !== currentAuthEmail && (userRole === 'Farmer' || isSynthetic)) {
                try {
                    // FIX: Use verifyBeforeUpdateEmail instead of updateEmail
                    await verifyBeforeUpdateEmail(freshUser, newEmail);
                    console.log("Verification email sent for update.");
                    
                    Alert.alert(
                        "Verification Required", 
                        `We have sent a verification link to ${newEmail}.\n\nPlease click the link in your inbox to confirm this change. Your login email will update automatically after verification.`
                    );
                } catch (emailError) {
                    console.log("Email update error:", emailError);
                    if (emailError.code === 'auth/requires-recent-login') {
                        Alert.alert(
                            "Re-login Required", 
                            "To update your email, Firebase requires a fresh login. Please Sign Out and Sign In again, then try saving."
                        );
                        setUploading(false);
                        return; // Stop here
                    }
                    // If invalid email or taken, we must alert and stop
                    Alert.alert("Email Update Failed", emailError.message);
                    setUploading(false);
                    return;
                }
            }

            // --- 2. IMAGE UPLOAD ---
            let downloadURL = photo;
            if (isNewPhoto && photo && !photo.startsWith('http')) {
                const blob = await getBlobFromUri(photo);
                const storageRef = ref(storage, `profilePictures/${user.uid}`);
                const metadata = { contentType: 'image/jpeg' };
                
                await uploadBytes(storageRef, blob, metadata);
                downloadURL = await getDownloadURL(storageRef);
                
                // @ts-ignore
                if (blob.close) blob.close();
            }

            // --- 3. FIRESTORE & PROFILE UPDATE ---
            await updateProfile(user, {
                displayName: name ? name.trim() : "",
                photoURL: downloadURL
            });

            const userDocRef = doc(db, 'users', user.uid);
            const dataToSave = {
                name: name ? name.trim() : "", 
                address: address.trim(),
                photoURL: downloadURL,
            };

            // Save email/phone logic
            if (userRole === 'Farmer' || isSynthetic) {
                dataToSave.preferredLanguage = preferredLanguage;
                if (newEmail) dataToSave.email = newEmail;
            }

            if (userRole === 'Customer' && phone) {
                dataToSave.phone = phone.trim();
            }

            await setDoc(userDocRef, dataToSave, { merge: true });

            // If we just sent a verification email, the success message should reflect that
            if (newEmail && newEmail !== currentAuthEmail) {
               // Alert already shown for verification
            } else {
               Alert.alert("Success", "Profile updated successfully!");
            }
            
            if (navigation.canGoBack()) navigation.goBack();

        } catch (error) {
            console.error("Error saving profile: ", error);
            Alert.alert("Error", "Could not save your profile. " + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    // Determine if we should show email input
    // We show it if user is Farmer OR if their current email looks synthetic
    const showEmailInput = userRole === 'Farmer' || auth.currentUser?.email?.includes('@farm.raithamitra.com');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.title}>{isEditing ? "Edit Profile" : "Profile Setup"}</Text>
                
                <Text style={styles.welcomeText}>Hello{name ? `, ` : ''}<Text style={{fontWeight: 'bold', color: '#2E8B57'}}>{name}</Text></Text>

                <TouchableOpacity style={styles.imagePicker} onPress={takePhoto}>
                    {photo ? (
                        <View>
                            <Image source={{ uri: photo }} style={styles.profileImage} />
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-circle" size={32} color="#2E8B57" style={{backgroundColor: 'white', borderRadius: 16}} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={50} color="#888" />
                            <Text style={styles.imagePickerText}>Take a Selfie</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Added Name Input Field */}
                <View style={styles.inputContainer}>
                    <Octicons name="person" size={20} color="#888" style={styles.icon} />
                    <TextInput 
                        placeholder="Your Name" 
                        style={styles.input} 
                        value={name} 
                        onChangeText={setName} 
                    />
                </View>

                {/* Smart Email Input - Shows for Farmers OR Synthetic Emails */}
                {showEmailInput && (
                    <View style={styles.inputContainer}>
                        <Octicons name="mail" size={20} color="#888" style={styles.icon} />
                        <TextInput 
                            placeholder="Update Email (Required for Password Reset)" 
                            style={styles.input} 
                            value={email} 
                            onChangeText={setEmail} 
                            keyboardType="email-address" 
                            autoCapitalize="none" 
                        />
                    </View>
                )}

                {isEditing && userRole === 'Customer' && (
                     <View style={styles.inputContainer}>
                        <Octicons name="device-mobile" size={20} color="#888" style={styles.icon} />
                        <TextInput placeholder="Phone Number" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="#888" style={styles.icon} />
                    <TextInput placeholder="Your Address" style={styles.input} value={address} onChangeText={setAddress} multiline />
                </View>

                <TouchableOpacity style={styles.locationButton} onPress={fetchLocation} disabled={fetchingLocation}>
                    {fetchingLocation ? <ActivityIndicator color="#2E8B57" /> : <><MaterialCommunityIcons name="crosshairs-gps" size={20} color="#2E8B57" /><Text style={styles.locationButtonText}>Use Current Location</Text></>}
                </TouchableOpacity>
                
                {(userRole === 'Farmer' || !userRole) && (
                    <View>
                        <Text style={styles.label}>Preferred Language for Audio</Text>
                        <View style={styles.languageContainer}>
                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang.value}
                                    style={[styles.languageButton, preferredLanguage === lang.value && styles.selectedLanguageButton]}
                                    onPress={() => setPreferredLanguage(lang.value)}
                                >
                                    <Text style={[styles.languageButtonText, preferredLanguage === lang.value && styles.selectedLanguageButtonText]}>
                                        {lang.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
                
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={uploading}>
                    {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
    welcomeText: { fontSize: 18, textAlign: 'center', marginBottom: 25, color: '#555' },
    
    imagePicker: { alignItems: 'center', marginBottom: 30 },
    profileImage: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#f0f0f0' },
    imagePlaceholder: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
    imagePickerText: { marginTop: 10, color: '#555' },
    
    verifiedBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, marginBottom: 15, paddingHorizontal: 15 },
    icon: { marginRight: 10 },
    input: { flex: 1, minHeight: 50, fontSize: 16, paddingVertical: 10 },
    locationButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', padding: 15, borderRadius: 10,
        borderWidth: 1, borderColor: '#2E8B57', marginBottom: 20,
    },
    locationButtonText: { color: '#2E8B57', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    saveButton: { padding: 15, backgroundColor: '#2E8B57', borderRadius: 10, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 10 },
    languageContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    languageButton: {
        paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20,
        backgroundColor: '#f0f0f0', marginRight: 10, marginBottom: 10,
    },
    selectedLanguageButton: { backgroundColor: '#2E8B57' },
    languageButtonText: { color: '#333', fontWeight: '500' },
    selectedLanguageButtonText: { color: '#fff' },
});