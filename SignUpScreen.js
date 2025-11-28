import { Octicons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseconfig';

const FarmerSignUpForm = ({ onSignUp, loading }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Octicons name="device-mobile" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="10-Digit Phone Number"
          placeholderTextColor="#666"
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />
      </View>
      <View style={styles.inputContainer}>
        <Octicons name="lock" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="6-Digit Password"
          placeholderTextColor="#666"
          style={styles.input}
          keyboardType="number-pad"
          secureTextEntry={!showPassword} // Toggle secure entry
          value={password}
          onChangeText={setPassword}
          maxLength={6}
        />
        {/* Eye Icon for Toggling Password */}
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Octicons name={showPassword ? "eye" : "eye-closed"} size={20} color="#555" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => onSignUp({ phone, password })}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Farmer Account</Text>}
      </TouchableOpacity>
    </View>
  );
};

const CustomerSignUpForm = ({ onSignUp, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Octicons name="person" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#666"
          style={styles.input}
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.inputContainer}>
        <Octicons name="mail" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#666"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.inputContainer}>
        <Octicons name="device-mobile" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="10-Digit Phone Number"
          placeholderTextColor="#666"
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />
      </View>
      <View style={styles.inputContainer}>
        <Octicons name="lock" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#666"
          style={styles.input}
          secureTextEntry={!showPassword} // Toggle secure entry
          value={password}
          onChangeText={setPassword}
        />
        {/* Eye Icon for Toggling Password */}
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Octicons name={showPassword ? "eye" : "eye-closed"} size={20} color="#555" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => onSignUp({ name, email, phone, password })}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Customer Account</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default function SignUpScreen({ route, navigation }) {
  const { role } = route.params || { role: 'Customer' };
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  // --- Background Video ---
  // Using v_city.mp4 for both temporarily to fix build error
  const customerVideo = require('../assets/v_city.mp4');
  // const farmerVideo = require('../assets/farm.mp4');
  const farmerVideo = customerVideo; 

  const backgroundVideo = role === 'Farmer' ? farmerVideo : customerVideo;

  // --- Configure Audio Mode ---
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

  const handleSignUp = async (credentials) => {
    setLoading(true);
    try {
      if (role === 'Farmer') {
        const { phone, password } = credentials;
        if (phone.length !== 10 || password.length !== 6) {
          Alert.alert("Error", "Phone must be 10 digits and password 6 digits.");
          setLoading(false);
          return;
        }
        const email = `+91${phone}@farm.raithamitra.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // PRODUCTION PATH: "users" (Matches your Security Rules)
        await setDoc(doc(db, "users", user.uid), {
          role: "Farmer",
          email: email,
          phone,
          uid: user.uid,
          photoURL: null,
        });

      } else {
        const { name, email, phone, password } = credentials;
        if (!name || !email || phone.length !== 10 || password.length < 6) {
          Alert.alert("Error", "Please fill all fields correctly. Phone must be 10 digits and password at least 6 characters.");
          setLoading(false);
          return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;

        // PRODUCTION PATH: "users" (Matches your Security Rules)
        await setDoc(doc(db, "users", user.uid), {
          role: "Customer",
          name: name.trim(),
          email: normalizedEmail,
          phone,
          uid: user.uid,
          photoURL: null,
        });
      }
    } catch (error) {
      Alert.alert("Sign Up Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.backgroundVideo}
        source={backgroundVideo}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={true}
        isMuted={true}
      />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Join RaithaMitra</Text>
                <Text style={styles.subtitle}>Create your {role} account</Text>
              </View>
              
              {/* Wraps both Form and Link inside the Card Container */}
              <View style={styles.card}>
                {role === 'Farmer'
                  ? <FarmerSignUpForm onSignUp={handleSignUp} loading={loading} />
                  : <CustomerSignUpForm onSignUp={handleSignUp} loading={loading} />
                }
                
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.switchText}>
                    Already have an account? <Text style={{ color: '#2E8B57', fontWeight: 'bold' }}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: 'transparent' 
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#1b5e20',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#333', 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    alignItems: 'center', // Ensures children are centered
  },
  formContainer: { width: '100%', alignItems: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', height: 55, backgroundColor: '#fff',
    borderRadius: 12, marginBottom: 15, paddingHorizontal: 15,
    borderWidth: 1, borderColor: '#ddd'
  },
  icon: { marginRight: 15 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#333' },
  eyeIcon: { padding: 5 }, // Styling for eye icon touch area
  button: {
    width: '100%', padding: 16, backgroundColor: '#2E8B57',
    borderRadius: 12, alignItems: 'center', marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: { marginTop: 20, fontSize: 16, color: '#000', fontWeight: '600' },
});