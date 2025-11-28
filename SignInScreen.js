import { Octicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha'; 
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig'; 
import { collection, getDocs, limit, query, where, doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const FarmerSignInForm = ({ onSignIn, loading, onForgotPassword }) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Octicons name="person" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Email or Phone Number"
          placeholderTextColor="#666"
          style={styles.input}
          keyboardType="default"
          autoCapitalize="none"
          value={credential}
          onChangeText={setCredential}
        />
      </View>
      <View style={styles.inputContainer}>
        <Octicons name="lock" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#666"
          style={styles.input}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Octicons name={showPassword ? "eye" : "eye-closed"} size={20} color="#555" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => onSignIn({ credential, password })}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In as Farmer</Text>}
      </TouchableOpacity>
    </View>
  );
};

const CustomerSignInForm = ({ onSignIn, loading, onForgotPassword }) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Octicons name="person" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Email or Phone Number"
          placeholderTextColor="#666"
          style={styles.input}
          autoCapitalize="none"
          value={credential}
          onChangeText={setCredential}
        />
      </View>
      <View style={styles.inputContainer}>
        <Octicons name="lock" size={24} color="#555" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#666"
          style={styles.input}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Octicons name={showPassword ? "eye" : "eye-closed"} size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={() => onSignIn({ credential, password })}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In as Customer</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default function SignInScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Farmer');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef(null);
  
  // --- Forgot Password / OTP States ---
  const [modalVisible, setModalVisible] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false); 
  const [resetInput, setResetInput] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const farmerBg = require('../assets/nature.jpg');  
  const customerBg = require('../assets/nature.jpg');

  const handleSignIn = async (credentials) => {
    setLoading(true);
    try {
      const { credential, password } = credentials;
      if (!credential || !password) throw new Error("Please enter your credentials.");

      let emailToSignIn = credential.trim().toLowerCase();
      const isPhone = /^\d{10}$/.test(emailToSignIn);

      if (isPhone) {
          if (activeTab === 'Farmer') {
             emailToSignIn = `+91${emailToSignIn}@farm.raithamitra.com`;
          } else {
             throw new Error("Customers usually sign in with Email.");
          }
      } 
      
      await signInWithEmailAndPassword(auth, emailToSignIn, password);

    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          msg = "Account not found. If you changed your email, please login with that new email.";
      } else if (error.code === 'auth/wrong-password') {
          msg = "Incorrect password.";
      }
      Alert.alert("Sign In Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 1: Handle Forgot Password Input ---
  const handleForgotPassword = async () => {
    if (!resetInput) {
      Alert.alert("Error", "Please enter your email or phone number.");
      return;
    }
    
    setResetLoading(true);
    let input = resetInput.trim().toLowerCase();
    const isPhone = /^\d{10}$/.test(input);

    try {
        // Case 1: Farmer Phone Number -> Trigger OTP Login
        if (isPhone && activeTab === 'Farmer') {
            const phoneNumber = `+91${input}`;
            try {
                const phoneProvider = new PhoneAuthProvider(auth);
                const vId = await phoneProvider.verifyPhoneNumber(
                    phoneNumber,
                    recaptchaVerifier.current
                );
                setVerificationId(vId);
                setModalVisible(false); 
                setOtpVisible(true);    
                setResetLoading(false);
                Alert.alert("OTP Sent", `Please enter the code sent to ${phoneNumber}`);
                return;
            } catch (err) {
                if (err.code === 'auth/too-many-requests') {
                    throw new Error("Too many OTP requests. Firebase has blocked requests from this device temporarily. Please try again later.");
                }
                throw new Error("Failed to send OTP. " + err.message);
            }
        }

        // Case 2: Email Address (or Customer) -> Send Reset Link
        if (isPhone && activeTab !== 'Farmer') {
             throw new Error("Customers must use Email for password reset.");
        }

        await sendPasswordResetEmail(auth, input);
        Alert.alert("Reset Link Sent", `Link sent to: ${input}\nCheck your inbox.`);
        setModalVisible(false); 
        setResetInput('');

    } catch (error) {
        Alert.alert("Error", error.message);
    } finally {
        setResetLoading(false);
    }
  };

  // --- Step 2: Verify OTP and ROBUST DATA MIGRATION ---
  const handleVerifyOtp = async () => {
      if (!otpCode || !verificationId) return;
      setResetLoading(true);
      try {
          const credential = PhoneAuthProvider.credential(
            verificationId,
            otpCode
          );
          
          // 1. Sign In (This creates a Phone Auth user if not linked)
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          // 2. Check if this user ID already has a profile
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          // Check migration status (prevent double copying)
          const isAlreadyMigrated = userDocSnap.exists() && userDocSnap.data().migratedFrom;

          // 3. SEARCH FOR OLD ACCOUNT regardless of whether current profile exists
          // This fixes the issue where a "blank" profile prevented migration.
          const fullPhone = user.phoneNumber || ''; // e.g. +919876543210
          const rawPhone = fullPhone.replace('+91', '');
          
          // Check both formats: raw (987...) and full (+91987...)
          const q = query(
              collection(db, "users"), 
              where("phone", "in", [rawPhone, fullPhone]),
              where("role", "==", activeTab)
          );
          
          const querySnapshot = await getDocs(q);
          
          let oldDoc = null;
          querySnapshot.forEach(doc => {
              if (doc.id !== user.uid) {
                  oldDoc = doc; // Found an orphan account with same phone
              }
          });

          // 4. Perform Migration if Needed
          if (oldDoc && !isAlreadyMigrated) {
              const oldUid = oldDoc.id;
              const oldData = oldDoc.data();
              const newUid = user.uid;

              console.log(`Migrating data from ${oldUid} to ${newUid}`);

              // A. Copy Profile Data (Merge to preserve any new fields)
              await setDoc(userDocRef, {
                  ...oldData,
                  uid: newUid, 
                  migratedFrom: oldUid, 
                  recoveredAt: serverTimestamp()
              }, { merge: true });

              // B. Migrate Related Data (Products, Orders, Payments)
              const batch = writeBatch(db);
              let operationsCount = 0;

              const safeBatchUpdate = (docRef, data) => {
                  if (operationsCount < 490) { 
                      batch.update(docRef, data);
                      operationsCount++;
                  }
              };

              try {
                  // 1. Products (if Farmer)
                  if (activeTab === 'Farmer') {
                      const productsQ = query(collection(db, "products"), where("farmerId", "==", oldUid));
                      const productsSnap = await getDocs(productsQ);
                      productsSnap.forEach((pDoc) => safeBatchUpdate(pDoc.ref, { farmerId: newUid }));
                  }

                  // 2. Orders (Check both fields)
                  const ordersFarmerQ = query(collection(db, "orders"), where("farmerId", "==", oldUid));
                  const ordersCustomerQ = query(collection(db, "orders"), where("customerId", "==", oldUid));
                  
                  const [ordersF, ordersC] = await Promise.all([getDocs(ordersFarmerQ), getDocs(ordersCustomerQ)]);
                  
                  ordersF.forEach((oDoc) => safeBatchUpdate(oDoc.ref, { farmerId: newUid }));
                  ordersC.forEach((oDoc) => safeBatchUpdate(oDoc.ref, { customerId: newUid }));

                  // 3. Payments
                  const paymentsQ = query(collection(db, "payments"), where("userId", "==", oldUid));
                  const paymentsSnap = await getDocs(paymentsQ);
                  paymentsSnap.forEach((payDoc) => safeBatchUpdate(payDoc.ref, { userId: newUid }));

                  // 4. Feedbacks
                  const feedbacksQ = query(collection(db, "feedbacks"), where("customerId", "==", oldUid));
                  const feedbacksSnap = await getDocs(feedbacksQ);
                  feedbacksSnap.forEach((fDoc) => safeBatchUpdate(fDoc.ref, { customerId: newUid }));

                  if (operationsCount > 0) {
                      await batch.commit();
                      Alert.alert(
                          "Account & Data Restored", 
                          `Welcome back! We found your old account and transferred ${operationsCount} records (Products, Orders, etc.) to your new login.`
                      );
                  } else {
                      Alert.alert("Account Restored", "Your profile details have been recovered.");
                  }

              } catch (migrationError) {
                  console.log("Migration Error:", migrationError);
                  // Even if batch fails, profile is copied.
                  Alert.alert("Partial Recovery", "Profile restored. Some items might need manual transfer.");
              }
          } else if (!userDocSnap.exists()) {
              // No old account & No current profile -> Truly New User
              await setDoc(userDocRef, {
                  phone: rawPhone,
                  role: activeTab,
                  createdAt: serverTimestamp(),
                  isNewUser: true
              });
          }
          
          setOtpVisible(false);
          setOtpCode('');

      } catch (error) {
          console.log(error);
          let msg = "Invalid OTP code.";
          if (error.code === 'auth/invalid-verification-code') msg = "Incorrect OTP.";
          Alert.alert("Login Failed", msg);
      } finally {
          setResetLoading(false);
      }
  };

  return (
    <ImageBackground 
        source={activeTab === 'Farmer' ? farmerBg : customerBg} 
        style={styles.backgroundImage}
        resizeMode="cover"
    >
        <FirebaseRecaptchaVerifierModal
            ref={recaptchaVerifier}
            firebaseConfig={auth.app.options} 
        />

        <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Sign in to RaithaMitra</Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('Farmer')} style={[styles.tab, activeTab === 'Farmer' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab === 'Farmer' && styles.activeTabText]}>Farmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('Customer')} style={[styles.tab, activeTab === 'Customer' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab === 'Customer' && styles.activeTabText]}>Customer</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    {activeTab === 'Farmer'
                        ? <FarmerSignInForm onSignIn={handleSignIn} loading={loading} onForgotPassword={() => setModalVisible(true)} />
                        : <CustomerSignInForm onSignIn={handleSignIn} loading={loading} onForgotPassword={() => setModalVisible(true)} />
                    }
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('SignUp', { role: activeTab })}>
                    <Text style={styles.switchText}>Don't have an account? <Text style={{ color: '#2E8B57', fontWeight: 'bold' }}>Sign Up</Text></Text>
                </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
            </SafeAreaView>

            {/* --- MODAL 1: Initial Input --- */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Account Recovery</Text>
                  <Text style={styles.modalSubtitle}>
                    Enter your Email to reset password.{'\n'}
                    OR enter your Phone Number to login via OTP.
                  </Text>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Email or Phone Number"
                    placeholderTextColor="#999"
                    value={resetInput}
                    onChangeText={setResetInput}
                    keyboardType="default"
                    autoCapitalize="none"
                  />

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.submitButton]} 
                      onPress={handleForgotPassword}
                      disabled={resetLoading}
                    >
                      {resetLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Proceed</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* --- MODAL 2: OTP Input --- */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={otpVisible}
              onRequestClose={() => setOtpVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Verify OTP</Text>
                  <Text style={styles.modalSubtitle}>Enter the 6-digit code sent to your phone.</Text>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="123456"
                    placeholderTextColor="#999"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setOtpVisible(false)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.submitButton]} 
                      onPress={handleVerifyOtp}
                      disabled={resetLoading}
                    >
                      {resetLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Login</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

        </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1b5e20', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  
  tabContainer: {
    flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 25, padding: 4,
    borderWidth: 1, borderColor: '#ddd'
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
  activeTab: {
    backgroundColor: '#2E8B57',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tabText: { fontSize: 16, color: '#555', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  
  card: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      marginBottom: 20
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
  eyeIcon: { padding: 10 },

  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginRight: 5,
  },
  forgotPasswordText: {
    color: '#2E8B57',
    fontWeight: '600',
    fontSize: 14,
  },

  button: {
    width: '100%', padding: 16, backgroundColor: '#2E8B57',
    borderRadius: 12, alignItems: 'center', marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: { marginTop: 10, fontSize: 16, color: '#333' },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#2E8B57',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});